import React from 'react';
import { Youtube, Sparkles } from 'lucide-react';

interface Props {
  onReset?: () => void;
  showReset?: boolean;
}

export const Header: React.FC<Props> = ({ onReset, showReset }) => {
  return (
    <header className="border-b border-white/10 p-4 sticky top-0 bg-[#0f0f0f]/80 backdrop-blur-md z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 p-1.5 rounded-lg">
            <Youtube className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ShortGen <span className="text-red-600">AI</span></h1>
        </div>
        
        {showReset && (
          <button 
            onClick={onReset}
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <Sparkles className="w-4 h-4" />
            <span>شروع مجدد</span>
          </button>
        )}
      </div>
    </header>
  );
};
