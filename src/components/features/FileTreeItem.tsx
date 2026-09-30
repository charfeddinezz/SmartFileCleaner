import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Eye, Pencil, Download, Trash2, Sparkles } from 'lucide-react';
import { TreeNode, FileEntry } from '@/types';
import { FILE_ICONS, FILE_COLORS } from '@/constants';
import { formatBytes, getFileExtension } from '@/lib/fileUtils';

interface FileTreeItemProps {
  node: TreeNode;
  depth?: number;
  onPreview: (file: FileEntry) => void;
  onEdit: (file: FileEntry) => void;
  onDownload: (file: FileEntry) => void;
  onDelete: (path: string) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  depth = 0,
  onPreview,
  onEdit,
  onDownload,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  if (node.type === 'folder') {
    return (
      <div>
        <div
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-slate-800/60 transition-colors group"
          style={{ paddingRight: `${depth * 16 + 8}px` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-slate-500 w-3">
            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
          {isOpen ? (
            <FolderOpen className="w-4 h-4 text-yellow-400" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-500" />
          )}
          <span className="text-sm text-slate-300 font-medium font-mono flex-1">{node.name}</span>
          <span className="text-xs text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.children?.length || 0} عنصر
          </span>
        </div>
        {isOpen && node.children && (
          <div>
            {node.children.map((child, i) => (
              <FileTreeItem
                key={`${child.path}-${i}`}
                node={child}
                depth={depth + 1}
                onPreview={onPreview}
                onEdit={onEdit}
                onDownload={onDownload}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File node
  const ext = getFileExtension(node.name);
  const icon = FILE_ICONS[ext] || '📄';
  const colorClass = FILE_COLORS[ext] || 'text-slate-400';

  return (
    <div
      className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors cursor-default"
      style={{ paddingRight: `${depth * 16 + 8}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="w-3" />
      <span className="text-sm w-4 text-center">{icon}</span>
      <span className={`text-sm font-mono flex-1 truncate ${colorClass}`}>
        {node.name}
        {node.file?.wasCleaned && (
          <span title="تم تنظيفه">
            <Sparkles className="w-3 h-3 inline mr-1 text-emerald-400" />
          </span>
        )}
      </span>
      <span className="text-xs text-slate-600 font-mono mr-1">{formatBytes(node.size || 0)}</span>

      {/* Action buttons */}
      <div
        className={`flex items-center gap-0.5 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button
          onClick={() => node.file && onPreview(node.file)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-colors"
          title="معاينة"
        >
          <Eye className="w-3 h-3" />
        </button>
        <button
          onClick={() => node.file && onEdit(node.file)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-yellow-300 transition-colors"
          title="تعديل"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={() => node.file && onDownload(node.file)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-blue-300 transition-colors"
          title="تنزيل"
        >
          <Download className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDelete(node.path)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition-colors"
          title="حذف"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default FileTreeItem;
