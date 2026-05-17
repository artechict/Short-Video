import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ 
  apiKey: GEMINI_API_KEY || "empty",
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

export async function generateScenario(topic: string) {
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

  const text = response.text;
  if (!text) throw new Error("No content generated from AI");
  return JSON.parse(text);
}

export async function generateImage(prompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: { 
      parts: [
        { text: `A vibrant 9:16 portrait cinematic illustration: ${prompt}` }
      ] 
    },
    config: {
      imageConfig: {
        aspectRatio: "9:16",
      }
    }
  });
  
  for (const part of (response.candidates?.[0]?.content?.parts || [])) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("تولید تصویر ناموفق بود یا در این مدل پشتیبانی نمی‌شود.");
}
