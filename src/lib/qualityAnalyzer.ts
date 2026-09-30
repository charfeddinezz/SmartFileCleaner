import { FileEntry } from '@/types';

export type QualitySeverity = 'warning' | 'info';

export interface QualityFinding {
  severity: QualitySeverity;
  message: string;
}

export interface FileQuality {
  path: string;
  findings: QualityFinding[];
}

const CODE_EXTENSIONS = new Set(['js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'html', 'htm', 'vue', 'svelte', 'json', 'xml']);

function getExtension(path: string): string {
  return path.split('.').pop()?.toLowerCase() ?? '';
}

function hasUnbalancedDelimiters(content: string): boolean {
  const pairs: Record<string, string> = { '{': '}', '[': ']', '(': ')' };
  const stack: string[] = [];
  let quote: string | null = null;
  let escaped = false;

  for (const character of content) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === '\\' && quote) {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }
    if (pairs[character]) stack.push(pairs[character]);
    else if (Object.values(pairs).includes(character) && stack.pop() !== character) return true;
  }

  return Boolean(quote || stack.length);
}

export function analyzeFileQuality(file: FileEntry): FileQuality {
  const findings: QualityFinding[] = [];
  const content = file.content;
  const extension = getExtension(file.path);
  const trimmed = content.trim();

  if (!trimmed) findings.push({ severity: 'warning', message: 'الملف فارغ بعد التنظيف' });
  if (content.length > 500_000) findings.push({ severity: 'info', message: 'حجم الملف كبير وقد يؤثر على الأداء' });
  if (/\b(TODO|FIXME|XXX)\b/i.test(content)) findings.push({ severity: 'info', message: 'يحتوي على مهام أو ملاحظات مؤجلة' });
  if (/(api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']{8,}["']/i.test(content)) {
    findings.push({ severity: 'warning', message: 'قد يحتوي على مفتاح أو سر مكشوف' });
  }
  if (CODE_EXTENSIONS.has(extension) && hasUnbalancedDelimiters(content)) {
    findings.push({ severity: 'warning', message: 'الأقواس أو علامات الاقتباس غير متوازنة' });
  }

  return { path: file.path, findings };
}

export function analyzeFilesQuality(files: FileEntry[]): FileQuality[] {
  return files.map(analyzeFileQuality).filter(result => result.findings.length > 0);
}
