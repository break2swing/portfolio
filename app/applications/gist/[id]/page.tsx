import { GistDetail } from '@/components/gists/GistDetail';
import { notFound } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';

interface GistPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Génère les paramètres statiques pour toutes les routes de Gists
 * Requis pour l'export statique (output: 'export')
 * Note: Utilise directement supabaseClient car le cache côté client n'est pas disponible lors du build
 */
export async function generateStaticParams() {
  try {
    const { data, error } = await supabaseClient
      .from('gists')
      .select('id')
      .eq('is_public', true);

    if (error || !data) {
      console.error('Error fetching gists for static generation:', error);
      return [];
    }

    return data.map((gist) => ({
      id: gist.id,
    }));
  } catch (error) {
    console.error('Unexpected error generating static params:', error);
    return [];
  }
}

export default async function GistPage({ params }: GistPageProps) {
  const { id } = await params;
  
  if (!id) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <GistDetail gistId={id} />
    </div>
  );
}
