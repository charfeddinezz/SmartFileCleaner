import { FileEntry, TreeNode } from '@/types';

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 ب';
  const sizes = ['ب', 'كب', 'مب', 'جب'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileExtension(path: string): string {
  const parts = path.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function getFileName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

export function isPathLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return false;
  if (trimmed.startsWith('<') || trimmed.startsWith('{') || trimmed.startsWith('.') || trimmed.startsWith('#')) return false;
  if (trimmed.includes(':') && !trimmed.includes('/')) return false;
  if (trimmed.includes('=') || trimmed.includes(';') || trimmed.includes('{') || trimmed.includes('}')) return false;
  const pathPattern = /^[a-zA-Z0-9_\u0600-\u06FF][\w\u0600-\u06FF\-.]*(\/[\w\u0600-\u06FF\-. ]+)*\.[a-zA-Z0-9]{1,6}$/;
  return pathPattern.test(trimmed);
}

export function buildFileTree(files: FileEntry[]): TreeNode[] {
  const root: TreeNode = { name: 'root', path: '', type: 'folder', children: [] };

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const currentPath = parts.slice(0, i + 1).join('/');
      const isFile = i === parts.length - 1;

      if (isFile) {
        current.children = current.children || [];
        current.children.push({
          name: part,
          path: file.path,
          type: 'file',
          file,
          size: new Blob([file.content]).size,
        });
      } else {
        current.children = current.children || [];
        let folder = current.children.find(c => c.name === part && c.type === 'folder');
        if (!folder) {
          folder = { name: part, path: currentPath, type: 'folder', children: [] };
          current.children.push(folder);
        }
        current = folder;
      }
    }
  }

  // Sort: folders first, then files alphabetically
  function sortNode(node: TreeNode) {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortNode);
    }
  }
  sortNode(root);

  return root.children || [];
}

export function countFolders(files: FileEntry[]): number {
  const folders = new Set<string>();
  for (const f of files) {
    const parts = f.path.split('/');
    for (let i = 0; i < parts.length - 1; i++) {
      folders.add(parts.slice(0, i + 1).join('/'));
    }
  }
  return folders.size;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
