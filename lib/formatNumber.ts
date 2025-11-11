/**
 * lib/formatNumber.ts
 * Utilitaire pour formater les nombres (ex: 1.2k, 1M)
 */

/**
 * Formate un nombre pour l'afficher de manière compacte (ex: 1200 -> 1.2k, 1200000 -> 1.2M)
 * @param num - Le nombre à formater
 * @returns Le nombre formaté (ex: "1.2k", "45", "1M")
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}
