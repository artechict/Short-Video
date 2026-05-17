import React from 'react';
import { Layout } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  sceneCount: number;
}

export const ScenarioInfo: React.FC<Props> = ({ title, description, sceneCount }) => {
  return (
    <div className="flex items-center justify-between mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl shadow-xl">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Layout className="w-4 h-4 text-red-500" />
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">سناریوی تولید شده</span>
        </div>
        <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{title}</h2>
        <p className="text-gray-400 text-sm mt-2 max-w-xl">{description}</p>
      </div>
      <div className="flex flex-col items-center justify-center bg-white/5 px-6 py-4 rounded-xl border border-white/10 shadow-inner">
        <span className="text-4xl font-black text-red-600">{sceneCount}</span>
        <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">صحنه کامل</span>
      </div>
    </div>
  );
};
