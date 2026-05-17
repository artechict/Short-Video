import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

import * as gemini from "./server/lib/gemini";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: '*', // Allow all for preview flexibility
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));

// Professional Logging
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[API REQUEST] ${new Date().toISOString()} | ${req.method} ${req.url}`);
  }
  next();
});

// Explicit OPTIONS handler for CORS preflight
app.options('*', cors());

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
    console.log(`
    -------------------------------------------------------
    🚀 SHORTGEN AI SERVER IS LIVE
    -------------------------------------------------------
    - Mode: ${process.env.NODE_ENV}
    - Port: ${PORT}
    - Health: http://localhost:${PORT}/api/health
    - API: http://localhost:${PORT}/api/generate-scenario (POST)
    -------------------------------------------------------
    `);
  });
}

startServer();
