'use client';

/**
 * Composant SkipToContent - Amélioration de l'accessibilité
 *
 * Ce composant permet aux utilisateurs de lecteurs d'écran et de navigation clavier
 * de sauter directement au contenu principal sans avoir à parcourir toute la navigation.
 *
 * Le lien est invisible par défaut et apparaît uniquement lors du focus (Tab).
 * Conforme aux WCAG 2.1 AA.
 */
export function SkipToContent() {
  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkip}
      className="
        sr-only
        focus:not-sr-only
        focus:absolute
        focus:z-50
        focus:top-4
        focus:left-4
        focus:px-4
        focus:py-2
        focus:bg-primary
        focus:text-primary-foreground
        focus:rounded-md
        focus:shadow-lg
        focus:outline-none
        focus:ring-2
        focus:ring-ring
        focus:ring-offset-2
        focus:font-medium
        focus:transition-all
      "
    >
      Aller au contenu principal
    </a>
  );
}
