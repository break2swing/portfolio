/**
 * lib/formatNumber.ts
 * Utilitaire pour formater les nombres (ex: 1.2k, 1M)
 */

/**
 * Formate un nombre avec des suffixes k, M, etc.
 * @param num - Le nombre à formater
 * @returns Le nombre formaté (ex: "1.2k", "45", "1M")
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  
  if (num < 1000) {
    return num.toString();
  }
  
  if (num < 1000000) {
    const thousands = num / 1000;
    // Si c'est un nombre rond (ex: 2000), afficher "2k" au lieu de "2.0k"
    if (thousands % 1 === 0) {
      return `${thousands}k`;
    }
    // Sinon, afficher avec une décimale (ex: "1.2k")
    return `${thousands.toFixed(1)}k`;
  }
  
  const millions = num / 1000000;
  if (millions % 1 === 0) {
    return `${millions}M`;
  }
  return `${millions.toFixed(1)}M`;
}

