import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

import * as gemini from "./server/lib/gemini";
import * as youtube from "./server/lib/youtube";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Logging
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// --- API ROUTES ---

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// AI Scenario Generation
app.post("/api/generate-scenario", async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: "موضوع الزامی است" });

  try {
    const data = await gemini.generateScenario(topic);
    res.json(data);
  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message || "خطا در برقراری ارتباط با هوش مصنوعی" });
  }
});

// AI Image Generation
app.post("/api/generate-image", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "پرامپت الزامی است" });

  try {
    const imageUrl = await gemini.generateImage(prompt);
    res.json({ imageUrl });
  } catch (error: any) {
    console.error("Image Gen Error:", error);
    res.status(500).json({ error: error.message || "خطا در تولید تصویر" });
  }
});

// YouTube Auth URL
app.get("/api/auth/url", (req, res) => {
  try {
    const url = youtube.getAuthUrl();
    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// YouTube Auth Callback
app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("No code provided");

  try {
    await youtube.setTokens(code as string);
    res.send(`
      <html>
        <body style="background: #0f0f0f; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
          <div style="text-align: center;">
            <h1 style="color: #ff0000;">✓ متصل شد</h1>
            <p>می‌توانید این پنجره را ببندید.</p>
            <script>
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              setTimeout(() => window.close(), 2000);
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Auth Error:", error);
    res.status(500).send("Authentication failed");
  }
});

// YouTube Upload
app.post("/api/youtube/upload", async (req, res) => {
  const { videoData, title, description } = req.body;
  if (!videoData) return res.status(400).json({ error: "دیتا ویدیو الزامی است" });

  try {
    const videoId = await youtube.uploadToYoutube(videoData, title, description);
    res.json({ success: true, videoId });
  } catch (error: any) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: error.message || "خطا در آپلود ویدیو" });
  }
});

// Catch-all API routes (404 for API only)
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// --- VITE / STATIC MIDDLEWARE ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ 
      server: { middlewareMode: true, hmr: false }, 
      appType: "spa" 
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("[GLOBAL ERROR]", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
