'use client';

import { useMemo, useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Code splitting: charger React Markdown et plugins uniquement quand nécessaire
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
  ssr: false,
});

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const [DOMPurify, setDOMPurify] = useState<any>(null);
  const [remarkGfm, setRemarkGfm] = useState<any>(null);

  // Charger DOMPurify et remarkGfm uniquement côté client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Promise.all([
        import('isomorphic-dompurify'),
        import('remark-gfm'),
      ]).then(([dompurifyModule, remarkGfmModule]) => {
        setDOMPurify(dompurifyModule.default);
        setRemarkGfm(() => remarkGfmModule.default);
      });
    }
  }, []);

  // Sanitiser le contenu pour prévenir les attaques XSS
  // DOMPurify supprime les scripts, événements inline, et autres contenus dangereux
  const sanitizedContent = useMemo(() => {
    if (!DOMPurify) return content; // Fallback pendant le chargement

    return DOMPurify.sanitize(content, {
      // Permet les balises Markdown communes
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'em', 'u', 's', 'del', 'ins',
        'a', 'img',
        'ul', 'ol', 'li',
        'blockquote', 'code', 'pre',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'hr', 'div', 'span'
      ],
      // Permet les attributs nécessaires
      ALLOWED_ATTR: [
        'href', 'title', 'alt', 'src',
        'class', 'id',
        'align', 'start',
        'colspan', 'rowspan'
      ],
      // Bloque JavaScript dans les URLs
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
    });
  }, [content, DOMPurify]);

  // Afficher un loader si les dépendances ne sont pas encore chargées
  if (!DOMPurify || !remarkGfm) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />,
          h2: ({ ...props }) => <h2 className="text-2xl font-semibold mt-5 mb-3" {...props} />,
          h3: ({ ...props }) => <h3 className="text-xl font-semibold mt-4 mb-2" {...props} />,
          p: ({ ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc list-inside mb-4 space-y-1" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal list-inside mb-4 space-y-1" {...props} />,
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-4" {...props} />
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <code
                className="block bg-muted p-4 rounded-lg overflow-x-auto text-sm"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },
          a: ({ ...props }) => (
            <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
          ),
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
