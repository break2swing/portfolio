import { gistService } from '@/services/gistService';
import { GistDetail } from '@/components/gists/GistDetail';
import { notFound } from 'next/navigation';

interface GistPageProps {
  params: {
    id: string;
  };
}

/**
 * Génère les paramètres statiques pour toutes les routes de Gists
 * Requis pour l'export statique (output: 'export')
 */
export async function generateStaticParams() {
  try {
    const { gists, error } = await gistService.getAllGists();
    
    if (error || !gists) {
      console.error('Error fetching gists for static generation:', error);
      return [];
    }

    return gists.map((gist) => ({
      id: gist.id,
    }));
  } catch (error) {
    console.error('Unexpected error generating static params:', error);
    return [];
  }
}

export default function GistPage({ params }: GistPageProps) {
  if (!params.id) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <GistDetail gistId={params.id} />
    </div>
  );
}

