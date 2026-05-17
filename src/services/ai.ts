import { Scenario } from '../types.ts';

export const aiService = {
  async generateScenario(topic: string): Promise<Scenario> {
    const res = await fetch('/api/generate-scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to generate scenario');
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
      throw new Error(error.error || 'Failed to generate image');
    }
    const data = await res.json();
    return data.imageUrl;
  }
};
