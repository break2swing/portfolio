'use client';

import { useState, useEffect } from 'react';
import { Text } from '@/lib/supabaseClient';
import { textService } from '@/services/textService';
import { TextCard } from '@/components/texts/TextCard';
import { TextDetailModal } from '@/components/texts/TextDetailModal';
import { Loader2, FileText } from 'lucide-react';

export default function TextesPage() {
  const [texts, setTexts] = useState<Text[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedText, setSelectedText] = useState<Text | null>(null);

  useEffect(() => {
    fetchTexts();
  }, []);

  const fetchTexts = async () => {
    setLoading(true);
    try {
      const { texts: data, error } = await textService.getAllTexts();

      if (error) throw error;

      setTexts(data || []);
    } catch (error) {
      console.error('Error fetching texts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement des textes...</p>
        </div>
      </div>
    );
  }

  if (texts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-6 rounded-full bg-muted">
          <FileText className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold">Textes</h1>
        <p className="text-xl text-muted-foreground text-center max-w-md">
          Aucun texte disponible
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Les textes apparaîtront ici une fois publiés
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Textes</h1>
        <p className="text-muted-foreground">
          Mes écrits et articles
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {texts.map((text) => (
          <TextCard
            key={text.id}
            text={text}
            onClick={() => setSelectedText(text)}
          />
        ))}
      </div>

      <TextDetailModal
        text={selectedText}
        open={selectedText !== null}
        onClose={() => setSelectedText(null)}
      />
    </div>
  );
}
