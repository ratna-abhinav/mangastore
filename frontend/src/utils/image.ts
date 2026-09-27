/**
 * Covers live in Neon Object Storage; anything that 404s (or a product with no
 * cover yet) falls back to the bucket placeholder so cards never render as
 * empty boxes.
 */
const FALLBACK_IMAGE =
  'https://br-wispy-block-a5yj4c8a.storage.c-1.us-east-2.aws.neon.tech/media-storage/defaults/default-image.png';

/**
 * Builds an `onError` handler that swaps in the placeholder exactly once, so a
 * failing URL can never trigger an infinite retry loop.
 */
export function imageFallback() {
  return (e: { currentTarget: HTMLImageElement }) => {
    const img = e.currentTarget;
    img.onerror = null;
    if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
  };
}
