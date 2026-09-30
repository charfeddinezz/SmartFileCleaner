import React, { useState, useCallback } from 'react';
import {
  Plus, Trash2, Edit3, Check, X, AlertCircle, Zap,
  ToggleLeft, ToggleRight, ChevronUp, ChevronDown,
  Copy, FlaskConical, Code2, Info,
} from 'lucide-react';
import { CustomPattern } from '@/types';
import { validateCustomRegex, testCustomPattern } from '@/lib/cleaner';

interface CustomPatternManagerProps {
  patterns: CustomPattern[];
  onAdd: (p: Omit<CustomPattern, 'id'>) => string;
  onUpdate: (id: string, updates: Partial<Omit<CustomPattern, 'id'>>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}

const PRESET_PATTERNS: Omit<CustomPattern, 'id'>[] = [
  {
    name: 'نمط فرنسي (Fichier N:)',
    regex: '^\\s*[Ff]ichier\\s+\\d+\\s*:\\s*(.+)$',
    flags: 'i',
    enabled: true,
    example: 'Fichier 3: src/index.html',
  },
  {
    name: 'نمط مع شرطة (→ path)',
    regex: '^\\s*→\\s*(.+)$',
    flags: 'i',
    enabled: true,
    example: '→ src/components/Nav.tsx',
  },
  {
    name: 'نمط صيني/ياباني (文件:)',
    regex: '^\\s*文件\\s*[:\\d\\s]*[:：]\\s*(.+)$',
    flags: 'i',
    enabled: true,
    example: '文件 1: src/App.tsx',
  },
  {
    name: 'نمط دليل (📁 path)',
    regex: '^\\s*[📁📄🗂️]+\\s*(.+)$',
    flags: 'i',
    enabled: true,
    example: '📄 public/index.html',
  },
  {
    name: 'نمط FILEPATH: (prefix)',
    regex: '^\\s*(?:filepath|path|file)\\s*:\\s*(.+)$',
    flags: 'i',
    enabled: true,
    example: 'filepath: src/utils/helpers.ts',
  },
  {
    name: 'نمط أسباني (Archivo N:)',
    regex: '^\\s*[Aa]rchivo\\s+\\d+\\s*:\\s*(.+)$',
    flags: 'i',
    enabled: true,
    example: 'Archivo 2: src/index.html',
  },
];

// ── Pattern Editor Modal ───────────────────────────────────
interface PatternEditorProps {
  initial: Partial<CustomPattern>;
  onSave: (p: Omit<CustomPattern, 'id'>) => void;
  onCancel: () => void;
  title: string;
}

const PatternEditor: React.FC<PatternEditorProps> = ({ initial, onSave, onCancel, title }) => {
  const [name, setName] = useState(initial.name ?? '');
  const [regex, setRegex] = useState(initial.regex ?? '');
  const [flags, setFlags] = useState(initial.flags ?? 'i');
  const [example, setExample] = useState(initial.example ?? '');
  const [testLine, setTestLine] = useState(initial.example ?? '');
  const [regexError, setRegexError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ matched: boolean; path: string | null; groups: string[] } | null>(null);

  const handleRegexChange = (v: string) => {
    setRegex(v);
    const err = validateCustomRegex(v, flags);
    setRegexError(err);
    setTestResult(null);
  };

  const handleTest = () => {
    const result = testCustomPattern(regex, flags, testLine);
    setTestResult(result);
  };

  const handleSave = () => {
    const err = validateCustomRegex(regex, flags);
    if (err) { setRegexError(err); return; }
    if (!name.trim()) return;
    onSave({ name: name.trim(), regex, flags, enabled: initial.enabled ?? true, example: example || testLine });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onCancel}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#0c1825] border border-slate-700/50 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/60 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-violet-400" />
            <span className="font-bold text-slate-200 text-sm">{title}</span>
          </div>
          <button onClick={onCancel} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">اسم النمط</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="مثال: نمط الملف الفرنسي"
              className="w-full bg-slate-900/60 border border-slate-700/40 rounded-xl py-2 px-3.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-600/60 transition-colors"
            />
          </div>

          {/* Regex + Flags */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                تعبير Regex
                <span className="text-slate-500 font-normal mr-1.5">(المجموعة 1 = المسار)</span>
              </label>
              <input
                value={regex}
                onChange={e => handleRegexChange(e.target.value)}
                placeholder="^\s*(?:file|ملف)\s*:\s*(.+)$"
                className={`w-full bg-[#060d18] border rounded-xl py-2 px-3.5 text-sm font-mono placeholder-slate-700 outline-none transition-colors ${
                  regexError ? 'border-red-600/60 text-red-300' : 'border-slate-700/40 text-cyan-300 focus:border-violet-600/60'
                }`}
                style={{ direction: 'ltr' }}
                spellCheck={false}
              />
              {regexError && (
                <div className="flex items-center gap-1.5 mt-1.5 text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {regexError}
                </div>
              )}
            </div>
            <div className="w-20">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Flags</label>
              <input
                value={flags}
                onChange={e => setFlags(e.target.value.replace(/[^gimsuy]/g, ''))}
                placeholder="i"
                maxLength={6}
                className="w-full bg-[#060d18] border border-slate-700/40 rounded-xl py-2 px-3 text-sm font-mono text-yellow-300 placeholder-slate-700 outline-none focus:border-violet-600/60 transition-colors"
                style={{ direction: 'ltr' }}
              />
            </div>
          </div>

          {/* Example */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">مثال للسطر</label>
            <input
              value={example}
              onChange={e => setExample(e.target.value)}
              placeholder="مثال: الملف 3: src/App.tsx"
              className="w-full bg-slate-900/60 border border-slate-700/40 rounded-xl py-2 px-3.5 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-violet-600/60 transition-colors font-mono"
              style={{ direction: 'ltr' }}
            />
          </div>

          {/* Test area */}
          <div className="rounded-xl bg-slate-900/40 border border-slate-800/50 p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">اختبر النمط</span>
            </div>
            <div className="flex gap-2">
              <input
                value={testLine}
                onChange={e => setTestLine(e.target.value)}
                placeholder="أدخل سطراً للاختبار..."
                className="flex-1 bg-[#060d18] border border-slate-700/40 rounded-xl py-2 px-3 text-sm font-mono text-slate-200 placeholder-slate-700 outline-none focus:border-emerald-600/50 transition-colors"
                style={{ direction: 'ltr' }}
              />
              <button
                onClick={handleTest}
                disabled={!regex || !testLine}
                className="px-4 py-2 rounded-xl bg-emerald-700/50 hover:bg-emerald-600/60 text-emerald-300 text-sm font-semibold transition-colors border border-emerald-700/40 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                اختبار
              </button>
            </div>
            {testResult !== null && (
              <div className={`mt-2.5 p-2.5 rounded-xl text-xs font-mono ${testResult.matched && testResult.path ? 'bg-emerald-900/25 border border-emerald-800/40' : 'bg-red-900/20 border border-red-800/40'}`}>
                {testResult.matched && testResult.path ? (
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-emerald-300">مسار مكتشف:</span>
                    <code className="text-cyan-300">{testResult.path}</code>
                  </div>
                ) : testResult.matched ? (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-yellow-300">تطابق لكن لم يُستخرج مسار صالح</span>
                    <span className="text-slate-500">({testResult.groups.join(', ')})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <X className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-red-300">لا يوجد تطابق</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-violet-950/30 border border-violet-800/30 text-xs text-violet-300">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>يجب أن يحتوي الـ Regex على <strong>مجموعة التقاط واحدة على الأقل</strong> <code className="bg-violet-900/30 px-1 rounded">(...)</code> تُعيد المسار. مثال: <code className="bg-violet-900/30 px-1 rounded" dir="ltr">^\s*file\s*:\s*(.+)$</code></span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-800/60 bg-slate-900/30">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 text-sm font-medium transition-colors">
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={!!regexError || !name.trim() || !regex.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-900/30"
          >
            <Check className="w-4 h-4" />
            حفظ النمط
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────
const CustomPatternManager: React.FC<CustomPatternManagerProps> = ({
  patterns,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
  onReorder,
}) => {
  const [showEditor, setShowEditor] = useState(false);
  const [editingPattern, setEditingPattern] = useState<CustomPattern | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const handleAdd = useCallback((p: Omit<CustomPattern, 'id'>) => {
    onAdd(p);
    setShowEditor(false);
  }, [onAdd]);

  const handleUpdate = useCallback((p: Omit<CustomPattern, 'id'>) => {
    if (editingPattern) {
      onUpdate(editingPattern.id, p);
    }
    setEditingPattern(null);
  }, [editingPattern, onUpdate]);

  const handleAddPreset = useCallback((preset: Omit<CustomPattern, 'id'>) => {
    onAdd(preset);
  }, [onAdd]);

  const duplicatePattern = useCallback((p: CustomPattern) => {
    onAdd({ ...p, name: `${p.name} (نسخة)`, enabled: true });
  }, [onAdd]);

  return (
    <div className="mt-3">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-slate-300">
            أنماط مخصصة
          </span>
          {patterns.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-violet-900/40 text-violet-300 border border-violet-800/40">
              {patterns.filter(p => p.enabled).length}/{patterns.length} نشط
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowPresets(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 text-xs transition-colors border border-slate-700/30"
          >
            <Zap className="w-3 h-3 text-yellow-400" />
            قوالب جاهزة
          </button>
          <button
            onClick={() => { setEditingPattern(null); setShowEditor(true); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-800/50 hover:bg-violet-700/60 text-violet-300 text-xs font-semibold transition-colors border border-violet-700/40"
          >
            <Plus className="w-3 h-3" />
            إضافة نمط
          </button>
        </div>
      </div>

      {/* Preset Panel */}
      {showPresets && (
        <div className="mb-3 p-3 rounded-xl bg-yellow-950/20 border border-yellow-800/30">
          <div className="flex items-center gap-2 mb-2.5">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-300">أنماط جاهزة للإضافة الفورية</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {PRESET_PATTERNS.map((preset, idx) => {
              const alreadyAdded = patterns.some(p => p.regex === preset.regex);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-900/50 border border-slate-800/40 hover:border-yellow-700/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-300 truncate">{preset.name}</div>
                    <code className="text-[10px] text-slate-500 truncate block" dir="ltr">{preset.example}</code>
                  </div>
                  <button
                    onClick={() => !alreadyAdded && handleAddPreset(preset)}
                    disabled={alreadyAdded}
                    className={`mr-2 flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                      alreadyAdded
                        ? 'bg-slate-800/40 text-slate-600 cursor-default'
                        : 'bg-yellow-800/40 hover:bg-yellow-700/50 text-yellow-300 border border-yellow-800/40'
                    }`}
                  >
                    {alreadyAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {alreadyAdded ? 'مضاف' : 'إضافة'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Patterns list */}
      {patterns.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl bg-slate-900/30 border border-slate-800/30 border-dashed">
          <Code2 className="w-8 h-8 text-slate-700" />
          <p className="text-xs text-slate-500 text-center">
            لا توجد أنماط مخصصة حتى الآن<br />
            <span className="text-slate-600">أضف نمطاً جديداً أو اختر من القوالب الجاهزة</span>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {patterns.map((pattern, idx) => (
            <div
              key={pattern.id}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                pattern.enabled
                  ? 'bg-violet-950/20 border-violet-800/30 hover:border-violet-700/50'
                  : 'bg-slate-900/30 border-slate-800/30 opacity-50'
              }`}
            >
              {/* Reorder */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => idx > 0 && onReorder(idx, idx - 1)}
                  disabled={idx === 0}
                  className="text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => idx < patterns.length - 1 && onReorder(idx, idx + 1)}
                  disabled={idx === patterns.length - 1}
                  className="text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Toggle */}
              <button onClick={() => onToggle(pattern.id)} className="flex-shrink-0 transition-colors">
                {pattern.enabled
                  ? <ToggleRight className="w-5 h-5 text-violet-400" />
                  : <ToggleLeft className="w-5 h-5 text-slate-600" />}
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-200 truncate">{pattern.name}</div>
                <code className="text-[10px] text-slate-500 truncate block" dir="ltr">
                  /{pattern.regex}/{pattern.flags} · {pattern.example}
                </code>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => duplicatePattern(pattern)}
                  title="نسخ"
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-500 hover:text-slate-200 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setEditingPattern(pattern)}
                  title="تعديل"
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-500 hover:text-yellow-300 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDelete(pattern.id)}
                  title="حذف"
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modals */}
      {showEditor && (
        <PatternEditor
          initial={{}}
          onSave={handleAdd}
          onCancel={() => setShowEditor(false)}
          title="إضافة نمط مخصص جديد"
        />
      )}
      {editingPattern && (
        <PatternEditor
          initial={editingPattern}
          onSave={handleUpdate}
          onCancel={() => setEditingPattern(null)}
          title={`تعديل: ${editingPattern.name}`}
        />
      )}
    </div>
  );
};

export default CustomPatternManager;
