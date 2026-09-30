import React from 'react';
import { Settings2, Wand2, GitMerge } from 'lucide-react';
import { AppSettings, CleanMode, DuplicateStrategy } from '@/types';

interface SettingsBarProps {
  settings: AppSettings;
  onChange: (updates: Partial<AppSettings>) => void;
}

const SettingsBar: React.FC<SettingsBarProps> = ({ settings, onChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-900/60 rounded-2xl border border-slate-700/30 mb-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Settings2 className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold text-slate-300">الإعدادات</span>
      </div>

      {/* Clean Mode */}
      <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/40">
        <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-xs text-slate-400">وضع التنظيف:</span>
        <select
          value={settings.cleanMode}
          onChange={e => onChange({ cleanMode: e.target.value as CleanMode })}
          className="bg-transparent text-cyan-300 text-xs border-none outline-none cursor-pointer font-medium"
        >
          <option value="all" className="bg-slate-900">كل اللغات (ذكي)</option>
          <option value="html" className="bg-slate-900">HTML فقط</option>
          <option value="none" className="bg-slate-900">بدون تنظيف</option>
        </select>
      </div>

      {/* Duplicate Strategy */}
      <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/40">
        <GitMerge className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-xs text-slate-400">المكررات:</span>
        <select
          value={settings.duplicateStrategy}
          onChange={e => onChange({ duplicateStrategy: e.target.value as DuplicateStrategy })}
          className="bg-transparent text-blue-300 text-xs border-none outline-none cursor-pointer font-medium"
        >
          <option value="merge" className="bg-slate-900">دمج (إلحاق)</option>
          <option value="keepLast" className="bg-slate-900">الاحتفاظ بالأحدث</option>
          <option value="keepLongest" className="bg-slate-900">الاحتفاظ بالأطول</option>
        </select>
      </div>

      {/* Auto Clean Toggle */}
      <label className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/40 cursor-pointer">
        <div className={`w-7 h-4 rounded-full transition-colors relative ${settings.autoClean ? 'bg-cyan-500' : 'bg-slate-600'}`}>
          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${settings.autoClean ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
        </div>
        <span className="text-xs text-slate-400">تنظيف تلقائي</span>
        <input
          type="checkbox"
          className="hidden"
          checked={settings.autoClean}
          onChange={e => onChange({ autoClean: e.target.checked })}
        />
      </label>
    </div>
  );
};

export default SettingsBar;
