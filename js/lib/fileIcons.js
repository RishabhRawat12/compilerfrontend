/**
 * Standard utility for file icons
 */
export function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'c': return { icon: 'file-code', colorClass: 'text-syntax-fn' };
    case 'h': return { icon: 'file-text', colorClass: 'text-syntax-type' };
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx': return { icon: 'file-json-2', colorClass: 'text-warning' };
    case 'json': return { icon: 'file-json', colorClass: 'text-warning' };
    case 'md': return { icon: 'file-text', colorClass: 'text-muted-foreground' };
    case 'txt': return { icon: 'file-text', colorClass: 'text-subtle-foreground' };
    default: return { icon: 'file', colorClass: 'text-muted-foreground' };
  }
}

/**
 * Infer Monaco language from filename
 */
export function getLanguageFromName(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'c':
    case 'cb':
    case 'h': return 'c';
    case 'json': return 'json';
    case 'js': return 'javascript';
    case 'ts': return 'typescript';
    case 'md': return 'markdown';
    default: return 'plaintext';
  }
}
