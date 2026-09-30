import React, { useState } from 'react';
import { CheckCircle2, Sparkles, X, ChevronDown, ChevronUp, BarChart3, FileWarning, ShieldAlert, Lightbulb } from 'lucide-react';
import { FileEntry } from '@/types';
import { formatBytes } from '@/lib/fileUtils';
import { analyzeFilesQuality } from '@/lib/qualityAnalyzer';

interface CleaningReportProps {
  files: FileEntry[];
  onClose: () => void;
}

const CleaningReport: React.FC<CleaningReportProps> = ({ files, onClose }) => {
  const [expanded, setExpanded] = useState(false);
  const cleanedFiles = files.filter(f => f.wasCleaned);
  const cleanFiles = files.filter(f => !f.wasCleaned);
  const qualityResults = analyzeFilesQuality(files);
  const qualityFindings = qualityResults.reduce((total, result) => total + result.findings.length, 0);

  if (files.length === 0) return null;

  const totalOriginalSize = files.reduce((acc, f) => acc + new Blob([f.originalContent ?? f.content]).size, 0);
  const totalCleanedSize = files.reduce((acc, f) => acc + new Blob([f.content]).size, 0);
  const savedBytes = totalOriginalSize - totalCleanedSize;
  const savedPercent = totalOriginalSize > 0 ? Math.round((savedBytes / totalOriginalSize) * 100) : 0;

  return (
    <div className="mt-4 rounded-2xl border border-emerald-800/30 bg-emerald-950/15 overflow-hidden fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-emerald-900/30 bg-emerald-950/20">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-300">
            تقرير التنظيف
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-900/40 text-emerald-400 border border-emerald-800/40">
            {cleanedFiles.length}/{files.length} منظف
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'طيّ' : 'توسيع'}
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary stats row */}
      <div className="flex flex-wrap gap-3 px-4 py-2.5 border-b border-emerald-900/20">
        <div className="flex items-center gap-1.5 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">ملفات منظفة:</span>
          <span className="text-emerald-300 font-bold font-mono">{cleanedFiles.length}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400">نظيفة أصلاً:</span>
          <span className="text-slate-300 font-bold font-mono">{cleanFiles.length}</span>
        </div>
        {savedBytes > 0 && (
          <div className="flex items-center gap-1.5 text-xs mr-auto">
            <span className="text-slate-400">حُذف:</span>
            <span className="text-orange-300 font-bold font-mono">{formatBytes(savedBytes)}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-orange-900/30 text-orange-400 text-[10px] border border-orange-800/30">
              -{savedPercent}%
            </span>
          </div>
        )}
        {/* Progress bar */}
        <div className="w-full flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 rounded-full bg-slate-800/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-700"
              style={{ width: `${files.length > 0 ? (cleanedFiles.length / files.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {files.length > 0 ? Math.round((cleanedFiles.length / files.length) * 100) : 0}%
          </span>
        </div>
      </div>

      {qualityResults.length > 0 && (
        <div className="px-4 py-3 border-b border-amber-900/20 bg-amber-950/10">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-300">مراجعة ذكية</span>
            <span className="text-[10px] text-slate-500">{qualityFindings} ملاحظة في {qualityResults.length} ملف</span>
          </div>
          <div className="grid gap-1.5">
            {qualityResults.slice(0, expanded ? qualityResults.length : 3).map(result => (
              <div key={result.path} className="flex items-start gap-2 text-[11px]">
                <FileWarning className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-400" />
                <span className="font-mono text-slate-400 truncate max-w-[42%]" title={result.path}>{result.path}</span>
                <span className="text-slate-500">{result.findings.map(finding => finding.message).join('، ')}</span>
              </div>
            ))}
          </div>
          {!expanded && qualityResults.length > 3 && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500">
              <Lightbulb className="w-3 h-3 text-cyan-400" />
              وسّع التقرير لرؤية بقية الملاحظات
            </div>
          )}
        </div>
      )}

      {/* File List */}
      <div className={`transition-all duration-300 overflow-hidden ${expanded ? 'max-h-64' : 'max-h-20'} overflow-y-auto`}>
        <div className="p-3 flex flex-wrap gap-1.5">
          {cleanedFiles.map(f => (
            <div
              key={f.path}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/25 border border-emerald-800/40 text-emerald-300 text-[11px] font-mono hover:bg-emerald-900/40 transition-colors"
              title={`تم تنظيفه — ${formatBytes(new Blob([f.content]).size)}`}
            >
              <Sparkles className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="max-w-[180px] truncate">{f.path}</span>
            </div>
          ))}
          {cleanFiles.map(f => (
            <div
              key={f.path}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/25 border border-slate-700/30 text-slate-500 text-[11px] font-mono"
            >
              <CheckCircle2 className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="max-w-[180px] truncate">{f.path}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CleaningReport;
