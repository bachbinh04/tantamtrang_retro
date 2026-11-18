/**
 * Generates one small grayscale noise tile at startup and exposes it as the
 * CSS variable --noise-url. Every noise/static/grain layer reuses this single
 * texture and just shifts it with a stepped transform animation — no canvas loop.
 */
export function installNoiseTexture(size = 128) {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() < 0.5 ? Math.random() * 90 : 90 + Math.random() * 165;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  document.documentElement.style.setProperty('--noise-url', `url(${canvas.toDataURL('image/png')})`);
}

export function CRTNoise() {
  return <div className="crt-layer crt-noise" aria-hidden />;
}
