import { Scene } from '../types.ts';

export const videoService = {
  async assembleVideo(scenes: Scene[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Could not get canvas context');

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      };

      recorder.start();

      let currentScene = 0;
      const sceneDuration = 5; // 5 seconds per scene for simplicity
      const totalDuration = scenes.length * sceneDuration;
      let startTime = Date.now();

      const render = async () => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= totalDuration) {
          recorder.stop();
          return;
        }

        const sceneIdx = Math.floor(elapsed / sceneDuration);
        const scene = scenes[sceneIdx];
        
        // Clear background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Image
        if (scene.imageUrl) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = scene.imageUrl;
          await new Promise(r => img.onload = r);
          
          // Cover logic
          const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        }

        // Draw Text Overlay
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, canvas.height - 400, canvas.width, 400);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 60px sans-serif';
        ctx.textAlign = 'center';
        
        const words = scene.onscreen_text.split(' ');
        let line = '';
        let yPos = canvas.height - 250;
        for (const word of words) {
          if (ctx.measureText(line + word).width > canvas.width - 100) {
            ctx.fillText(line.trim(), canvas.width / 2, yPos);
            line = word + ' ';
            yPos += 80;
          } else {
            line += word + ' ';
          }
        }
        ctx.fillText(line.trim(), canvas.width / 2, yPos);

        requestAnimationFrame(render);
      };

      render();
    });
  }
};
