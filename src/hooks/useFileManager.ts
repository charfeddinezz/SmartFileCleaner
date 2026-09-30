import { useState, useCallback, useEffect } from 'react';
import { FileEntry, AppSettings, ParsedStats, CustomPattern } from '@/types';
import { cleanFileContent, parseTextToFiles, mergeDuplicates, cleanExistingFiles } from '@/lib/cleaner';
import { countFolders } from '@/lib/fileUtils';
import { STORAGE_KEY_FILES, STORAGE_KEY_EDITOR, STORAGE_KEY_SETTINGS } from '@/constants';

const DEFAULT_SETTINGS: AppSettings = {
  cleanMode: 'all',
  duplicateStrategy: 'merge',
  detectionMode: 'auto',
  autoClean: true,
  showOriginal: false,
  customPatterns: [],
};

export function useFileManager() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [editorText, setEditorText] = useState('');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<ParsedStats>({
    totalFiles: 0,
    totalFolders: 0,
    totalSize: 0,
    cleanedCount: 0,
    duplicatesHandled: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedFiles = localStorage.getItem(STORAGE_KEY_FILES);
      const savedEditor = localStorage.getItem(STORAGE_KEY_EDITOR);
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (savedFiles) setFiles(JSON.parse(savedFiles));
      if (savedEditor) setEditorText(savedEditor);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({
          ...prev,
          ...parsed,
          customPatterns: parsed.customPatterns ?? [],
        }));
      }
    } catch (e) {
      console.log('Error loading from localStorage:', e);
    }
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files)); }, [files]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_EDITOR, editorText); }, [editorText]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings)); }, [settings]);

  useEffect(() => {
    let totalSize = 0;
    let cleanedCount = 0;
    for (const f of files) {
      totalSize += new Blob([f.content]).size;
      if (f.wasCleaned) cleanedCount++;
    }
    setStats(prev => ({
      ...prev,
      totalFiles: files.length,
      totalFolders: countFolders(files),
      totalSize,
      cleanedCount,
    }));
  }, [files]);

  const parseAndClean = useCallback(() => {
    if (!editorText.trim()) return { success: false, message: 'الرجاء إدخال نص يحتوي على مسارات الملفات' };
    setIsProcessing(true);
    console.log('Starting parse and clean with mode:', settings.detectionMode);

    try {
      const rawFiles = parseTextToFiles(editorText, settings.detectionMode, settings.customPatterns);
      console.log('Parsed files:', rawFiles.length);

      if (rawFiles.length === 0) {
        setIsProcessing(false);
        return { success: false, message: 'لم يتم العثور على ملفات صالحة. تأكد من كتابة المسار ثم المحتوى.' };
      }

      const cleanedFiles = rawFiles.map(file => {
        const { cleaned, wasCleaned } = cleanFileContent(file.content, file.path, settings.cleanMode);
        return {
          path: file.path,
          content: cleaned,
          originalContent: file.content,
          wasCleaned,
        };
      });

      const { files: mergedFiles, duplicatesHandled } = mergeDuplicates(cleanedFiles, settings.duplicateStrategy);

      const finalFiles: FileEntry[] = mergedFiles.map(f => {
        const original = cleanedFiles.find(cf => cf.path === f.path);
        return {
          path: f.path,
          content: f.content,
          originalContent: original?.originalContent,
          wasCleaned: original?.wasCleaned ?? false,
        };
      });

      setFiles(finalFiles);
      setStats(prev => ({ ...prev, duplicatesHandled }));
      setIsProcessing(false);

      return {
        success: true,
        message: `تم التحليل: ${finalFiles.length} ملف${duplicatesHandled > 0 ? `، دُمج ${duplicatesHandled} مكرر` : ''}`,
        filesCount: finalFiles.length,
        duplicatesHandled,
      };
    } catch (e) {
      console.log('Parse error:', e);
      setIsProcessing(false);
      return { success: false, message: 'حدث خطأ أثناء التحليل' };
    }
  }, [editorText, settings]);

  const addFile = useCallback((path: string, content: string) => {
    const newFile: FileEntry = { path, content, wasCleaned: false };
    setFiles(prev => {
      const existing = prev.findIndex(f => f.path === path);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = newFile;
        return updated;
      }
      return [...prev, newFile];
    });
  }, []);

  const addFiles = useCallback((incomingFiles: Array<{ path: string; content: string }>) => {
    const cleanedFiles = incomingFiles.map(file => {
      const { cleaned, wasCleaned } = cleanFileContent(file.content, file.path, settings.cleanMode);
      return {
        path: file.path,
        content: cleaned,
        originalContent: file.content,
        wasCleaned,
      };
    });

    setFiles(prev => {
      const merged = [...prev];
      for (const file of cleanedFiles) {
        const existingIndex = merged.findIndex(existing => existing.path === file.path);
        if (existingIndex === -1) merged.push(file);
        else merged[existingIndex] = file;
      }
      return merged;
    });
  }, [settings.cleanMode]);

  const updateFile = useCallback((oldPath: string, newPath: string, newContent: string) => {
    setFiles(prev => prev.map(f => f.path === oldPath ? { ...f, path: newPath, content: newContent } : f));
  }, []);

  const deleteFile = useCallback((path: string) => {
    setFiles(prev => prev.filter(f => f.path !== path));
  }, []);

  const deleteAll = useCallback(() => { setFiles([]); }, []);

  const clearEditor = useCallback(() => {
    setEditorText('');
    setFiles([]);
  }, []);

  const recleanFiles = useCallback(() => {
    if (files.length === 0) return { success: false, message: 'لا توجد ملفات لتنظيفها' };
    const recleaned = cleanExistingFiles(files, settings.cleanMode);
    const cleanedCount = recleaned.filter(f => f.wasCleaned).length;
    setFiles(recleaned);
    return {
      success: true,
      message: `تم تنظيف ${cleanedCount} ملف من أصل ${recleaned.length}`,
      cleanedCount,
    };
  }, [files, settings.cleanMode]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Custom pattern management
  const addCustomPattern = useCallback((pattern: Omit<CustomPattern, 'id'>) => {
    const id = `cp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setSettings(prev => ({
      ...prev,
      customPatterns: [...prev.customPatterns, { ...pattern, id }],
    }));
    return id;
  }, []);

  const updateCustomPattern = useCallback((id: string, updates: Partial<Omit<CustomPattern, 'id'>>) => {
    setSettings(prev => ({
      ...prev,
      customPatterns: prev.customPatterns.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, []);

  const deleteCustomPattern = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      customPatterns: prev.customPatterns.filter(p => p.id !== id),
    }));
  }, []);

  const toggleCustomPattern = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      customPatterns: prev.customPatterns.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p),
    }));
  }, []);

  const reorderCustomPatterns = useCallback((from: number, to: number) => {
    setSettings(prev => {
      const arr = [...prev.customPatterns];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return { ...prev, customPatterns: arr };
    });
  }, []);

  return {
    files,
    editorText,
    setEditorText,
    settings,
    updateSettings,
    stats,
    isProcessing,
    parseAndClean,
    addFile,
    addFiles,
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
  };
}
