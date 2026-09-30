import { useCallback } from 'react';
import { FileEntry } from '@/types';
import { downloadBlob } from '@/lib/fileUtils';

export function useZipDownload() {
  const downloadZip = useCallback(async (files: FileEntry[], projectName = 'clean_project') => {
    if (files.length === 0) return false;

    try {
      // Dynamic import JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (const f of files) {
        zip.file(f.path, f.content);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const filename = `${projectName}_${Date.now()}.zip`;
      downloadBlob(blob, filename);
      return true;
    } catch (e) {
      console.log('ZIP error:', e);
      return false;
    }
  }, []);

  return { downloadZip };
}
