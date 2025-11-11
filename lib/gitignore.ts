/**
 * lib/gitignore.ts
 * Utilitaire pour parser et appliquer les règles .gitignore
 */

/**
 * Parse un fichier .gitignore et retourne les patterns
 */
export function parseGitignore(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      // Ignorer les lignes vides et les commentaires
      return line.length > 0 && !line.startsWith('#');
    });
}

/**
 * Normalise un chemin pour la comparaison
 */
function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}

/**
 * Vérifie si un pattern .gitignore correspond à un chemin
 */
function matchesPattern(pattern: string, filePath: string): boolean {
  const normalizedPath = normalizePath(filePath);
  const normalizedPattern = normalizePath(pattern);

  // Pattern exact
  if (normalizedPattern === normalizedPath) {
    return true;
  }

  // Pattern avec wildcard *
  if (normalizedPattern.includes('*')) {
    const regexPattern = normalizedPattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(normalizedPath);
  }

  // Pattern de dossier (se termine par /)
  if (normalizedPattern.endsWith('/')) {
    const dirPattern = normalizedPattern.slice(0, -1);
    return normalizedPath.startsWith(dirPattern + '/') || normalizedPath === dirPattern;
  }

  // Pattern de fichier à la fin du chemin
  if (normalizedPattern.startsWith('**/')) {
    // Pattern récursif
    const subPattern = normalizedPattern.slice(3);
    return normalizedPath.includes(subPattern);
  }

  // Pattern de fichier dans n'importe quel dossier
  if (normalizedPattern.includes('/')) {
    // Pattern avec chemin relatif
    return normalizedPath.endsWith('/' + normalizedPattern) || normalizedPath === normalizedPattern;
  }

  // Pattern simple (nom de fichier ou extension)
  return (
    normalizedPath === normalizedPattern ||
    normalizedPath.endsWith('/' + normalizedPattern) ||
    normalizedPath.split('/').pop() === normalizedPattern
  );
}

/**
 * Filtre une liste de fichiers selon les règles .gitignore
 * Note: Le fichier .gitignore lui-même est toujours inclus dans le résultat
 */
export function filterFilesByGitignore(
  files: File[],
  gitignoreContent: string | null
): File[] {
  if (!gitignoreContent) {
    return files;
  }

  const patterns = parseGitignore(gitignoreContent);
  const ignoredFiles = new Set<string>();
  
  // Identifier le fichier .gitignore pour ne pas le filtrer
  const gitignorePath = files.find(f => {
    const name = f.name.toLowerCase();
    return name === '.gitignore';
  });
  const gitignoreFilePath = gitignorePath && 'webkitRelativePath' in gitignorePath && gitignorePath.webkitRelativePath
    ? gitignorePath.webkitRelativePath
    : gitignorePath?.name || '.gitignore';

  // Marquer les fichiers ignorés
  files.forEach((file) => {
    const filePath = 'webkitRelativePath' in file && file.webkitRelativePath
      ? file.webkitRelativePath
      : file.name;

    const normalizedPath = normalizePath(filePath);

    // Toujours inclure le fichier .gitignore lui-même
    if (normalizedPath === normalizePath(gitignoreFilePath)) {
      return;
    }

    // Vérifier chaque pattern
    for (const pattern of patterns) {
      if (matchesPattern(pattern, normalizedPath)) {
        ignoredFiles.add(filePath);
        break;
      }
    }
  });

  // Retourner uniquement les fichiers non ignorés (incluant toujours .gitignore)
  return files.filter((file) => {
    const filePath = 'webkitRelativePath' in file && file.webkitRelativePath
      ? file.webkitRelativePath
      : file.name;
    return !ignoredFiles.has(filePath);
  });
}

/**
 * Trouve et lit le fichier .gitignore dans une liste de fichiers
 */
export function findGitignoreFile(files: File[]): File | null {
  return files.find((file) => {
    const name = file.name.toLowerCase();
    return name === '.gitignore';
  }) || null;
}

/**
 * Lit le contenu d'un fichier .gitignore
 */
export async function readGitignoreContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string || '');
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

