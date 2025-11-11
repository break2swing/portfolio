import { gistService } from '@/services/gistService';
import { GistDetail } from '@/components/gists/GistDetail';
import { notFound } from 'next/navigation';

interface GistPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Génère les paramètres statiques pour toutes les routes de Gists
 * Requis pour l'export statique (output: 'export')
 * En mode export statique, retourne un tableau vide car les pages seront générées côté client
 */
export async function generateStaticParams() {
  // En mode export statique, on ne peut pas pré-générer les pages dynamiques
  // Les pages seront générées côté client à la demande
  return [];
}

// Permet aux pages dynamiques d'être générées à la demande
export const dynamicParams = true;

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

