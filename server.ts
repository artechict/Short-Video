import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import { Readable } from "stream";

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

const PORT = 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY!,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// YouTube OAuth Setup
const oauth2Client = new OAuth2Client(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  `${process.env.APP_URL}/auth/callback`
);

let userTokens: any = null;

// --- API ROUTES ---

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    hasApiKey: !!process.env.GEMINI_API_KEY,
    env: process.env.NODE_ENV || "development"
  });
});

// 1. Generate Scenario (Script)
app.post("/api/generate-scenario", async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic is required" });

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `شما یک نویسنده حرفه ای برای یوتیوب شورت هستید. یک سناریو ۶۰ ثانیه ای برای یوتیوب شورت با موضوع "${topic}" بنویسید.
      پاسخ را دقیقاً در قالب JSON برگردانید که شامل فیلدهای زیر باشد:
      - title: عنوان ویدیو (فارسی)
      - description: توضیحات ویدیو برای یوتیوب (فارسی)
      - scenes: آرایه ای از ۵ صحنه، هر کدام شامل:
        - narration: متنی که گوینده باید بگوید (فارسی)
        - visual_description: توصیف دقیق تصویر برای تولید تصویر (انگلیسی)
        - onscreen_text: متنی که باید روی صفحه نمایش داده شود (فارسی کوتاه)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  narration: { type: Type.STRING },
                  visual_description: { type: Type.STRING },
                  onscreen_text: { type: Type.STRING }
                },
                required: ["narration", "visual_description", "onscreen_text"]
              }
            }
          },
          required: ["title", "description", "scenes"]
        }
      }
    });

    const text = result.text;
    if (!text) {
      throw new Error("مدل هیچ پاسخی تولید نکرد (احتمالاً به دلیل فیلترهای ایمنی)");
    }

    try {
      res.json(JSON.parse(text));
    } catch (parseError) {
      console.error("JSON Parse Error. Raw text:", text);
      res.status(500).json({ error: "خطا در پردازش پاسخ هوش مصنوعی", rawText: text });
    }
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Generate Image for a scene
app.post("/api/generate-image", async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ text: `A vibrant, high-quality cinematic illustration of: ${prompt}. Aspect ratio 9:16 for YouTube Shorts.` }],
      config: {
        imageConfig: {
          aspectRatio: "9:16"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return res.json({ imageUrl: `data:image/png;base64,${part.inlineData.data}` });
      }
    }
    res.status(500).json({ error: "No image generated" });
  } catch (error: any) {
    console.error("Image Gen Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. YouTube Auth URL
app.get("/api/auth/url", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
    prompt: 'consent'
  });
  res.json({ url });
});

// 4. Auth Callback
app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    userTokens = tokens;
    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f0f2f5;">
          <div style="text-align: center; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h2 style="color: #4CAF50;">اتصال با موفقیت انجام شد!</h2>
            <p>این پنجره به طور خودکار بسته خواهد شد.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send("Authentication failed");
  }
});

// 5. Upload to YouTube
app.post("/api/youtube/upload", async (req, res) => {
  if (!userTokens) return res.status(401).json({ error: "Not authenticated" });
  const { videoData, title, description } = req.body; // videoData is base64
  
  try {
    oauth2Client.setCredentials(userTokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    
    // Convert base64 to buffer
    const buffer = Buffer.from(videoData.split(',')[1], 'base64');
    const readableStream = new Readable();
    readableStream._read = () => {};
    readableStream.push(buffer);
    readableStream.push(null);

    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          categoryId: '22', // People & Blogs
          tags: ['shorts', 'ai', 'generated']
        },
        status: {
          privacyStatus: 'public', // Defaulting to public as requested
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: readableStream
      }
    });

    res.json({ success: true, videoId: response.data.id });
  } catch (error: any) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- VITE MIDDLEWARE ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
