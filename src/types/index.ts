export interface FileEntry {
  path: string;
  content: string;
  originalContent?: string;
  wasCleaned?: boolean;
  detectedPrefix?: string; // the original line that contained the path (for display)
}

export interface ParsedStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  cleanedCount: number;
  duplicatesHandled: number;
}

export type CleanMode = 'html' | 'all' | 'none';
export type DuplicateStrategy = 'merge' | 'keepLast' | 'keepLongest';

/**
 * Detection mode controls HOW file paths are recognized in raw text.
 * - 'auto'       : Smart multi-signal detection (default)
 * - 'strict'     : Only pure paths like "folder/file.ext" (no prefixes)
 * - 'numbered'   : "1. path" or "1: path" or "(1) path"
 * - 'arabic'     : "الملف X: path" or "ملف: path" or "الملف X - path"
 * - 'colon'      : Any "label: path" pattern (English or Arabic)
 * - 'markdown'   : Only ``` code fences with a path on the info line
 * - 'custom'     : User-defined regex patterns
 */
export type DetectionMode = 'auto' | 'strict' | 'numbered' | 'arabic' | 'colon' | 'markdown' | 'custom';

/** A single user-defined custom detection pattern */
export interface CustomPattern {
  id: string;
  name: string;
  regex: string;       // regex string — capture group 1 = path candidate
  flags: string;       // e.g. 'i'
  enabled: boolean;
  example: string;     // example line that the pattern matches
}

export interface AppSettings {
  cleanMode: CleanMode;
  duplicateStrategy: DuplicateStrategy;
  detectionMode: DetectionMode;
  autoClean: boolean;
  showOriginal: boolean;
  customPatterns: CustomPattern[];
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  file?: FileEntry;
  size?: number;
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';
