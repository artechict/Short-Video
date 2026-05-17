import React from 'react';
import { Layout, Zap } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  hook: string;
  sceneCount: number;
}

export const ScenarioInfo: React.FC<Props> = ({ title, description, hook, sceneCount }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-white/5 border border-white/10 rounded-3xl shadow-2xl">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="px-2 py-1 bg-red-600/10 border border-red-600/20 rounded-md">
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">سناریوی فوق‌حرفه‌ای</span>
            </div>
          </div>
          <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 mb-2">{title}</h2>
          <p className="text-gray-400 text-base leading-relaxed max-w-2xl">{description}</p>
        </div>
        
        <div className="flex items-center gap-6 bg-black/40 p-6 rounded-2xl border border-white/5">
          <div className="text-center">
            <span className="block text-3xl font-black text-white">{sceneCount}</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase">صحنه</span>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <span className="block text-3xl font-black text-red-600">۱۵</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase">ثانیه</span>
          </div>
        </div>
      </div>

      {hook && (
        <div className="p-6 bg-gradient-to-r from-red-600/10 to-transparent border-l-4 border-red-600 rounded-r-2xl">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-red-500 mb-1">استراتژی قلاب (Hook Strategy)</h4>
              <p className="text-sm text-gray-300 leading-relaxed">{hook}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
