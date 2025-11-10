/**
 * Page admin pour exécuter la migration LQIP
 * 
 * Cette page permet d'exécuter le script de génération de LQIP
 * pour les images existantes directement depuis l'interface admin.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Image as ImageIcon } from 'lucide-react';
import { photoService } from '@/services/photoService';
import { generateLQIP } from '@/lib/imageUtils';

async function generateLQIPForExistingPhotos() {
  console.log('[MIGRATION] Début de la génération des LQIP pour les photos existantes...');

  try {
    // Récupérer toutes les photos
    const { photos, error: fetchError } = await photoService.getAllPhotos();

    if (fetchError || !photos) {
      throw new Error(`Erreur lors de la récupération des photos: ${fetchError?.message}`);
    }

    const photosWithoutLQIP = photos.filter(photo => !photo.blur_data_url);

    console.log(`[MIGRATION] ${photosWithoutLQIP.length} photos sans LQIP trouvées sur ${photos.length} total`);

    if (photosWithoutLQIP.length === 0) {
      console.log('[MIGRATION] Toutes les photos ont déjà un LQIP. Migration terminée.');
      return { success: true, processed: 0, errors: 0 };
    }

    let processed = 0;
    let errors = 0;

    // Traiter les photos par batch pour éviter la surcharge
    const BATCH_SIZE = 5;
    for (let i = 0; i < photosWithoutLQIP.length; i += BATCH_SIZE) {
      const batch = photosWithoutLQIP.slice(i, i + BATCH_SIZE);
      
      console.log(`[MIGRATION] Traitement du batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(photosWithoutLQIP.length / BATCH_SIZE)}`);

      await Promise.all(
        batch.map(async (photo) => {
          try {
            console.log(`[MIGRATION] Génération LQIP pour: ${photo.title} (${photo.id})`);

            // Générer le LQIP depuis l'URL de l'image
            const blurDataUrl = await generateLQIP(photo.image_url, 20, 20);

            if (!blurDataUrl) {
              throw new Error('Échec de la génération du LQIP');
            }

            // Mettre à jour la photo avec le LQIP
            const { error: updateError } = await photoService.updatePhoto(photo.id, {
              blur_data_url: blurDataUrl,
            });

            if (updateError) {
              throw updateError;
            }

            processed++;
            console.log(`[MIGRATION] ✓ LQIP généré et sauvegardé pour: ${photo.title}`);
          } catch (error) {
            errors++;
            console.error(`[MIGRATION] ✗ Erreur pour ${photo.title}:`, error);
          }
        })
      );

      // Pause entre les batches pour éviter la surcharge
      if (i + BATCH_SIZE < photosWithoutLQIP.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[MIGRATION] Migration terminée. ${processed} photos traitées, ${errors} erreurs.`);

    return { success: true, processed, errors };
  } catch (error) {
    console.error('[MIGRATION] Erreur fatale:', error);
    return { success: false, processed: 0, errors: 0, error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
}

export default function MigrateLQIPPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    processed: number;
    errors: number;
    error?: string;
  } | null>(null);

  const handleRunMigration = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const migrationResult = await generateLQIPForExistingPhotos();
      setResult(migrationResult);
    } catch (error) {
      setResult({
        success: false,
        processed: 0,
        errors: 0,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Migration LQIP pour les photos existantes
          </CardTitle>
          <CardDescription>
            Génère automatiquement des placeholders flous (LQIP) pour toutes les photos
            qui n'en ont pas encore. Cette opération peut prendre quelques minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {result.success ? (
                    <>
                      Migration terminée avec succès. {result.processed} photo(s) traitée(s).
                      {result.errors > 0 && ` ${result.errors} erreur(s) rencontrée(s).`}
                    </>
                  ) : (
                    <>
                      Erreur lors de la migration: {result.error}
                    </>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Ce script va :
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Récupérer toutes les photos sans LQIP</li>
              <li>Générer un placeholder flou pour chaque photo</li>
              <li>Mettre à jour la base de données avec les LQIP générés</li>
            </ul>
          </div>

          <Button
            onClick={handleRunMigration}
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migration en cours...
              </>
            ) : (
              'Démarrer la migration'
            )}
          </Button>

          {isRunning && (
            <p className="text-sm text-muted-foreground text-center">
              Veuillez patienter, cette opération peut prendre plusieurs minutes...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

