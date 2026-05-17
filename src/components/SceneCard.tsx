import React from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, RefreshCcw, Loader2, Type as FontIcon } from 'lucide-react';
import { Scene } from '../types.ts';

interface Props {
  scene: Scene;
  index: number;
  onGenerateImage: () => void;
  onUpdate: (scene: Scene) => void;
}

export const SceneCard: React.FC<Props> = ({ scene, index, onGenerateImage, onUpdate }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-white/20 transition-all shadow-xl"
    >
      <div className="flex flex-col md:flex-row">
        {/* Image Preview */}
        <div className="w-full md:w-48 h-64 md:h-auto bg-black relative flex-shrink-0 border-r border-white/5">
          {scene.imageUrl ? (
            <>
              <img 
                src={scene.imageUrl} 
                alt={`صحنه ${index + 1}`} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={onGenerateImage}
                  className="bg-white/10 backdrop-blur-md p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <RefreshCcw className="w-5 h-5 text-white" />
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-4 text-center">
              {scene.isGeneratingImage ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                  <span className="text-xs text-gray-400 animate-pulse">در حال خلق تصویر...</span>
                </div>
              ) : (
                <button 
                  onClick={onGenerateImage}
                  className="flex flex-col items-center gap-2 group/btn"
                >
                  <div className="p-3 bg-red-600/10 rounded-full group-hover/btn:bg-red-600/20 transition-colors">
                    <ImageIcon className="w-6 h-6 text-red-500" />
                  </div>
                  <span className="text-xs text-gray-400">تولید تصویر هوش مصنوعی</span>
                </button>
              )}
            </div>
          )}
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold">
            صحنه {index + 1}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">گوینده (نریشن)</label>
            <textarea 
              value={scene.narration}
              onChange={(e) => onUpdate({ ...scene, narration: e.target.value })}
              className="w-full bg-transparent border-none p-0 text-gray-200 focus:ring-0 resize-none min-h-[60px]"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1 flex items-center gap-1 text-gray-400">
                <FontIcon className="w-3 h-3 text-red-500" /> متن روی صفحه
              </label>
              <input 
                type="text" 
                value={scene.onscreen_text}
                onChange={(e) => onUpdate({ ...scene, onscreen_text: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-red-500 focus:border-red-500/50 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1 text-gray-400">توصیف بصری (Prompt)</label>
              <input 
                type="text" 
                value={scene.visual_description}
                onChange={(e) => onUpdate({ ...scene, visual_description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-400 focus:border-white/30 outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
