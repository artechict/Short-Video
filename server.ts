import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { Readable } from "stream";

dotenv.config();

const app = express();
const PORT = 3000;

// Init Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ 
  apiKey: GEMINI_API_KEY!,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

// YouTube OAuth
const oauth2Client = new OAuth2Client(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  `${process.env.APP_URL}/auth/callback`
);
let userTokens: any = null;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Professional Logging
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[API LOG] ${new Date().toLocaleTimeString()} ${req.method} ${req.url}`);
  }
  next();
});

// --- API ROUTES ---

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// 1. Generate Scenario
app.post("/api/generate-scenario", async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: "موضوع الزامی است" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `شما یک نویسنده حرفه ای برای یوتیوب شورت هستید. یک سناریو ۶۰ ثانیه ای برای یوتیوب شورت با موضوع "${topic}" بنویسید.
      پاسخ را دقیقاً در قالب JSON برگردانید که شامل فیلدهای title, description و آرایه scenes (هر صحنه شامل: narration, visual_description (English), onscreen_text) باشد.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "description", "scenes"],
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["narration", "visual_description", "onscreen_text"],
                properties: {
                  narration: { type: Type.STRING },
                  visual_description: { type: Type.STRING },
                  onscreen_text: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("AI Scenario Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Generate Image
app.post("/api/generate-image", async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ text: `High quality cinematic 9:16 portrait: ${prompt}` }],
      config: { imageConfig: { aspectRatio: "9:16" } }
    });

    const part = (response.candidates?.[0]?.content?.parts || []).find(p => p.inlineData);
    if (part?.inlineData) {
      return res.json({ imageUrl: `data:image/png;base64,${part.inlineData.data}` });
    }
    throw new Error("No image generated");
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. YouTube Auth
app.get("/api/auth/url", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
    prompt: 'consent'
  });
  res.json({ url });
});

app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    userTokens = tokens;
    res.send(`<html><body><script>window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');window.close();</script></body></html>`);
  } catch (error) {
    res.status(500).send("Auth fail");
  }
});

// 4. YouTube Upload
app.post("/api/youtube/upload", async (req, res) => {
  if (!userTokens) return res.status(401).json({ error: "Not authenticated" });
  const { videoData, title, description } = req.body;
  
  try {
    oauth2Client.setCredentials(userTokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const buffer = Buffer.from(videoData.split(',')[1], 'base64');
    const readableStream = new Readable();
    readableStream._read = () => {};
    readableStream.push(buffer);
    readableStream.push(null);

    const result = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: { title, description, categoryId: '22' },
        status: { privacyStatus: 'public', selfDeclaredMadeForKids: false }
      },
      media: { body: readableStream }
    });
    res.json({ success: true, videoId: result.data.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Error Handler
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// --- VITE MIDDLEWARE ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(process.cwd(), 'dist', 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server ready at http://0.0.0.0:${PORT}`);
  });
}

startServer();
