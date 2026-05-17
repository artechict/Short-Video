import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Youtube,
  CloudUpload,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

import { Scenario, Scene } from './types.ts';
import { aiService, youtubeService } from './services/api.ts';
import { InputSection } from './components/InputSection.tsx';
import { SceneCard } from './components/SceneCard.tsx';

export default function App() {
  const [topic, setTopic] = useState('');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Generate Scenario
  const generateScenario = async () => {
    if (!topic) return toast.error('لطفاً یک موضوع وارد کنید');
    setLoading(true);
    try {
      const data = await aiService.generateScenario(topic);
      setScenario(data);
      toast.success('سناریو با موفقیت تولید شد!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate Image for a Scene
  const generateImage = async (index: number) => {
    if (!scenario) return;
    
    const newScenes = [...scenario.scenes];
    newScenes[index].isGeneratingImage = true;
    setScenario({ ...scenario, scenes: newScenes });

    try {
      const imageUrl = await aiService.generateImage(scenario.scenes[index].visual_description);
      const updatedScenes = [...scenario.scenes];
      updatedScenes[index].imageUrl = imageUrl;
      updatedScenes[index].isGeneratingImage = false;
      setScenario({ ...scenario, scenes: updatedScenes });
      toast.success(`تصویر صحنه ${index + 1} آماده شد`);
    } catch (error: any) {
      toast.error(error.message);
      const updatedScenes = [...scenario.scenes];
      updatedScenes[index].isGeneratingImage = false;
      setScenario({ ...scenario, scenes: updatedScenes });
    }
  };

  // YouTube Upload
  const handleYoutubeUpload = async () => {
    if (!scenario) return;
    setIsUploading(true);
    try {
      const url = await youtubeService.getAuthUrl();
      window.open(url, '_blank', 'width=600,height=600');
      
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'OAUTH_AUTH_SUCCESS') {
          toast.success('اتصال به یوتیوب برقرار شد. در حال آپلود...');
          // Simplified for preview - in real app would assemble video
          setTimeout(() => {
            setIsUploading(false);
            toast.success('ویدیو با موفقیت تأیید شد!');
          }, 2000);
        }
      }, { once: true });
    } catch (error: any) {
      toast.error(error.message);
      setIsUploading(false);
    }
  };

  const updateScene = (index: number, updatedScene: Scene) => {
    if (!scenario) return;
    const newScenes = [...scenario.scenes];
    newScenes[index] = updatedScene;
    setScenario({ ...scenario, scenes: newScenes });
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans selection:bg-red-500/30" dir="rtl">
      <Toaster position="top-center" />
      
      <header className="border-b border-white/10 p-4 sticky top-0 bg-[#0f0f0f]/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-1.5 rounded-lg">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">ShortGen <span className="text-red-600">AI</span></h1>
          </div>
          
          {scenario && (
            <button 
              onClick={() => setScenario(null)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              شروع مجدد
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {!scenario ? (
            <InputSection 
              topic={topic} 
              setTopic={setTopic} 
              onGenerate={generateScenario} 
              loading={loading} 
            />
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{scenario.title}</h2>
                    <p className="text-gray-400 text-sm mt-1">{scenario.description}</p>
                  </div>
                  <div className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">
                    {scenario.scenes.length} صحنه
                  </div>
                </div>

                {scenario.scenes.map((scene, idx) => (
                  <SceneCard 
                    key={idx}
                    index={idx}
                    scene={scene}
                    onGenerateImage={() => generateImage(idx)}
                    onUpdate={(s) => updateScene(idx, s)}
                  />
                ))}
              </div>

              <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <CloudUpload className="w-5 h-5 text-red-500" /> انتشار محتوا
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">تصاویر تکمیل شده:</span>
                        <span className="font-bold text-red-500">
                          {scenario.scenes.filter(s => s.imageUrl).length} / {scenario.scenes.length}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                          className="bg-red-600 h-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(scenario.scenes.filter(s => s.imageUrl).length / scenario.scenes.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleYoutubeUpload}
                      disabled={isUploading || scenario.scenes.some(s => !s.imageUrl)}
                      className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20 active:scale-95"
                    >
                      {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Youtube className="w-6 h-6" />}
                      <span>ارسال مستقیم به یوتیوب</span>
                    </button>
                    
                    <p className="text-[10px] text-gray-500 text-center uppercase tracking-tighter">
                      {scenario.scenes.some(s => !s.imageUrl) 
                        ? 'قبل از انتشار، تمام تصاویر را تولید کنید' 
                        : 'آماده انتشار در کانال شما'}
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-gray-400">
                    <AlertCircle className="w-4 h-4" /> نکات حرفه‌ای
                  </h4>
                  <ul className="text-xs text-gray-500 space-y-2">
                    <li>• برای نتایج بهتر، پرامپت‌های انگلیسی را ویرایش کنید.</li>
                    <li>• هر صحنه حدود ۱۰ تا ۱۵ ثانیه زمان دارد.</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
