import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import CodeEditor from '@/components/features/CodeEditor';
import FileTree from '@/components/features/FileTree';
import StatsBar from '@/components/features/StatsBar';
import FilePreviewModal from '@/components/features/FilePreviewModal';
import FileEditModal from '@/components/features/FileEditModal';
import CleaningReport from '@/components/features/CleaningReport';
import FloatingActionBar from '@/components/features/FloatingActionBar';
import { useFileManager } from '@/hooks/useFileManager';
import { useZipDownload } from '@/hooks/useZipDownload';
import { FileEntry } from '@/types';
import { SAMPLE_TEXT } from '@/constants';
import { downloadBlob, getFileName } from '@/lib/fileUtils';
import heroBg from '@/assets/hero-bg.webp';

const Home: React.FC = () => {
  const {
    files,
    editorText,
    setEditorText,
    settings,
    updateSettings,
    stats,
    isProcessing,
    parseAndClean,
    addFile,
    updateFile,
    deleteFile,
    deleteAll,
    clearEditor,
    recleanFiles,
    addCustomPattern,
    updateCustomPattern,
    deleteCustomPattern,
    toggleCustomPattern,
    reorderCustomPatterns,
  } = useFileManager();

  const { downloadZip } = useZipDownload();
  const [previewFile, setPreviewFile] = useState<FileEntry | null>(null);
  const [editFile, setEditFile] = useState<FileEntry | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const handleParse = useCallback(() => {
    const result = parseAndClean();
    if (result.success) {
      toast.success(result.message || 'تم التحليل بنجاح');
      setShowReport(true);
    } else {
      toast.error(result.message || 'حدث خطأ');
    }
  }, [parseAndClean]);

  const handleClean = useCallback(() => {
    const result = recleanFiles();
    if (result.success) {
      toast.success(result.message || 'تم التنظيف');
      setShowReport(true);
    } else {
      toast.error(result.message || 'لا توجد ملفات');
    }
  }, [recleanFiles]);

  const handleSample = useCallback(() => {
    setEditorText(SAMPLE_TEXT);
    setTimeout(() => {
      const result = parseAndClean();
      if (result.success) {
        toast.success('تم تحميل النموذج التجريبي وتنظيفه');
        setShowReport(true);
      }
    }, 100);
  }, [setEditorText, parseAndClean]);

  const handleClear = useCallback(() => {
    clearEditor();
    setShowReport(false);
    toast.info('تم مسح كل شيء');
  }, [clearEditor]);

  const handleAddFile = useCallback(() => {
    setEditFile(null);
    setIsEditOpen(true);
  }, []);

  const handleEditFile = useCallback((file: FileEntry) => {
    setEditFile(file);
    setIsEditOpen(true);
  }, []);

  const handleSaveFile = useCallback(
    (oldPath: string | null, newPath: string, content: string) => {
      if (oldPath) {
        updateFile(oldPath, newPath, content);
        toast.success(`تم تحديث ${newPath}`);
      } else {
        addFile(newPath, content);
        toast.success(`تمت إضافة ${newPath}`);
      }
    },
    [addFile, updateFile]
  );

  const handleDelete = useCallback(
    (path: string) => {
      if (confirm(`هل تريد حذف ${path}؟`)) {
        deleteFile(path);
        toast.success(`تم حذف ${path}`);
      }
    },
    [deleteFile]
  );

  const handleDeleteAll = useCallback(() => {
    if (files.length === 0) return;
    if (confirm('هل تريد حذف جميع الملفات؟')) {
      deleteAll();
      setShowReport(false);
      toast.success('تم حذف جميع الملفات');
    }
  }, [deleteAll, files.length]);

  const handleDownloadZip = useCallback(async () => {
    if (files.length === 0) { toast.error('لا توجد ملفات للتنزيل'); return; }
    const success = await downloadZip(files);
    if (success) {
      toast.success(`تم إنشاء ZIP بـ ${files.length} ملف`);
    } else {
      toast.error('فشل إنشاء ZIP');
    }
  }, [downloadZip, files]);

  const handleDownloadSingle = useCallback((file: FileEntry) => {
    const blob = new Blob([file.content], { type: 'text/plain; charset=utf-8' });
    downloadBlob(blob, getFileName(file.path));
    toast.success(`تم تنزيل ${file.path}`);
  }, []);

  return (
    <div className="min-h-screen relative" dir="rtl">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-[#030a14]/92 via-[#071224]/90 to-[#040c1a]/95" />

      {/* Floating Action Bar */}
      <FloatingActionBar
        hasFiles={files.length > 0}
        isProcessing={isProcessing}
        filesCount={files.length}
        cleanedCount={stats.cleanedCount}
        onParse={handleParse}
        onClean={handleClean}
        onSample={handleSample}
        onAddFile={handleAddFile}
        onDownloadZip={handleDownloadZip}
        onDeleteAll={handleDeleteAll}
        onToggleReport={() => setShowReport(v => !v)}
        showReport={showReport}
      />

      {/* Ambient glows */}
      <div className="fixed top-20 left-10 w-80 h-80 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-80 h-80 bg-blue-700/5 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 container mx-auto max-w-[1440px] px-4 py-6">
        <Header />

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Panel - Editor */}
          <div className="flex flex-col">
            <div className="glass-card flex flex-col p-5 rounded-2xl">
              <CodeEditor
                value={editorText}
                onChange={setEditorText}
                settings={settings}
                onSettingsChange={updateSettings}
                onParse={handleParse}
                onClean={handleClean}
                onClear={handleClear}
                onSample={handleSample}
                onAddFile={handleAddFile}
                isProcessing={isProcessing}
                hasFiles={files.length > 0}
                onAddPattern={addCustomPattern}
                onUpdatePattern={updateCustomPattern}
                onDeletePattern={deleteCustomPattern}
                onTogglePattern={toggleCustomPattern}
                onReorderPatterns={reorderCustomPatterns}
              />
              <StatsBar stats={stats} />
            </div>

            {/* Cleaning Report */}
            {showReport && files.length > 0 && (
              <CleaningReport files={files} onClose={() => setShowReport(false)} />
            )}
          </div>

          {/* Right Panel - File Tree */}
          <div className="glass-card flex flex-col p-5 rounded-2xl" style={{ minHeight: '600px' }}>
            <FileTree
              files={files}
              onPreview={setPreviewFile}
              onEdit={handleEditFile}
              onDownload={handleDownloadSingle}
              onDelete={handleDelete}
              onDeleteAll={handleDeleteAll}
              onDownloadZip={handleDownloadZip}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 pb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/40 border border-slate-800/40 text-slate-500 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            خاصية التنظيف الذكي: تزيل تلقائياً أي كلمات أو رموز خارج السياق البرمجي من HTML، CSS، JS، JSON وأكثر
          </div>
        </footer>
      </div>

      {/* Modals */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      <FileEditModal
        file={editFile}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveFile}
      />
    </div>
  );
};

export default Home;
