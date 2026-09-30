import React from 'react';
import { FileText, FolderOpen, HardDrive, Sparkles, GitMerge } from 'lucide-react';
import { ParsedStats } from '@/types';
import { formatBytes } from '@/lib/fileUtils';

interface StatsBarProps {
  stats: ParsedStats;
}

const StatItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}> = ({ icon, label, value, color = 'text-cyan-400' }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800/50">
    <span className={color}>{icon}</span>
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-bold text-slate-200 font-mono">{value}</div>
    </div>
  </div>
);

const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <StatItem
        icon={<FileText className="w-4 h-4" />}
        label="الملفات"
        value={stats.totalFiles}
        color="text-cyan-400"
      />
      <StatItem
        icon={<FolderOpen className="w-4 h-4" />}
        label="المجلدات"
        value={stats.totalFolders}
        color="text-yellow-400"
      />
      <StatItem
        icon={<HardDrive className="w-4 h-4" />}
        label="الحجم الكلي"
        value={formatBytes(stats.totalSize)}
        color="text-blue-400"
      />
      {stats.cleanedCount > 0 && (
        <StatItem
          icon={<Sparkles className="w-4 h-4" />}
          label="تم تنظيفه"
          value={`${stats.cleanedCount} ملف`}
          color="text-emerald-400"
        />
      )}
      {stats.duplicatesHandled > 0 && (
        <StatItem
          icon={<GitMerge className="w-4 h-4" />}
          label="مكررات مدمجة"
          value={stats.duplicatesHandled}
          color="text-orange-400"
        />
      )}
    </div>
  );
};

export default StatsBar;
