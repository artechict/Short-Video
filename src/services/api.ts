import { Scenario, Scene } from '../types.ts';

export const aiService = {
  async generateScenario(topic: string): Promise<Scenario> {
    const res = await fetch('/api/generate-scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'خطا در تولید سناریو');
    }
    return res.json();
  },

  async generateImage(prompt: string): Promise<string> {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'خطا در تولید تصویر');
    }
    const data = await res.json();
    return data.imageUrl;
  }
};

export const youtubeService = {
  async getAuthUrl(): Promise<string> {
    const res = await fetch('/api/auth/url');
    const data = await res.json();
    return data.url;
  },

  async uploadVideo(videoData: string, title: string, description: string) {
    const res = await fetch('/api/youtube/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoData, title, description }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'خطا در آپلود یوتیوب');
    }
    return res.json();
  }
};
