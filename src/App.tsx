import React, { useState, useEffect, useRef } from 'react';
import { 
  Youtube, 
  Play, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCcw,
  Video,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Scenario, GenerationStatus, Scene } from './types.ts';

export default function App() {
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isYoutubeConnected, setIsYoutubeConnected] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Handle YouTube Connection Message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setIsYoutubeConnected(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const connectYoutube = async () => {
    try {
      const res = await fetch('/api/auth/url');
      const { url } = await res.json();
      window.open(url, 'youtube_auth', 'width=600,height=700');
    } catch (err) {
      setError('خطا در اتصال به یوتیوب');
    }
  };

  const generateFullShort = async () => {
    if (!topic) return;
    setStatus('generating_script');
    setError(null);
    setScenario(null);
    setVideoBlob(null);

    try {
      // 1. Generate Script
      const scriptRes = await fetch('/api/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const data: Scenario = await scriptRes.json();
      
      // 2. Generate Images for each scene
      setStatus('generating_images');
      const scenesWithImages: Scene[] = [];
      for (const scene of data.scenes) {
        const imgRes = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: scene.visual_description }),
        });
        const { imageUrl } = await imgRes.json();
        scenesWithImages.push({ ...scene, imageUrl });
      }

      const completeScenario = { ...data, scenes: scenesWithImages };
      setScenario(completeScenario);
      
      // 3. Assemble Video
      setStatus('assembling_video');
      await assembleVideo(completeScenario);
      
      setStatus('idle');
    } catch (err: any) {
      setError(err.message || 'خطایی رخ داد');
      setStatus('error');
    }
  };

  const assembleVideo = async (sc: Scenario) => {
    return new Promise<void>((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setVideoBlob(blob);
        resolve();
      };

      recorder.start();

      let sceneCount = 0;
      const sceneDuration = 4000; // 4 seconds per scene

      const renderScene = async (index: number) => {
        if (index >= sc.scenes.length) {
          recorder.stop();
          return;
        }

        const scene = sc.scenes[index];
        setCurrentSceneIndex(index);
        
        // Load image
        const img = new Image();
        img.src = scene.imageUrl!;
        await new Promise((r) => (img.onload = r));

        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          if (elapsed >= sceneDuration) {
            renderScene(index + 1);
            return;
          }

          // Draw Background
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Overlay Text
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(0, canvas.height - 200, canvas.width, 150);

          ctx.fillStyle = 'white';
          ctx.font = 'bold 48px Arial';
          ctx.textAlign = 'center';
          ctx.direction = 'rtl';
          ctx.fillText(scene.onscreen_text, canvas.width / 2, canvas.height - 110);

          requestAnimationFrame(animate);
        };
        animate();
      };

      renderScene(0);
    });
  };

  const uploadToYoutube = async () => {
    if (!videoBlob || !scenario) return;
    setStatus('uploading');

    try {
      // Small delay to ensure blob is ready
      const reader = new FileReader();
      reader.readAsDataURL(videoBlob);
      reader.onloadend = async () => {
        const base64data = reader.result;
        const res = await fetch('/api/youtube/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoData: base64data,
            title: scenario.title,
            description: scenario.description,
          }),
        });
        const result = await res.json();
        if (result.success) {
          setStatus('completed');
        } else {
          throw new Error(result.error);
        }
      };
    } catch (err: any) {
      setError(err.message || 'خطا در آپلود');
      setStatus('error');
    }
  };

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] text-[#1E293B] font-sans rtl flex overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <aside className="w-60 indigo-violet-gradient text-white p-6 flex flex-col gap-6 shrink-0 z-10 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
            <Video size={24} />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">ShortGen AI ✨</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/20 cursor-pointer transition-all">
            <Play size={18} />
            <span className="font-medium">داشبورد</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-all">
            <Video size={18} />
            <span className="font-medium">پروژه‌های من</span>
          </div>
          <button
            onClick={connectYoutube}
            disabled={isYoutubeConnected}
            className={`flex items-center gap-3 p-3 rounded-xl w-full text-right transition-all ${
              isYoutubeConnected 
              ? 'bg-green-500/20 text-green-200 cursor-default'
              : 'hover:bg-white/10'
            }`}
          >
            {isYoutubeConnected ? <CheckCircle2 size={18} /> : <Youtube size={18} />}
            <span className="font-medium">{isYoutubeConnected ? 'یوتیوب متصل شد' : 'اتصال به یوتیوب'}</span>
          </button>
        </nav>

        <div className="mt-auto space-y-6">
          <div className="bg-black/10 rounded-2xl p-4 border border-white/10">
            <h3 className="font-bold text-sm mb-4">وضعیت فرآیند</h3>
            <div className="space-y-4">
              <StepMini 
                label="نگارش سناریو" 
                active={status === 'generating_script'} 
                done={!!scenario || status === 'completed'} 
              />
              <StepMini 
                label="تولید تصاویر" 
                active={status === 'generating_images'} 
                done={!!scenario?.scenes[0]?.imageUrl || status === 'completed'} 
              />
              <StepMini 
                label="تدوین ویدیو" 
                active={status === 'assembling_video'} 
                done={!!videoBlob || status === 'completed'} 
              />
              <StepMini 
                label="آپلود" 
                active={status === 'uploading'} 
                done={status === 'completed'} 
              />
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-4">
            <div className="flex justify-between text-xs mb-2">
              <span>مصرف منابع</span>
              <span>۶۵٪</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full w-[65%] shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Editor */}
      <main className="flex-1 bg-white border-l border-r border-slate-200 p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
        <header>
          <h2 className="text-3xl font-bold text-primary">ایجاد ویدیو جدید</h2>
          <p className="text-slate-500 mt-1">موضوع خود را وارد کنید تا هوش مصنوعی بقیه کارها را انجام دهد.</p>
        </header>

        <section className="space-y-4">
          <label className="block text-sm font-bold text-slate-700">موضوع ویدیو:</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثلاً: ۱۰ دانستنی عجیب درباره کهکشان راه شیری"
              className="flex-1 bg-white border-2 border-slate-200 focus:border-primary rounded-2xl px-6 py-4 outline-none transition-all text-lg shadow-sm"
            />
            <button
              onClick={generateFullShort}
              disabled={status !== 'idle' && status !== 'error' || !topic}
              className="px-8 py-4 bg-primary text-white rounded-2xl font-bold transition-all vibrant-shadow-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
            >
              {status === 'idle' ? (
                <>
                  <span>ساخت سناریو</span>
                  <div className="text-sm">✨</div>
                </>
              ) : (
                <Loader2 className="animate-spin" size={20} />
              )}
            </button>
          </div>
        </section>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100"
          >
            <AlertCircle size={20} />
            <p className="font-medium text-sm">{error}</p>
          </motion.div>
        )}

        <section className="flex-1 flex flex-col min-h-0">
          <label className="block text-sm font-bold text-slate-700 mb-4">سناریو تولید شده:</label>
          <div className="flex-1 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-6 overflow-y-auto custom-scrollbar relative">
            {!scenario && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-10 text-center gap-4">
                <FileText size={48} className="opacity-20" />
                <p>بعد از تولید، سناریو در اینجا نمایش داده می‌شود.</p>
              </div>
            )}
            
            <AnimatePresence>
              {scenario && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-200 pb-4">
                    <h3 className="text-xl font-bold text-primary">{scenario.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{scenario.description}</p>
                  </div>
                  
                  {scenario.scenes.map((scene, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4"
                    >
                      <div className="w-24 h-40 bg-slate-200 rounded-xl overflow-hidden shrink-0">
                        {scene.imageUrl ? (
                          <img src={scene.imageUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center animate-pulse">
                            <ImageIcon size={24} className="text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-indigo-50 px-2 py-1 rounded">صحنه {idx + 1}</span>
                        <p className="text-sm leading-relaxed"><strong className="text-slate-700">متن گوینده:</strong> {scene.narration}</p>
                        <p className="text-xs text-slate-500"><strong className="text-slate-500">متن روی صفحه:</strong> {scene.onscreen_text}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <footer className="mt-auto flex gap-4">
          <button 
            disabled={!videoBlob || status !== 'idle'}
            onClick={() => setStatus('idle')}
            className="flex-[2] py-4 bg-secondary text-white rounded-2xl font-bold vibrant-shadow-secondary hover:opacity-90 transition-all disabled:opacity-50 disabled:vibrant-shadow-none"
          >
            تولید نهایی ویدیو (Short) 🎥
          </button>
          <button className="flex-1 py-4 border-2 border-slate-200 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 transition-all">
            ذخیره پیش‌نویس
          </button>
        </footer>
      </main>

      {/* Preview Panel */}
      <aside className="w-80 bg-slate-100 p-8 flex flex-col items-center shrink-0">
        <header className="text-center mb-8">
          <h3 className="font-bold text-lg">پیش‌نمایش ویدیو</h3>
          <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">فرمت عمودی 9:16</span>
        </header>

        <div className="phone-frame w-[260px] h-[460px] bg-black rounded-[40px] border-[8px] border-slate-700 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden relative">
           {/* Hidden Canvas for recording */}
           <canvas 
              ref={canvasRef} 
              width={1080} 
              height={1920} 
              className="hidden"
            />

            {!videoBlob && !scenario && (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 p-6 text-center gap-4 bg-gradient-to-br from-slate-800 to-slate-900">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                  <Play size={24} className="ml-1" />
                </div>
                <p className="text-xs font-medium">پیش‌نمایش ویدیو در اینجا نمایش داده می‌شود.</p>
              </div>
            )}

            {status === 'assembling_video' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-20">
                <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
                <p className="text-white font-bold text-sm">در حال تدوین...</p>
              </div>
            )}

            {videoBlob && (
              <div className="w-full h-full bg-black">
                <video 
                  src={URL.createObjectURL(videoBlob)} 
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  loop
                />
              </div>
            )}
        </div>

        <div className="mt-10 w-full">
          <button 
            disabled={!videoBlob || !isYoutubeConnected || status === 'uploading' || status === 'completed'}
            onClick={uploadToYoutube}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
              status === 'completed'
              ? 'bg-green-500 text-white shadow-lg shadow-green-200 cursor-default'
              : 'bg-red-600 text-white shadow-xl shadow-red-200 hover:bg-red-700 disabled:opacity-50 disabled:shadow-none'
            }`}
          >
            {status === 'uploading' ? (
              <Loader2 className="animate-spin" size={24} />
            ) : status === 'completed' ? (
              <>
                <CheckCircle2 size={24} />
                با موفقیت آپلود شد
              </>
            ) : (
              <>
                <Youtube size={24} />
                آپلود مستقیم در یوتیوب
              </>
            )}
          </button>
          
          {status === 'completed' && (
             <button 
                onClick={() => { setVideoBlob(null); setScenario(null); setStatus('idle'); }}
                className="w-full mt-4 py-2 text-slate-500 text-sm hover:text-primary transition-colors flex items-center justify-center gap-2"
             >
                <RefreshCcw size={16} />
                ساخت ویدیوی جدید
             </button>
          )}
        </div>
      </aside>
    </div>
  );
}

function StepMini({ label, active, done }: { label: string, active: boolean, done: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className={done ? 'text-green-300' : active ? 'text-white font-bold' : 'text-white/40'}>{label}</span>
      {done ? <CheckCircle2 size={14} className="text-green-300" /> : active ? <Loader2 size={14} className="animate-spin" /> : <div className="w-3.5 h-3.5 rounded-full border border-white/20" />}
    </div>
  );
}
