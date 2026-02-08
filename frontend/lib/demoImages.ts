/**
 * Demo Image Mode – deterministic local images for concert cards.
 * Use when NEXT_PUBLIC_DEMO_IMAGES=true for crisp, consistent card art.
 */

const DEMO_IMAGE_COUNT = 12;
const DEMO_BASE = '/demo/artists';

/** Hash a string to a non-negative integer (djb2-style). */
function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h = (h << 5) - h + c;
    h = h >>> 0;
  }
  return h;
}

/**
 * Deterministically map artistName -> one of N local demo images.
 * Same artist always gets the same image. Returns path like `/demo/artists/07.jpg`.
 */
export function getDemoImageForArtist(artistName: string): string {
  const str = (artistName || '').trim() || 'default';
  const index = (hashString(str) % DEMO_IMAGE_COUNT) + 1;
  const padded = String(index).padStart(2, '0');
  return `${DEMO_BASE}/${padded}.jpg`;
}

/**
 * Map by concert id (and artist) so each card gets a different image.
 * Use this in the UI so every concert card shows a different demo image.
 */
export function getDemoImageForConcert(concertId: string, artistName: string): string {
  const seed = `${concertId}|${(artistName || '').trim() || 'default'}`;
  const index = (hashString(seed) % DEMO_IMAGE_COUNT) + 1;
  const padded = String(index).padStart(2, '0');
  return `${DEMO_BASE}/${padded}.jpg`;
}

/** Whether demo image mode is enabled (NEXT_PUBLIC_DEMO_IMAGES=true). */
export function isDemoImageMode(): boolean {
  if (typeof process === 'undefined' || !process.env) return false;
  const v = process.env.NEXT_PUBLIC_DEMO_IMAGES;
  return v === 'true' || v === '1' || v === 'yes';
}

/** Heuristic: true if URL looks like a low-res thumbnail (e.g. SerpAPI/Google). */
export function isLowQualityImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return true;
  const u = url.toLowerCase();
  return u.includes('encrypted-tbn') || u.includes('gstatic.com/images') || u.includes('tbn.');
}
