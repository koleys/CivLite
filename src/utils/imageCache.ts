/**
 * Lightweight browser image cache used by canvas renderers.
 * Images are loaded once and reused across render frames.
 */
const cache = new Map<string, HTMLImageElement>();

export function preloadImages(srcs: string[], onAllLoaded?: () => void): void {
  const pending = srcs.filter(s => !cache.has(s));
  if (pending.length === 0) { onAllLoaded?.(); return; }
  let remaining = pending.length;
  pending.forEach(src => {
    const img = new Image();
    img.onload  = () => { cache.set(src, img); if (--remaining === 0) onAllLoaded?.(); };
    img.onerror = () => {                       if (--remaining === 0) onAllLoaded?.(); };
    img.src = src;
  });
}

export function getImg(src: string): HTMLImageElement | null {
  return cache.get(src) ?? null;
}
