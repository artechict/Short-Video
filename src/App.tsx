import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'react-hot-toast';

import { Scenario, Scene } from './types.ts';
import { aiService } from './services/api.ts';

import { Header } from './components/Header.tsx';
import { InputSection } from './components/InputSection.tsx';
import { ScenarioInfo } from './components/ScenarioInfo.tsx';
import { SceneCard } from './components/SceneCard.tsx';

export default function App() {
  const [topic, setTopic] = useState('');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate Scenario
  const generateScenario = async () => {
    if (!topic) return toast.error('لطفاً یک موضوع جذاب وارد کنید');
    setLoading(true);
    try {
      const data = await aiService.generateScenario(topic);
      setScenario(data);
      toast.success('سناریوی استراتژیک شما آماده شد!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScenario(null);
    setTopic('');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-red-500/30 overflow-x-hidden" dir="rtl">
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#121212',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
          }
        }}
      />
      
      <Header onReset={handleReset} showReset={!!scenario} />

      <main className="max-w-4xl mx-auto p-4 md:p-10">
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              <ScenarioInfo 
                title={scenario.title} 
                description={scenario.description} 
                hook={scenario.hook}
                sceneCount={scenario.scenes.length} 
              />

              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2 px-4">
                  <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                  <h3 className="text-2xl font-black">فیلم‌نامه نهایی (۱۵ ثانیه)</h3>
                </div>
                
                <div className="space-y-6">
                  {scenario.scenes.map((scene, idx) => (
                    <SceneCard 
                      key={idx}
                      index={idx}
                      scene={scene}
                    />
                  ))}
                </div>

                <div className="mt-12 p-10 bg-white/5 border border-white/10 rounded-[2.5rem] text-center">
                  <h3 className="text-xl font-bold mb-4">آیا این سناریو برای شما مناسب بود؟</h3>
                  <div className="flex gap-4 justify-center">
                    <button 
                      onClick={handleReset}
                      className="px-8 py-4 bg-white text-black rounded-2xl font-black hover:bg-gray-200 transition-all active:scale-95"
                    >
                      تولید سناریوی جدید
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <footer className="mt-20 py-10 border-t border-white/5 text-center">
        <p className="text-gray-600 text-[10px] uppercase tracking-widest font-bold">ShortGen AI v2.0 • Focused on Viral Storytelling</p>
      </footer>
    </div>
  );
}
