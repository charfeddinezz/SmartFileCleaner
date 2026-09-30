import React, { useEffect, useRef } from 'react';
import { X, Eye, Download, Sparkles, Copy, Check } from 'lucide-react';
import { FileEntry } from '@/types';
import { FILE_ICONS, FILE_COLORS } from '@/constants';
import { getFileExtension, formatBytes, downloadBlob } from '@/lib/fileUtils';

interface FilePreviewModalProps {
  file: FileEntry | null;
  onClose: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!file) return null;

  const ext = getFileExtension(file.path);
  const icon = FILE_ICONS[ext] || '📄';

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([file.content], { type: 'text/plain; charset=utf-8' });
    downloadBlob(blob, file.path.split('/').pop() || 'file.txt');
  };

  const lines = file.content.split('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0c1825] border border-slate-700/50 shadow-2xl shadow-black/50"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-lg">
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-slate-200 font-medium">{file.path}</span>
                {file.wasCleaned && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 text-xs border border-emerald-800/40">
                    <Sparkles className="w-3 h-3" />
                    نظيف
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {lines.length} سطر • {formatBytes(new Blob([file.content]).size)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'تم النسخ!' : 'نسخ'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700/40 hover:bg-blue-600/50 text-blue-300 text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              تنزيل
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* If was cleaned: show diff info */}
        {file.wasCleaned && file.originalContent && (
          <div className="px-4 py-2 bg-emerald-900/20 border-b border-emerald-900/30 text-xs text-emerald-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            تم تنظيف هذا الملف: أُزيلت النصوص خارج سياق البرمجة
          </div>
        )}

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-0">
          <div className="flex min-h-full">
            {/* Line numbers */}
            <div className="select-none py-4 px-3 text-slate-700 font-mono text-xs leading-[1.6] bg-[#080f1a] text-right sticky left-0 border-r border-slate-800/40" style={{ minWidth: '40px' }}>
              {lines.map((_, i) => (
                <div key={i} style={{ height: '1.6em', lineHeight: '1.6' }}>{i + 1}</div>
              ))}
            </div>

            {/* Code */}
            <pre
              className="flex-1 py-4 px-4 text-slate-300 font-mono text-xs leading-[1.6] overflow-x-auto whitespace-pre"
              style={{ fontFamily: '"IBM Plex Mono", monospace' }}
            >
              {file.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
