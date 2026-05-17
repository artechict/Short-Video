import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Download, Loader2, Youtube, Sparkles } from 'lucide-react';
import { Scene, Scenario } from '../types.ts';
import { videoService } from '../services/videoService.ts';
import { toast } from 'react-hot-toast';

interface Props {
  scenario: Scenario;
}

export const PreviewSection: React.FC<Props> = ({ scenario }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isAssembling, setIsAssembling] = useState(false);

  const assemble = async () => {
    if (scenario.scenes.some(s => !s.imageUrl)) {
      return toast.error('ابتدا تمام تصاویر را تولید کنید');
    }
    
    setIsAssembling(true);
    try {
      const b64 = await videoService.assembleVideo(scenario.scenes);
      setVideoUrl(b64);
      toast.success('ویدیو با موفقیت رندر شد!');
    } catch (error: any) {
      toast.error('خطا در رندر ویدیو: ' + error.message);
    } finally {
      setIsAssembling(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-red-500" /> پیش‌نمایش نهایی
        </h3>
      </div>

      <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden relative group mb-6 shadow-2xl">
        {videoUrl ? (
          <video 
            src={videoUrl} 
            controls 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-gray-500 text-sm">
              برای مشاهده پیش‌نمایش و دریافت خروجی، دکمه رندر را بزنید.
            </p>
          </div>
        )}
        
        {isAssembling && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <div className="text-center">
              <div className="text-lg font-bold">در حال رندر ویدیو...</div>
              <div className="text-xs text-gray-500">این فرآیند ممکن است کمی طول بکشد</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {!videoUrl ? (
          <button 
            onClick={assemble}
            disabled={isAssembling || scenario.scenes.some(s => !s.imageUrl)}
            className="w-full py-4 bg-white text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-500 rounded-xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-white/5"
          >
            {isAssembling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            <span>شروع رندر ویدیو</span>
          </button>
        ) : (
          <>
            <a 
              href={videoUrl} 
              download={`${scenario.title}.webm`}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-600/20"
            >
              <Download className="w-5 h-5" />
              <span>دانلود ویدیو (WebM)</span>
            </a>
            <button 
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"
            >
              <Youtube className="w-5 h-5" />
              <span>انتشار در یوتیوب</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
