'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/contexts/ThemeContext';

// Code splitting: charger React Markdown et plugins uniquement quand nécessaire
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
  ssr: false,
});

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

/**
 * Composant amélioré pour visualiser du Markdown avec syntax highlighting style GitHub
 */
export function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
  const [remarkGfm, setRemarkGfm] = useState<any>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Charger remarkGfm uniquement côté client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('remark-gfm').then((module) => {
        setRemarkGfm(() => module.default);
      });
    }
  }, []);

  // Afficher un loader si les dépendances ne sont pas encore chargées
  if (!remarkGfm) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`prose prose-slate dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => <h1 className="text-3xl font-bold mt-6 mb-4 border-b pb-2" {...props} />,
          h2: ({ ...props }) => <h2 className="text-2xl font-semibold mt-5 mb-3 border-b pb-2" {...props} />,
          h3: ({ ...props }) => <h3 className="text-xl font-semibold mt-4 mb-2" {...props} />,
          h4: ({ ...props }) => <h4 className="text-lg font-semibold mt-3 mb-2" {...props} />,
          p: ({ ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc list-inside mb-4 space-y-1" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal list-inside mb-4 space-y-1" {...props} />,
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground" {...props} />
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : 'text';
            const codeString = String(children).replace(/\n$/, '');

            return match ? (
              <div className="my-4 rounded-lg border overflow-hidden">
                <SyntaxHighlighter
                  language={language}
                  style={isDark ? vscDarkPlus : vs}
                  showLineNumbers={codeString.split('\n').length > 1}
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
                  {codeString}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          a: ({ ...props }) => (
            <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-border border rounded-lg" {...props} />
            </div>
          ),
          thead: ({ ...props }) => <thead className="bg-muted" {...props} />,
          th: ({ ...props }) => (
            <th className="px-4 py-2 text-left text-sm font-semibold" {...props} />
          ),
          td: ({ ...props }) => (
            <td className="px-4 py-2 text-sm border-t" {...props} />
          ),
          img: ({ ...props }) => (
            <img className="rounded-lg my-4 max-w-full" {...props} />
          ),
          hr: ({ ...props }) => (
            <hr className="my-6 border-t border-border" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

