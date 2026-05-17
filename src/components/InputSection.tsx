import React from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  topic: string;
  setTopic: (val: string) => void;
  onGenerate: () => void;
  loading: boolean;
}

export const InputSection: React.FC<Props> = ({ topic, setTopic, onGenerate, loading }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[50vh] text-center"
    >
      <div className="bg-gradient-to-br from-red-600 to-orange-600 w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-red-600/20">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
        ایده‌ها را به ویدیو تبدیل کنید
      </h2>
      <p className="text-gray-400 mb-8 max-w-md text-lg">
        موضوع خود را وارد کنید تا هوش مصنوعی سناریو، متن گوینده و تصاویر یوتیوب شورت شما را بسازد.
      </p>
      
      <div className="w-full max-w-2xl relative group">
        <input 
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="مثلاً: ۵ دانستنی عجیب درباره فضانوردان..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-xl outline-none focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 transition-all placeholder:text-gray-600"
          onKeyPress={(e) => e.key === 'Enter' && onGenerate()}
        />
        <button 
          onClick={onGenerate}
          disabled={loading || !topic}
          className="absolute left-3 top-2.5 bottom-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white px-6 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          <span>تولید محتوا</span>
        </button>
      </div>
    </motion.div>
  );
};
