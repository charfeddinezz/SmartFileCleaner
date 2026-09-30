import React from 'react';
import { Code2, Cpu, Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="relative text-center mb-8 pt-4">
      {/* Glow effect */}
      <div className="absolute inset-0 flex justify-center">
        <div className="w-96 h-32 bg-cyan-500/10 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-400 bg-clip-text text-transparent tracking-tight">
            منشئ الملفات الذكي
          </h1>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Cpu className="w-5 h-5 text-white" />
          </div>
        </div>

        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>
            تحليل النصوص → تنظيف ذكي تلقائي (إزالة الكلمات خارج سياق البرمجة) → إنتاج ملفات صالحة 100%
          </span>
          <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
        </p>

        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {['HTML', 'CSS', 'JS/TS', 'JSON', 'PHP', 'Python', 'SQL', 'YAML', 'XML'].map(lang => (
            <span
              key={lang}
              className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800/60 text-cyan-300 border border-slate-700/50"
            >
              {lang}
            </span>
          ))}
        </div>

        {/* Smart path detection info */}
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          <span className="px-3 py-1 rounded-full text-xs bg-violet-900/30 text-violet-300 border border-violet-700/30">
            ✦ كشف ذكي للمسارات: يدعم البادئات العربية والإنجليزية والأرقام وكتل Markdown
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
