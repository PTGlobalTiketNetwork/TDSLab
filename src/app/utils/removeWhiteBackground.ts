// Client-side only (no AI/Replicate call, no token cost): makes near-white pixels transparent.
// Good enough for flat white logo/product backgrounds; not a real subject cutout like the AI remove-bg tool.
export function removeWhiteBackground(src: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const threshold = 235; // pixels with every channel at/above this are candidates for removal
      const softRange = 25; // values between (255 - softRange) and 255 fade out instead of hard-cutting, so edges stay soft
      for (let i = 0; i < data.length; i += 4) {
        const minChannel = Math.min(data[i], data[i + 1], data[i + 2]);
        if (minChannel >= threshold) {
          data[i + 3] = Math.round(data[i + 3] * Math.max(0, Math.min(1, (255 - minChannel) / softRange)));
        }
      }
      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Failed to export image'))), 'image/png');
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}
