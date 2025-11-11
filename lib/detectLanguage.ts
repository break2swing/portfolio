/**
 * lib/detectLanguage.ts
 * Utilitaire pour détecter le langage de programmation à partir du nom de fichier
 */

/**
 * Mapping des extensions de fichiers vers les langages de programmation
 */
const LANGUAGE_MAP: Record<string, string> = {
  // JavaScript/TypeScript
  'js': 'javascript',
  'jsx': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'mjs': 'javascript',
  'cjs': 'javascript',
  
  // Web
  'html': 'html',
  'htm': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'less': 'less',
  
  // Python
  'py': 'python',
  'pyw': 'python',
  'pyi': 'python',
  
  // Java
  'java': 'java',
  'class': 'java',
  'jar': 'java',
  
  // C/C++
  'c': 'c',
  'cpp': 'cpp',
  'cc': 'cpp',
  'cxx': 'cpp',
  'h': 'c',
  'hpp': 'cpp',
  'hxx': 'cpp',
  
  // C#
  'cs': 'csharp',
  
  // PHP
  'php': 'php',
  'phtml': 'php',
  
  // Ruby
  'rb': 'ruby',
  'rake': 'ruby',
  
  // Go
  'go': 'go',
  
  // Rust
  'rs': 'rust',
  
  // Swift
  'swift': 'swift',
  
  // Kotlin
  'kt': 'kotlin',
  'kts': 'kotlin',
  
  // Shell
  'sh': 'shell',
  'bash': 'shell',
  'zsh': 'shell',
  'fish': 'shell',
  
  // SQL
  'sql': 'sql',
  
  // JSON
  'json': 'json',
  
  // YAML
  'yml': 'yaml',
  'yaml': 'yaml',
  
  // XML
  'xml': 'xml',
  
  // Markdown
  'md': 'markdown',
  'markdown': 'markdown',
  
  // Docker
  'dockerfile': 'dockerfile',
  
  // Makefile
  'makefile': 'makefile',
  'mk': 'makefile',
  
  // Config
  'ini': 'ini',
  'toml': 'toml',
  'conf': 'ini',
  'config': 'ini',
  
  // Other
  'txt': 'text',
  'log': 'text',
};

/**
 * Détecte le langage de programmation à partir du nom de fichier
 * @param filename - Nom du fichier avec extension
 * @returns Le langage détecté ou null si non reconnu
 */
export function detectLanguageFromFilename(filename: string): string | null {
  if (!filename || !filename.includes('.')) {
    return null;
  }

  // Extraire l'extension (en minuscules)
  const extension = filename.split('.').pop()?.toLowerCase();
  
  if (!extension) {
    return null;
  }

  // Cas spécial pour Dockerfile (pas d'extension)
  if (filename.toLowerCase() === 'dockerfile') {
    return 'dockerfile';
  }

  // Cas spécial pour Makefile
  if (filename.toLowerCase() === 'makefile') {
    return 'makefile';
  }

  return LANGUAGE_MAP[extension] || null;
}

/**
 * Formate le nom du langage pour l'affichage
 * @param language - Code du langage (ex: "javascript")
 * @returns Nom formaté (ex: "JavaScript")
 */
export function formatLanguageName(language: string | null): string {
  if (!language) return 'Text';
  
  const formatted: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    csharp: 'C#',
    cpp: 'C++',
    shell: 'Shell',
    markdown: 'Markdown',
    dockerfile: 'Dockerfile',
    makefile: 'Makefile',
  };

  return formatted[language] || language.charAt(0).toUpperCase() + language.slice(1);
}

