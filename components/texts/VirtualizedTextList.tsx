'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TextWithMetadata } from '@/lib/supabaseClient';
import { TextCard } from '@/components/texts/TextCard';

interface VirtualizedTextListProps {
  texts: TextWithMetadata[];
  onTextClick: (text: TextWithMetadata) => void;
}

export function VirtualizedTextList({ texts, onTextClick }: VirtualizedTextListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState<number>(0);

  // Détecter la largeur de la fenêtre pour le responsive
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setWindowWidth(window.innerWidth);
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Configuration pour une grille responsive
  const columnCount = useMemo(() => {
    if (windowWidth === 0) return 3; // Valeur par défaut avant le premier rendu
    if (windowWidth < 768) return 1; // md
    if (windowWidth < 1024) return 2; // lg
    return 3; // xl
  }, [windowWidth]);

  const rowCount = Math.ceil(texts.length / columnCount);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 250, // Hauteur estimée d'une carte de texte
    overscan: 2,
  });

  if (texts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Aucun texte ne correspond à vos critères de recherche
        </p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-400px)] overflow-auto"
      role="grid"
      aria-label="Liste des textes"
      aria-rowcount={rowCount}
      aria-colcount={columnCount}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columnCount;
          const endIndex = Math.min(startIndex + columnCount, texts.length);
          const rowTexts = texts.slice(startIndex, endIndex);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              role="row"
              aria-rowindex={virtualRow.index + 1}
            >
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-1">
                {rowTexts.map((text, colIndex) => (
                  <div
                    key={text.id}
                    role="gridcell"
                    aria-colindex={colIndex + 1}
                  >
                    <TextCard
                      text={text}
                      onClick={() => onTextClick(text)}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

