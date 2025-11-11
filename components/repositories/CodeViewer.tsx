'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CodeViewerProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  className?: string;
}

/**
 * Composant pour visualiser du code avec syntax highlighting style GitHub
 */
export function CodeViewer({
  code,
  language = 'text',
  filename,
  showLineNumbers = true,
  className = '',
}: CodeViewerProps) {
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  const isDark = resolvedTheme === 'dark';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copié dans le presse-papiers');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  // Détecter le langage depuis le filename si non fourni
  const detectedLanguage = language === 'text' && filename ? detectLanguageFromFilename(filename) : language;

  return (
    <div className={`relative rounded-lg border bg-muted/50 ${className}`}>
      {/* Header style GitHub */}
      {filename && (
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2 text-sm">
          <span className="font-mono text-muted-foreground">{filename}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copié
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copier
              </>
            )}
          </Button>
        </div>
      )}

      {/* Code viewer */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={detectedLanguage}
          style={isDark ? vscDarkPlus : vs}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.5',
          }}
          lineNumberStyle={{
            minWidth: '3em',
            paddingRight: '1em',
            color: isDark ? '#858585' : '#6e7681',
            userSelect: 'none',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

/**
 * Détecte le langage de programmation depuis le nom de fichier
 */
function detectLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
    json: 'json',
    xml: 'xml',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    sql: 'sql',
    md: 'markdown',
    markdown: 'markdown',
    vue: 'vue',
    svelte: 'svelte',
    dart: 'dart',
    lua: 'lua',
    perl: 'perl',
    r: 'r',
    matlab: 'matlab',
  };

  return languageMap[ext] || 'text';
}

