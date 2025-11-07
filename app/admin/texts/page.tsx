'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Text } from '@/lib/supabaseClient';
import { textService } from '@/services/textService';
import { TextUploadForm } from '@/components/texts/TextUploadForm';
import { TextListAdmin } from '@/components/texts/TextListAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, Settings } from 'lucide-react';

export default function AdminTextsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [texts, setTexts] = useState<Text[]>([]);
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
      const { texts: data, error } = await textService.getAllTexts();

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
      <div>
        <h1 className="text-3xl font-bold mb-2">Administration des Textes</h1>
        <p className="text-muted-foreground">
          Gérez vos écrits et articles
        </p>
      </div>

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
            Réorganisez et supprimez vos textes. Glissez-déposez pour changer l&apos;ordre.
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
    </div>
  );
}
