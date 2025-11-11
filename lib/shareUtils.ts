/**
 * Utilities for social sharing functionality
 */

export type ShareContentType = 'photo' | 'text' | 'music' | 'video';

/**
 * Generate share URL with UTM parameters for analytics
 */
export function generateShareUrl(
  url: string,
  type: ShareContentType,
  source: 'twitter' | 'facebook' | 'linkedin' | 'email' | 'copy' | 'whatsapp' | 'telegram' | 'reddit' | 'pinterest'
): string {
  const urlObj = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://example.com');
  
  urlObj.searchParams.set('utm_source', source);
  urlObj.searchParams.set('utm_medium', source === 'copy' ? 'copy' : 'social');
  urlObj.searchParams.set('utm_campaign', type);

  return urlObj.toString();
}

/**
 * Generate Twitter share URL
 */
export function getTwitterShareUrl(url: string, text: string, title: string, type: ShareContentType): string {
  const shareUrl = generateShareUrl(url, type, 'twitter');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${title} - ${text}`);
  
  return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
}

/**
 * Generate Facebook share URL
 */
export function getFacebookShareUrl(url: string, type: ShareContentType): string {
  const shareUrl = generateShareUrl(url, type, 'facebook');
  const encodedUrl = encodeURIComponent(shareUrl);
  
  return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
}

/**
 * Generate LinkedIn share URL
 */
export function getLinkedInShareUrl(url: string, title: string, type: ShareContentType, summary?: string): string {
  const shareUrl = generateShareUrl(url, type, 'linkedin');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedSummary = summary ? encodeURIComponent(summary) : '';
  
  let linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`;
  if (encodedSummary) {
    linkedInUrl += `&summary=${encodedSummary}`;
  }
  
  return linkedInUrl;
}

/**
 * Generate Email share URL (mailto:)
 */
export function getEmailShareUrl(url: string, subject: string, body: string, type: ShareContentType): string {
  const shareUrl = generateShareUrl(url, type, 'email');
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(`${body}\n\n${shareUrl}`);
  
  return `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Copy text to clipboard with error handling
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Generate WhatsApp share URL
 */
export function getWhatsAppShareUrl(url: string, text: string, type: ShareContentType): string {
  const shareUrl = generateShareUrl(url, type, 'whatsapp');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(text);
  
  return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
}

/**
 * Generate Telegram share URL
 */
export function getTelegramShareUrl(url: string, text: string, type: ShareContentType): string {
  const shareUrl = generateShareUrl(url, type, 'telegram');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(text);
  
  return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
}

/**
 * Generate Reddit share URL
 */
export function getRedditShareUrl(url: string, title: string, type: ShareContentType): string {
  const shareUrl = generateShareUrl(url, type, 'reddit');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  
  return `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
}

/**
 * Generate Pinterest share URL
 */
export function getPinterestShareUrl(url: string, description: string, type: ShareContentType, imageUrl?: string): string {
  const shareUrl = generateShareUrl(url, type, 'pinterest');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedDescription = encodeURIComponent(description);
  
  let pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedDescription}`;
  if (imageUrl) {
    const encodedImageUrl = encodeURIComponent(imageUrl);
    pinterestUrl += `&media=${encodedImageUrl}`;
  }
  
  return pinterestUrl;
}

/**
 * Check if Web Share API is available
 */
export function canUseWebShare(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof navigator !== 'undefined' && 
         'share' in navigator && 
         typeof navigator.share === 'function';
}

