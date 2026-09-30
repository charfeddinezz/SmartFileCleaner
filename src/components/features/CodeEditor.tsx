import React, { useRef, useState } from 'react';
import { Terminal, Trash2, FlaskConical, Plus, Play, Sparkles, Info, X, Upload } from 'lucide-react';
import { AppSettings, CustomPattern } from '@/types';
import SettingsBar from './SettingsBar';
import DetectionModePicker from './DetectionModePicker';
import CustomPatternManager from './CustomPatternManager';

interface CodeEditorProps {
  value: string;
  onChange: (v: string) => void;
  settings: AppSettings;
  onSettingsChange: (updates: Partial<AppSettings>) => void;
  onParse: () => void;
  onClean: () => void;
  onClear: () => void;
  onSample: () => void;
  onAddFile: () => void;
  onImportFiles: (files?: File[]) => void;
  isProcessing: boolean;
  hasFiles: boolean;
  // Custom pattern callbacks
  onAddPattern: (p: Omit<CustomPattern, 'id'>) => string;
  onUpdatePattern: (id: string, updates: Partial<Omit<CustomPattern, 'id'>>) => void;
  onDeletePattern: (id: string) => void;
  onTogglePattern: (id: string) => void;
  onReorderPatterns: (from: number, to: number) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  settings,
  onSettingsChange,
  onParse,
  onClean,
  onClear,
  onSample,
  onAddFile,
  onImportFiles,
  isProcessing,
  hasFiles,
  onAddPattern,
  onUpdatePattern,
  onDeletePattern,
  onTogglePattern,
  onReorderPatterns,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showTip, setShowTip] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const lineCount = value.split('\n').length;
  const isCustomMode = settings.detectionMode === 'custom';

  return (
    <div
      className="flex flex-col h-full"
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) onImportFiles(Array.from(e.dataTransfer.files));
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <span className="font-bold text-slate-200">مدخلات النص</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400 font-mono">
            {lineCount} سطر
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTip(v => !v)}
            title="صيغ المسارات المدعومة"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-900/30 hover:bg-violet-800/40 text-violet-300 text-xs transition-colors border border-violet-700/30"
          >
            {showTip ? <X className="w-3 h-3" /> : <Info className="w-3 h-3" />}
            صيغ المسارات
          </button>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
        </div>
      </div>

      {/* Smart Path Tip Panel */}
      {showTip && (
        <div className="mb-3 p-3 rounded-2xl bg-violet-950/40 border border-violet-700/30 text-xs">
          <p className="text-violet-300 font-semibold mb-2">✦ صيغ المسارات المدعومة تلقائياً:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono" dir="ltr">
            {[
              ['auto / strict',   'app/Models/User.php'],
              ['arabic prefix',   'الملف 50: app/Modules/Publisher/BloggerAdapter.php'],
              ['arabic short',    'ملف: public/.htaccess'],
              ['numbered dot',    '3. src/components/Navbar.tsx'],
              ['numbered colon',  '3: src/components/Navbar.tsx'],
              ['colon label',     'File 1: src/app.js'],
              ['markdown fence',  '```php src/api/handler.php'],
              ['hash heading',    '## src/utils/helpers.ts'],
              ['bracketed',       '[src/store/index.ts]'],
              ['arrow',           '> public/index.html'],
              ['custom regex',    'Fichier 3: src/handler.php'],
            ].map(([label, example]) => (
              <div key={label} className="flex gap-2 items-center">
                <span className="text-slate-500 text-[10px] w-28 shrink-0">{label}</span>
                <code className="text-cyan-300 text-[10px] truncate">{example}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detection Mode Picker */}
      <DetectionModePicker
        value={settings.detectionMode}
        onChange={(mode) => onSettingsChange({ detectionMode: mode })}
      />

      {/* Custom Pattern Manager — shown when mode is 'custom' OR always collapsed at bottom */}
      <div className={`transition-all duration-300 overflow-hidden ${isCustomMode ? 'mb-3' : 'mb-2'}`}>
        <div className={`rounded-2xl border transition-all ${
          isCustomMode
            ? 'bg-pink-950/15 border-pink-800/30 p-3.5'
            : 'bg-slate-900/30 border-slate-800/30 p-2.5'
        }`}>
          {!isCustomMode && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-pink-500/50" />
              <span>الأنماط المخصصة متاحة عند اختيار وضع "مخصص" — أو تعمل في الوضع التلقائي</span>
              <span className="mr-auto font-mono text-[10px] text-pink-400/70">
                {settings.customPatterns.filter(p => p.enabled).length > 0
                  ? `${settings.customPatterns.filter(p => p.enabled).length} نشط في وضع التلقائي`
                  : 'لا أنماط مخصصة'}
              </span>
            </div>
          )}
          <CustomPatternManager
            patterns={settings.customPatterns}
            onAdd={onAddPattern}
            onUpdate={onUpdatePattern}
            onDelete={onDeletePattern}
            onToggle={onTogglePattern}
            onReorder={onReorderPatterns}
          />
        </div>
      </div>

      {/* Settings */}
      <SettingsBar settings={settings} onChange={onSettingsChange} />

      {/* Line numbers + Editor */}
      <div className="flex-1 flex rounded-2xl overflow-hidden border border-slate-700/50 bg-[#060d18] min-h-0" style={{ minHeight: '220px' }}>
        {/* Line numbers */}
        <div
          className="select-none text-right py-4 px-2 text-slate-600 font-mono text-xs leading-[1.6] bg-[#060d18] border-l border-slate-800 min-w-[40px] overflow-hidden"
          aria-hidden="true"
          style={{ lineHeight: '1.6' }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} style={{ height: '1.6em' }}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`اكتب هيكل الملفات هنا...\n\nمثال:\nproject/index.html\n<html>\n<head><title>صفحة</title></head>\n<body>مرحباً</body>\n</html>\n\nproject/style.css\nbody { background: black; }\n`}
          className="flex-1 bg-transparent text-slate-200 font-mono text-sm p-4 resize-none outline-none leading-[1.6] placeholder-slate-700 text-left"
          style={{ direction: 'ltr', lineHeight: '1.6', fontFamily: '"IBM Plex Mono", monospace' }}
          spellCheck={false}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={onParse}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-cyan-900/30 hover:shadow-cyan-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4" />
          {isProcessing ? 'جارٍ التحليل...' : 'تحليل + تنظيف'}
        </button>

        <button
          onClick={onClean}
          disabled={!hasFiles || isProcessing}
          title="تنظيف الملفات المحملة مجدداً بدون إعادة التحليل"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-600 hover:to-purple-600 text-white font-bold text-sm transition-all shadow-lg shadow-violet-900/30 disabled:opacity-40 disabled:cursor-not-allowed border border-violet-600/30"
        >
          <Sparkles className="w-4 h-4" />
          تنظيف الملفات
        </button>

        <button
          onClick={onSample}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-700/50 hover:bg-emerald-600/60 text-emerald-300 font-semibold text-sm transition-all border border-emerald-700/40"
        >
          <FlaskConical className="w-4 h-4" />
          نموذج تجريبي
        </button>

        <button
          onClick={onAddFile}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-700/40 hover:bg-blue-600/50 text-blue-300 font-semibold text-sm transition-all border border-blue-700/40"
        >
          <Plus className="w-4 h-4" />
          إضافة ملف
        </button>

        <button
          onClick={onImportFiles}
          disabled={isProcessing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-700/40 hover:bg-sky-600/50 text-sky-300 font-semibold text-sm transition-all border border-sky-700/40 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4" />
          استيراد ملفات
        </button>

        <button
          onClick={onClear}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-900/40 hover:bg-red-800/50 text-red-400 font-semibold text-sm transition-all border border-red-900/40"
        >
          <Trash2 className="w-4 h-4" />
          مسح الكل
        </button>
      </div>
    </div>
  );
};

export default CodeEditor;
