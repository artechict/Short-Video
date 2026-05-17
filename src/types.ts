export interface Scene {
  narration: string;
  visual_description: string;
  onscreen_text: string;
  imageUrl?: string;
}

export interface Scenario {
  title: string;
  description: string;
  scenes: Scene[];
}

export type GenerationStatus = 'idle' | 'generating_script' | 'generating_images' | 'assembling_video' | 'uploading' | 'completed' | 'error';
