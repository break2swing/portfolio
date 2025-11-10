'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  srcset?: string;
  priority?: boolean;
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/**
 * OptimizedImage - Composant d'image optimisé pour les performances
 *
 * Fonctionnalités :
 * - Lazy loading natif avec Intersection Observer comme fallback
 * - Support responsive avec sizes et srcset (si nécessaire)
 * - Placeholder pendant le chargement avec effet de blur
 * - Gestion des erreurs avec image de fallback
 * - Compatible avec l'export statique Next.js
 *
 * @param src - URL de l'image
 * @param alt - Texte alternatif (obligatoire pour l'accessibilité)
 * @param className - Classes CSS additionnelles
 * @param width - Largeur intrinsèque de l'image
 * @param height - Hauteur intrinsèque de l'image
 * @param sizes - Attribut sizes pour le responsive
 * @param srcset - Attribut srcset pour les images responsives (ex: "image-320.jpg 320w, image-640.jpg 640w")
 * @param priority - Si true, désactive le lazy loading (pour images above-the-fold)
 * @param blurDataURL - Data URL du placeholder flou (LQIP) optionnel
 * @param onLoad - Callback appelé quand l'image est chargée
 * @param onError - Callback appelé en cas d'erreur de chargement
 * @param objectFit - Style object-fit CSS
 */
export function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  sizes,
  srcset,
  priority = false,
  blurDataURL,
  onLoad,
  onError,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Si priority est true, on charge immédiatement
    if (priority) {
      setIsInView(true);
      return;
    }

    // Sinon, on utilise l'Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Commence à charger 50px avant que l'image soit visible
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Image de fallback en cas d'erreur
  const fallbackSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%23999"%3EImage indisponible%3C/text%3E%3C/svg%3E';

  return (
    <div
      className={cn('relative overflow-hidden bg-muted', className)}
      style={{
        aspectRatio: width && height ? `${width} / ${height}` : undefined,
      }}
    >
      {/* Placeholder flou (LQIP) si fourni */}
      {!isLoaded && !hasError && blurDataURL && (
        <img
          src={blurDataURL}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-sm"
        />
      )}

      {/* Placeholder animé (fallback) */}
      {!isLoaded && !hasError && !blurDataURL && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Image principale */}
      <img
        ref={imgRef}
        src={isInView ? (hasError ? fallbackSrc : src) : undefined}
        srcSet={isInView && !hasError ? srcset : undefined}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'fill' && 'object-fill',
          objectFit === 'none' && 'object-none',
          objectFit === 'scale-down' && 'object-scale-down'
        )}
        style={{
          objectFit,
        }}
      />
    </div>
  );
}
