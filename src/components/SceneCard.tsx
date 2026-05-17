import React from 'react';
import { motion } from 'motion/react';
import { Quote, Type as FontIcon, Eye } from 'lucide-react';
import { Scene } from '../types.ts';

interface Props {
  scene: Scene;
  index: number;
}

export const SceneCard: React.FC<Props> = ({ scene, index }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-red-600/30 transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="text-6xl font-black italic">0{index + 1}</span>
      </div>

      <div className="space-y-6 relative">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-600/10 rounded-2xl">
            <Quote className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-2">دیالوگ گوینده / نریشن</label>
            <p className="text-xl font-medium leading-relaxed text-gray-200">
              {scene.narration}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <FontIcon className="w-3 h-3 text-red-500" /> متن روی صفحه
            </label>
            <div className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-red-500 font-bold text-sm">
              {scene.onscreen_text || 'بدون متن'}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Eye className="w-3 h-3 text-blue-500" /> تصویر پیشنهادی
            </label>
            <div className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-gray-400 text-xs leading-relaxed italic">
              {(scene as any).visual_suggestion || (scene as any).visual_description}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
