import React from 'react';
import { DetectionMode } from '@/types';
import { Radar, Zap, AlignLeft, Hash, Type, Code2, Settings2 } from 'lucide-react';

interface DetectionModePickerProps {
  value: DetectionMode;
  onChange: (mode: DetectionMode) => void;
}

const MODES: {
  value: DetectionMode;
  label: string;
  shortLabel: string;
  description: string;
  example: string;
  icon: React.ReactNode;
  color: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}[] = [
  {
    value: 'auto',
    label: 'تلقائي ذكي',
    shortLabel: 'تلقائي',
    description: 'يكتشف جميع أنماط المسارات تلقائياً',
    example: 'أي صيغة → src/file.js',
    icon: <Radar className="w-4 h-4" />,
    color: 'text-cyan-400',
    activeBg: 'bg-cyan-500/15',
    activeBorder: 'border-cyan-500/60',
    activeText: 'text-cyan-300',
  },
  {
    value: 'strict',
    label: 'صارم',
    shortLabel: 'صارم',
    description: 'مسار خالص فقط بدون أي بادئة',
    example: 'src/components/Nav.tsx',
    icon: <Zap className="w-4 h-4" />,
    color: 'text-yellow-400',
    activeBg: 'bg-yellow-500/15',
    activeBorder: 'border-yellow-500/60',
    activeText: 'text-yellow-300',
  },
  {
    value: 'arabic',
    label: 'بادئة عربية',
    shortLabel: 'عربي',
    description: 'الملف X: مسار أو ملف: مسار',
    example: 'الملف 50: app/Handler.php',
    icon: <AlignLeft className="w-4 h-4" />,
    color: 'text-emerald-400',
    activeBg: 'bg-emerald-500/15',
    activeBorder: 'border-emerald-500/60',
    activeText: 'text-emerald-300',
  },
  {
    value: 'numbered',
    label: 'مرقمة',
    shortLabel: 'مرقمة',
    description: 'قوائم مرقمة: 1. أو 1: أو (1)',
    example: '3. src/index.html',
    icon: <Hash className="w-4 h-4" />,
    color: 'text-blue-400',
    activeBg: 'bg-blue-500/15',
    activeBorder: 'border-blue-500/60',
    activeText: 'text-blue-300',
  },
  {
    value: 'colon',
    label: 'نقطتان',
    shortLabel: 'نقطتان',
    description: 'تسمية ثم نقطتان ثم المسار',
    example: 'File 1: src/app.js',
    icon: <Type className="w-4 h-4" />,
    color: 'text-violet-400',
    activeBg: 'bg-violet-500/15',
    activeBorder: 'border-violet-500/60',
    activeText: 'text-violet-300',
  },
  {
    value: 'markdown',
    label: 'Markdown',
    shortLabel: 'MD',
    description: 'كتل كود Markdown فقط ```',
    example: '```js src/utils.js',
    icon: <Code2 className="w-4 h-4" />,
    color: 'text-orange-400',
    activeBg: 'bg-orange-500/15',
    activeBorder: 'border-orange-500/60',
    activeText: 'text-orange-300',
  },
  {
    value: 'custom',
    label: 'مخصص',
    shortLabel: 'مخصص',
    description: 'أنماط Regex مخصصة تُحددها أنت',
    example: 'Fichier 3: src/App.tsx',
    icon: <Settings2 className="w-4 h-4" />,
    color: 'text-pink-400',
    activeBg: 'bg-pink-500/15',
    activeBorder: 'border-pink-500/60',
    activeText: 'text-pink-300',
  },
];

const DetectionModePicker: React.FC<DetectionModePickerProps> = ({ value, onChange }) => {
  const active = MODES.find(m => m.value === value) ?? MODES[0];

  return (
    <div className="mb-4">
      {/* Label */}
      <div className="flex items-center gap-2 mb-2">
        <Radar className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs font-semibold text-slate-400">طريقة كشف المسارات</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${active.activeBg} ${active.activeBorder} ${active.activeText}`}>
          {active.label}
        </span>
      </div>

      {/* Mode Buttons Grid — 4 + 3 layout */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
        {MODES.map(mode => {
          const isActive = value === mode.value;
          return (
            <button
              key={mode.value}
              onClick={() => onChange(mode.value)}
              title={`${mode.label}: ${mode.example}`}
              className={`
                relative flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl border transition-all duration-200
                ${isActive
                  ? `${mode.activeBg} ${mode.activeBorder} ${mode.activeText} shadow-sm`
                  : 'bg-slate-900/40 border-slate-700/30 text-slate-500 hover:bg-slate-800/50 hover:border-slate-600/40 hover:text-slate-300'
                }
              `}
            >
              <span className={isActive ? mode.activeText : 'text-slate-500'}>
                {mode.icon}
              </span>
              <span className="text-[10px] font-semibold leading-none">{mode.shortLabel}</span>
              {isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-current opacity-80" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active mode description */}
      <div className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${active.activeBg} ${active.activeBorder}`}>
        <span className={active.activeText}>{active.icon}</span>
        <span className="text-slate-400">{active.description}</span>
        <code className={`mr-auto font-mono text-[10px] ${active.activeText} opacity-80`} dir="ltr">{active.example}</code>
      </div>
    </div>
  );
};

export default DetectionModePicker;
