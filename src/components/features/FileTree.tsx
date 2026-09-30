import React, { useState, useMemo } from 'react';
import { FolderTree, Download, Trash2, Search, X, FolderOpen, BarChart3 } from 'lucide-react';
import { FileEntry, TreeNode } from '@/types';
import { buildFileTree } from '@/lib/fileUtils';
import FileTreeItem from './FileTreeItem';

interface FileTreeProps {
  files: FileEntry[];
  onPreview: (file: FileEntry) => void;
  onEdit: (file: FileEntry) => void;
  onDownload: (file: FileEntry) => void;
  onDelete: (path: string) => void;
  onDeleteAll: () => void;
  onDownloadZip: () => void;
}

const FileTree: React.FC<FileTreeProps> = ({
  files,
  onPreview,
  onEdit,
  onDownload,
  onDelete,
  onDeleteAll,
  onDownloadZip,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = searchQuery.trim()
    ? files.filter(f => f.path.toLowerCase().includes(searchQuery.toLowerCase()))
    : files;

  const tree = buildFileTree(filteredFiles);

  // File type distribution
  const typeStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of files) {
      const ext = f.path.split('.').pop()?.toLowerCase() || 'other';
      counts[ext] = (counts[ext] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [files]);

  const cleanedCount = files.filter(f => f.wasCleaned).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-cyan-400" />
          <span className="font-bold text-slate-200">هيكل المشروع</span>
          {files.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-900/50 text-cyan-300 font-mono border border-cyan-800/40">
              {files.length} ملف
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDownloadZip}
            disabled={files.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-700/40 hover:bg-blue-600/50 text-blue-300 text-xs font-semibold transition-all border border-blue-700/40 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            تنزيل ZIP
          </button>
          <button
            onClick={onDeleteAll}
            disabled={files.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-900/40 hover:bg-red-800/50 text-red-400 text-xs font-semibold transition-all border border-red-900/40 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            حذف الكل
          </button>
        </div>
      </div>

      {/* Search */}
      {files.length > 0 && (
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="بحث في الملفات..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700/40 rounded-xl py-2 pr-9 pl-8 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-cyan-700/50 font-mono transition-colors"
            style={{ direction: 'rtl' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto rounded-2xl bg-slate-900/40 border border-slate-800/40 p-2 min-h-[300px]">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
            <FolderOpen className="w-12 h-12 text-slate-700" />
            <p className="text-slate-500 text-sm">لا توجد ملفات بعد</p>
            <p className="text-slate-600 text-xs">أدخل النص في المحرر واضغط "تحليل + تنظيف"</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
            <Search className="w-10 h-10 text-slate-700" />
            <p className="text-slate-500 text-sm">لا نتائج لـ "{searchQuery}"</p>
          </div>
        ) : (
          <div>
            {tree.map((node, i) => (
              <FileTreeItem
                key={`${node.path}-${i}`}
                node={node}
                depth={0}
                onPreview={onPreview}
                onEdit={onEdit}
                onDownload={onDownload}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* File type distribution bar */}
      {files.length > 0 && typeStats.length > 0 && (
        <div className="mt-3 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/40">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-slate-400 font-semibold">توزيع أنواع الملفات</span>
            {cleanedCount > 0 && (
              <span className="mr-auto text-xs text-emerald-400 font-mono">
                ✨ {cleanedCount} منظف
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {typeStats.map(([ext, count]) => {
              const colors: Record<string, string> = {
                html: 'bg-orange-500/20 text-orange-300 border-orange-700/40',
                css: 'bg-blue-500/20 text-blue-300 border-blue-700/40',
                scss: 'bg-pink-500/20 text-pink-300 border-pink-700/40',
                js: 'bg-yellow-500/20 text-yellow-300 border-yellow-700/40',
                ts: 'bg-blue-600/20 text-blue-200 border-blue-600/40',
                tsx: 'bg-cyan-500/20 text-cyan-300 border-cyan-700/40',
                jsx: 'bg-cyan-500/20 text-cyan-300 border-cyan-700/40',
                json: 'bg-green-500/20 text-green-300 border-green-700/40',
                py: 'bg-yellow-600/20 text-yellow-200 border-yellow-600/40',
                php: 'bg-purple-500/20 text-purple-300 border-purple-700/40',
                sql: 'bg-teal-500/20 text-teal-300 border-teal-700/40',
              };
              const cls = colors[ext] || 'bg-slate-700/30 text-slate-400 border-slate-600/40';
              return (
                <span
                  key={ext}
                  className={`px-2 py-0.5 rounded-full text-xs font-mono border ${cls}`}
                >
                  .{ext} ×{count}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileTree;
