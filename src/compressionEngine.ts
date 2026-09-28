import { CompressionResult } from './types';

/**
 * Runs the exact same target-size binary search compression algorithm
 * used in Kotlin's ImageCompressor.kt directly in browser canvas.
 */
export async function simulateTargetCompression(
  file: File,
  targetSizeKB: number,
  outputFormat: 'jpeg' | 'png' | 'webp',
  onProgress?: (percent: number) => void
): Promise<CompressionResult> {
  const startTime = performance.now();
  onProgress?.(10);

  const originalUrl = URL.createObjectURL(file);
  const img = new Image();

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = originalUrl;
  });

  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;
  const originalSize = file.size;
  const targetBytes = targetSizeKB * 1024;

  let currentWidth = originalWidth;
  let currentHeight = originalHeight;
  let bestBlob: Blob | null = null;
  let bestQuality = 80;
  let iterations = 0;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const mimeType = outputFormat === 'png' ? 'image/png' : outputFormat === 'webp' ? 'image/webp' : 'image/jpeg';

  const getBlob = (w: number, h: number, q: number): Promise<Blob> => {
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return new Promise<Blob>((res) => {
      canvas.toBlob((blob) => res(blob || new Blob()), mimeType, q / 100);
    });
  };

  onProgress?.(25);

  // Dimension scaling loop
  for (let step = 0; step < 8; step++) {
    iterations++;

    if (outputFormat === 'png') {
      const blob = await getBlob(currentWidth, currentHeight, 100);
      if (blob.size <= targetBytes || currentWidth < 100 || currentHeight < 100) {
        bestBlob = blob;
        bestQuality = 100;
        break;
      }
    } else {
      // Binary search on quality (1..100)
      let low = 1;
      let high = 100;
      let pass = 0;

      while (low <= high && pass < 10) {
        pass++;
        const mid = Math.floor((low + high) / 2);
        const candidateBlob = await getBlob(currentWidth, currentHeight, mid);
        const progress = Math.min(85, 25 + step * 8 + pass * 2);
        onProgress?.(progress);

        if (candidateBlob.size > targetBytes) {
          high = mid - 1;
        } else {
          bestBlob = candidateBlob;
          bestQuality = mid;
          low = mid + 1; // Try better quality under limit
        }
      }

      if (bestBlob) break;
    }

    // Downscale dimensions by 0.8x
    currentWidth = Math.round(currentWidth * 0.8);
    currentHeight = Math.round(currentHeight * 0.8);
    if (currentWidth < 80 || currentHeight < 80) {
      bestBlob = await getBlob(currentWidth, currentHeight, 15);
      bestQuality = 15;
      break;
    }
  }

  const finalBlob = bestBlob || (await getBlob(currentWidth, currentHeight, 20));
  const compressedUrl = URL.createObjectURL(finalBlob);

  onProgress?.(100);

  return {
    originalName: file.name,
    originalSize,
    originalWidth,
    originalHeight,
    originalUrl,
    compressedSize: finalBlob.size,
    compressedWidth: currentWidth,
    compressedHeight: currentHeight,
    compressedUrl,
    format: outputFormat,
    quality: bestQuality,
    iterations,
    processingTimeMs: Math.round(performance.now() - startTime),
  };
}

export async function simulateQualityCompression(
  file: File,
  qualityPercent: number,
  outputFormat: 'jpeg' | 'png' | 'webp'
): Promise<CompressionResult> {
  const startTime = performance.now();
  const originalUrl = URL.createObjectURL(file);
  const img = new Image();

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = originalUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(img, 0, 0);

  const mimeType = outputFormat === 'png' ? 'image/png' : outputFormat === 'webp' ? 'image/webp' : 'image/jpeg';
  const blob = await new Promise<Blob>((res) => {
    canvas.toBlob((b) => res(b || new Blob()), mimeType, qualityPercent / 100);
  });

  return {
    originalName: file.name,
    originalSize: file.size,
    originalWidth: img.naturalWidth,
    originalHeight: img.naturalHeight,
    originalUrl,
    compressedSize: blob.size,
    compressedWidth: img.naturalWidth,
    compressedHeight: img.naturalHeight,
    compressedUrl: URL.createObjectURL(blob),
    format: outputFormat,
    quality: qualityPercent,
    iterations: 1,
    processingTimeMs: Math.round(performance.now() - startTime),
  };
}
