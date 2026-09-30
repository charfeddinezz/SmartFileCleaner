import React, { useState, useEffect } from 'react';
import { X, Save, FilePlus, Pencil, AlertCircle } from 'lucide-react';
import { FileEntry } from '@/types';

interface FileEditModalProps {
  file: FileEntry | null; // null = new file
  isOpen: boolean;
  onClose: () => void;
  onSave: (oldPath: string | null, newPath: string, content: string) => void;
}

const FileEditModal: React.FC<FileEditModalProps> = ({ file, isOpen, onClose, onSave }) => {
  const [path, setPath] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPath(file?.path || '');
      setContent(file?.content || '');
      setError('');
    }
  }, [file, isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimPath = path.trim();
    if (!trimPath) { setError('يرجى إدخال مسار الملف'); return; }
    if (!trimPath.includes('.')) { setError('المسار يجب أن يحتوي على امتداد (مثل: .html, .css, .js)'); return; }
    if (trimPath.includes(' ') && !trimPath.includes('/')) { setError('المسار لا يمكن أن يحتوي على مسافات'); return; }
    setError('');
    onSave(file?.path || null, trimPath, content);
    onClose();
  };

  const isNew = !file;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0c1825] border border-slate-700/50 shadow-2xl shadow-black/50"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            {isNew ? (
              <FilePlus className="w-5 h-5 text-cyan-400" />
            ) : (
              <Pencil className="w-5 h-5 text-yellow-400" />
            )}
            <span className="font-bold text-slate-200">
              {isNew ? 'إضافة ملف جديد' : `تعديل: ${file.path}`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
          {/* Path Input */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">
              مسار الملف <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={path}
              onChange={e => setPath(e.target.value)}
              placeholder="مثال: src/components/Header.tsx"
              className="w-full bg-slate-900/60 border border-slate-700/40 rounded-xl py-2.5 px-4 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-700/60 font-mono transition-colors"
              style={{ direction: 'ltr', textAlign: 'left' }}
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-1.5 mt-1.5 text-red-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}
          </div>

          {/* Content Textarea */}
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">المحتوى</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="// اكتب محتوى الملف هنا..."
              className="w-full h-64 bg-[#060d18] border border-slate-700/40 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder-slate-700 outline-none focus:border-cyan-700/60 font-mono transition-colors resize-y"
              style={{ direction: 'ltr', textAlign: 'left', lineHeight: '1.6', fontFamily: '"IBM Plex Mono", monospace' }}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-800/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 text-sm font-medium transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold transition-all shadow-lg shadow-cyan-900/30"
          >
            <Save className="w-4 h-4" />
            {isNew ? 'إضافة الملف' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileEditModal;
