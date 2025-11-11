'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { TextWithMetadata } from '@/lib/supabaseClient';
import { textService } from '@/services/textService';
import { RefreshButton } from '@/components/RefreshButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, Settings, FolderTree, Tags } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load admin components
const TextUploadForm = dynamic(() => import('@/components/texts/TextUploadForm').then(mod => ({ default: mod.TextUploadForm })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
});

const TextListAdmin = dynamic(() => import('@/components/texts/TextListAdmin').then(mod => ({ default: mod.TextListAdmin })), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
  ssr: false,
});

const CategoryManager = dynamic(() => import('@/components/texts/CategoryManager').then(mod => ({ default: mod.CategoryManager })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
});

const TagManager = dynamic(() => import('@/components/texts/TagManager').then(mod => ({ default: mod.TagManager })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
});

export default function AdminTextsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [texts, setTexts] = useState<TextWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTexts();
    }
  }, [user]);

  const fetchTexts = async () => {
    setLoading(true);
    try {
      const { texts: data, error } = await textService.getTextsWithMetadata();

      if (error) throw error;

      setTexts(data || []);
    } catch (error) {
      console.error('Error fetching texts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Administration des Textes</h1>
          <p className="text-muted-foreground">Gérez vos écrits, catégories et tags</p>
        </div>
        <RefreshButton
          onRefresh={fetchTexts}
          cachePattern="texts:"
          label="Rafraîchir"
        />
      </div>

      <Tabs defaultValue="texts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="texts" className="gap-2">
            <Upload className="h-4 w-4" />
            Textes
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderTree className="h-4 w-4" />
            Catégories
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2">
            <Tags className="h-4 w-4" />
            Tags
          </TabsTrigger>
        </TabsList>

        {/* Texts Tab */}
        <TabsContent value="texts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                <CardTitle>Ajouter un texte</CardTitle>
              </div>
              <CardDescription>
                Rédigez et publiez un nouveau texte en Markdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TextUploadForm onSuccess={fetchTexts} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>Gérer les textes</CardTitle>
              </div>
              <CardDescription>
                Réorganisez et modifiez vos textes. Glissez-déposez pour changer l&apos;ordre.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  </div>
                </div>
              ) : (
                <TextListAdmin texts={texts} onUpdate={fetchTexts} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags">
          <TagManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
