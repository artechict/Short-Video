import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'react-hot-toast';

import { Scenario, Scene } from './types.ts';
import { aiService } from './services/api.ts';

import { Header } from './components/Header.tsx';
import { InputSection } from './components/InputSection.tsx';
import { ScenarioInfo } from './components/ScenarioInfo.tsx';
import { SceneCard } from './components/SceneCard.tsx';
import { PreviewSection } from './components/PreviewSection.tsx';

export default function App() {
  const [topic, setTopic] = useState('');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate Scenario
  const generateScenario = async () => {
    if (!topic) return toast.error('لطفاً یک موضوع وارد کنید');
    setLoading(true);
    try {
      const data = await aiService.generateScenario(topic);
      setScenario(data);
      toast.success('سناریو و استوری‌بورد با موفقیت تولید شد!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate Image for a Scene
  const generateImage = async (index: number) => {
    if (!scenario) return;
    
    // Update UI state to "generating"
    const scenesCopy = [...scenario.scenes];
    scenesCopy[index].isGeneratingImage = true;
    setScenario({ ...scenario, scenes: scenesCopy });

    try {
      const imageUrl = await aiService.generateImage(scenario.scenes[index].visual_description);
      const updatedScenes = [...scenario.scenes];
      updatedScenes[index].imageUrl = imageUrl;
      updatedScenes[index].isGeneratingImage = false;
      setScenario({ ...scenario, scenes: updatedScenes });
      toast.success(`تصویر صحنه ${index + 1} آماده شد`);
    } catch (error: any) {
      console.error(error);
      toast.error('خطا در تولید تصویر. مجدداً تلاش کنید.');
      const updatedScenes = [...scenario.scenes];
      updatedScenes[index].isGeneratingImage = false;
      setScenario({ ...scenario, scenes: updatedScenes });
    }
  };

  const updateScene = (index: number, updatedScene: Scene) => {
    if (!scenario) return;
    const newScenes = [...scenario.scenes];
    newScenes[index] = updatedScene;
    setScenario({ ...scenario, scenes: newScenes });
  };

  const handleReset = () => {
    if (confirm('آیا مطمئن هستید؟ تمام تغییرات شما پاک خواهد شد.')) {
      setScenario(null);
      setTopic('');
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white font-sans selection:bg-red-500/30 overflow-x-hidden" dir="rtl">
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          }
        }}
      />
      
      <Header onReset={handleReset} showReset={!!scenario} />

      <main className="max-w-7xl mx-auto p-4 md:p-10">
        <AnimatePresence mode="wait">
          {!scenario ? (
            <div className="py-20">
              <InputSection 
                topic={topic} 
                setTopic={setTopic} 
                onGenerate={generateScenario} 
                loading={loading} 
              />
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="space-y-10"
            >
              <ScenarioInfo 
                title={scenario.title} 
                description={scenario.description} 
                sceneCount={scenario.scenes.length} 
              />

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className="xl:col-span-7 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-6 bg-red-600 rounded-full" />
                    <h3 className="text-xl font-bold">تدوین و ویرایش صحنه‌ها</h3>
                  </div>
                  
                  <div className="space-y-6">
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
                </div>

                <div className="xl:col-span-5 relative">
                  <div className="xl:sticky xl:top-28 space-y-8">
                    <PreviewSection scenario={scenario} />
                    
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <h4 className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-4">
                        راهنمای سریع
                      </h4>
                      <ul className="text-xs text-gray-500 space-y-3">
                        <li className="flex gap-2">
                          <span className="text-red-500 font-bold">۱.</span>
                          <span>برای هر صحنه یک تصویر هوش مصنوعی تولید کنید. می‌توانید پرامپت‌ها را به دلخواه خود تغییر دهید.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-red-500 font-bold">۲.</span>
                          <span>بعد از تکمیل تمام تصاویر، دکمه «رندر» را بزنید تا ویدیو آماده شود.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-red-500 font-bold">۳.</span>
                          <span>ویدیو را دانلود کنید یا مستقیماً در کانال یوتیوب خود منتشر کنید.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <footer className="mt-20 py-10 border-t border-white/5 text-center">
        <p className="text-gray-600 text-xs">© ۲۰۲۶ ShortGen AI - قدرت گرفته از هوش مصنوعی مولد</p>
      </footer>
    </div>
  );
}
