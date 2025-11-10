/**
 * Script de migration pour générer des LQIP pour les images déjà uploadées
 * 
 * Ce script doit être exécuté dans le navigateur car il utilise Canvas API.
 * Pour l'exécuter :
 * 1. Ouvrir la console du navigateur sur la page admin/photos
 * 2. Copier-coller le contenu de ce script
 * 3. Ou créer une page admin dédiée pour exécuter ce script
 * 
 * Alternative : Utiliser un script Node.js avec la bibliothèque 'canvas' (npm install canvas)
 */

import { supabaseClient } from '../lib/supabaseClient';
import { generateLQIP } from '../lib/imageUtils';
import { photoService } from '../services/photoService';

/**
 * Génère des LQIP pour toutes les photos sans blur_data_url
 */
export async function generateLQIPForExistingPhotos() {
  console.log('[MIGRATION] Début de la génération des LQIP pour les photos existantes...');

  try {
    // Récupérer toutes les photos sans blur_data_url
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

/**
 * Script exécutable si importé directement
 * Pour Node.js avec ts-node ou tsx
 */
if (require.main === module) {
  console.log('[MIGRATION] Ce script doit être exécuté dans le navigateur car il utilise Canvas API.');
  console.log('[MIGRATION] Utilisez plutôt la fonction generateLQIPForExistingPhotos() dans une page admin.');
}

