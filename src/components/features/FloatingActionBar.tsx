import React, { useState } from 'react';
import {
  Play, Sparkles, Download, Trash2, FilePlus,
  FlaskConical, ChevronRight, ChevronLeft,
  Info, BarChart3,
} from 'lucide-react';

interface FloatingActionBarProps {
  hasFiles: boolean;
  isProcessing: boolean;
  filesCount: number;
  cleanedCount: number;
  onParse: () => void;
  onClean: () => void;
  onSample: () => void;
  onAddFile: () => void;
  onDownloadZip: () => void;
  onDeleteAll: () => void;
  onToggleReport: () => void;
  showReport: boolean;
}

const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  hasFiles,
  isProcessing,
  filesCount,
  cleanedCount,
  onParse,
  onClean,
  onSample,
  onAddFile,
  onDownloadZip,
  onDeleteAll,
  onToggleReport,
  showReport,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const actions = [
    {
      id: 'parse',
      icon: <Play className="w-4 h-4" />,
      label: 'تحليل + تنظيف',
      onClick: onParse,
      disabled: isProcessing,
      gradient: 'from-cyan-600 to-blue-600',
      glow: 'shadow-cyan-900/50',
      primary: true,
    },
    {
      id: 'clean',
      icon: <Sparkles className="w-4 h-4" />,
      label: 'تنظيف الملفات',
      onClick: onClean,
      disabled: !hasFiles || isProcessing,
      gradient: 'from-violet-600 to-purple-600',
      glow: 'shadow-violet-900/50',
      primary: false,
    },
    {
      id: 'sample',
      icon: <FlaskConical className="w-4 h-4" />,
      label: 'نموذج تجريبي',
      onClick: onSample,
      disabled: isProcessing,
      gradient: 'from-emerald-700 to-green-700',
      glow: 'shadow-emerald-900/30',
      primary: false,
    },
    {
      id: 'add',
      icon: <FilePlus className="w-4 h-4" />,
      label: 'إضافة ملف',
      onClick: onAddFile,
      disabled: false,
      gradient: 'from-blue-700 to-indigo-700',
      glow: 'shadow-blue-900/30',
      primary: false,
    },
    {
      id: 'zip',
      icon: <Download className="w-4 h-4" />,
      label: `تنزيل ZIP${filesCount > 0 ? ` (${filesCount})` : ''}`,
      onClick: onDownloadZip,
      disabled: !hasFiles,
      gradient: 'from-teal-700 to-cyan-700',
      glow: 'shadow-teal-900/30',
      primary: false,
    },
    {
      id: 'report',
      icon: <BarChart3 className="w-4 h-4" />,
      label: showReport ? 'إخفاء التقرير' : 'عرض التقرير',
      onClick: onToggleReport,
      disabled: !hasFiles,
      gradient: showReport ? 'from-amber-700 to-orange-700' : 'from-slate-700 to-slate-600',
      glow: 'shadow-amber-900/20',
      primary: false,
    },
    {
      id: 'delete',
      icon: <Trash2 className="w-4 h-4" />,
      label: 'حذف الكل',
      onClick: onDeleteAll,
      disabled: !hasFiles,
      gradient: 'from-red-800 to-rose-800',
      glow: 'shadow-red-900/30',
      primary: false,
      danger: true,
    },
  ];

  return (
    <div
      className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center gap-0"
      style={{ direction: 'ltr' }}
    >
      {/* Action Buttons */}
      <div
        className={`
          flex flex-col gap-1.5 transition-all duration-300 ease-in-out
          ${collapsed ? 'w-0 overflow-hidden opacity-0 pointer-events-none' : 'w-auto opacity-100'}
        `}
      >
        <div className="bg-[#070f1c]/90 backdrop-blur-xl border border-slate-700/40 rounded-r-2xl p-2 flex flex-col gap-1.5 shadow-2xl shadow-black/50">
          {/* Stats mini */}
          {hasFiles && (
            <div className="flex flex-col items-center px-2 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/30 mb-0.5">
              <span className="text-[10px] text-slate-500 font-mono">{filesCount} ملف</span>
              {cleanedCount > 0 && (
                <span className="text-[10px] text-emerald-400 font-mono">✨ {cleanedCount}</span>
              )}
            </div>
          )}

          {actions.map(action => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              title={action.label}
              className={`
                group relative flex items-center gap-0 w-10 overflow-hidden rounded-xl
                bg-gradient-to-br ${action.gradient}
                shadow-md ${action.glow}
                transition-all duration-200
                disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none
                ${!action.disabled ? 'hover:w-36 hover:shadow-lg active:scale-95' : ''}
                ${action.primary ? 'h-10 ring-1 ring-white/10' : 'h-9'}
              `}
              style={{ minWidth: '40px' }}
            >
              <span className="w-10 flex-shrink-0 flex items-center justify-center text-white">
                {action.id === 'parse' && isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  action.icon
                )}
              </span>
              <span className="text-white text-xs font-semibold whitespace-nowrap pr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Toggle Collapse Button */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="h-12 w-5 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/40 border-l-0 rounded-r-lg text-slate-400 hover:text-slate-200 transition-all backdrop-blur-md shadow-lg"
        title={collapsed ? 'إظهار الأزرار' : 'إخفاء الأزرار'}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </div>
  );
};

export default FloatingActionBar;
