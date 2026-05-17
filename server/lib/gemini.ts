import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ 
  apiKey: GEMINI_API_KEY || "empty",
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

export async function generateScenario(topic: string) {
  const prompt = `شما یک نابغه در نوشتن فیلم‌نامه‌های یوتیوب شورت هستید که می‌توانید در کمتر از ۱۵ ثانیه مخاطب را جادو کنید.
    یک سناریوی فوق‌العاده حرفه‌ای و ویروسی (Viral) برای یوتیوب شورت با موضوع "${topic}" بنویسید.
    
    الزامات محتوایی:
    ۱. قلاب (Hook) مرگبار: در ۳ ثانیه اول باید مخاطب را شوکه کنید یا سوالی بپرسید که نتواند ویدیو را رد کند.
    ۲. ریتم تند: از کلمات اضافی پرهیز کنید. هر ثانیه باید ارزش داشته باشد.
    ۳. ساختار ۱۵ ثانیه‌ای: سناریو باید دقیقاً برای یک ویدیوی ۱۵ ثانیه‌ای بهینه شده باشد.
    ۴. پایان کنجکاو‌کننده: جوری تمام کنید که مخاطب بخواهد ویدیو را دوباره ببیند یا کامنت بگذارد.
    
    پاسخ را دقیقاً در قالب JSON برگردانید:
    {
      "title": "عنوان جذاب ویدیو",
      "description": "توضیحات کوتاه برای کپشن",
      "hook": "توضیح استراتژی قلاب شما برای این ویدیو",
      "scenes": [
        {
          "narration": "متن دقیق گوینده (به فارسی روان و عامیانه جذاب)",
          "visual_suggestion": "پیشنهاد بصری برای این صحنه (English)",
          "onscreen_text": "متن کوتاهی که باید روی تصویر تایپ شود"
        }
      ]
    }
    حداقل ۳ و حداکثر ۵ صحنه بنویسید.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["title", "description", "hook", "scenes"],
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          hook: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["narration", "visual_suggestion", "onscreen_text"],
              properties: {
                narration: { type: Type.STRING },
                visual_suggestion: { type: Type.STRING },
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
