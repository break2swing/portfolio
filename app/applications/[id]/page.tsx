import { RepositoryDetail } from '@/components/repositories/RepositoryDetail';
import { notFound } from 'next/navigation';
import { repositoryService } from '@/services/repositoryService';

interface RepositoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Génère les paramètres statiques pour toutes les routes de dépôts
 * Requis pour l'export statique (output: 'export')
 */
export async function generateStaticParams() {
  try {
    const { repositories, error } = await repositoryService.getAllRepositories();
    
    if (error || !repositories) {
      console.error('Error fetching repositories for static generation:', error);
      return [];
    }

    return repositories.map((repository) => ({
      id: repository.id,
    }));
  } catch (error) {
    console.error('Unexpected error generating static params:', error);
    return [];
  }
}

export default async function RepositoryPage({ params }: RepositoryPageProps) {
  const { id } = await params;
  
  if (!id) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <RepositoryDetail repositoryId={id} />
    </div>
  );
}

