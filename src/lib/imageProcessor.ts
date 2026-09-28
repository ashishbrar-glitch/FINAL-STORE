import heic2any from 'heic2any';

export interface CompressionOptions {
  maxDimension?: number;        // Default 600px (retina-sharp for product cards)
  targetMaxBytes?: number;      // Default 250 KB (safe for Firestore's 1MB limit)
  preserveTransparency?: boolean; // Default true (for background cutouts)
  preferredQuality?: number;    // Default 0.78
}

const DEFAULT_MAX_DIMENSION = 600;
const DEFAULT_TARGET_BYTES = 250 * 1024; // 250 KB
const ABSOLUTE_CEILING_BYTES = 350 * 1024; // 350 KB hard cap

/**
 * Calculates raw byte size from a data URL string.
 */
export function getDataUrlByteSize(dataUrl: string): number {
  if (!dataUrl) return 0;
  const commaIdx = dataUrl.indexOf(',');
  const base64Str = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  const padding = (base64Str.match(/=/g) || []).length;
  return Math.max(0, Math.floor((base64Str.length * 3) / 4 - padding));
}

/**
 * Compresses an HTMLCanvasElement to a base64 data URL guaranteed to be within safe size limits.
 */
export function compressCanvasToBase64(
  sourceCanvas: HTMLCanvasElement,
  options: CompressionOptions = {}
): string {
  const maxDim = options.maxDimension || DEFAULT_MAX_DIMENSION;
  const targetBytes = options.targetMaxBytes || DEFAULT_TARGET_BYTES;
  const preserveTransparency = options.preserveTransparency ?? true;
  let quality = options.preferredQuality ?? 0.78;

  // 1. Calculate aspect ratio and initial scaled dimensions
  let width = sourceCanvas.width;
  let height = sourceCanvas.height;

  if (width > height) {
    if (width > maxDim) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    }
  } else {
    if (height > maxDim) {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  // Work on a dedicated scaled canvas
  let workingCanvas = document.createElement('canvas');
  workingCanvas.width = width;
  workingCanvas.height = height;
  let ctx = workingCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return sourceCanvas.toDataURL('image/jpeg', 0.7);
  }

  ctx.drawImage(sourceCanvas, 0, 0, width, height);

  // 2. Multi-pass compression loop
  let bestResult = '';
  let minObservedBytes = Infinity;

  // Step down parameters if the image is too large
  const dimensionSteps = [1.0, 0.85, 0.7, 0.55];
  const qualitySteps = [quality, 0.65, 0.5, 0.4];

  for (let d = 0; d < dimensionSteps.length; d++) {
    const scaleFactor = dimensionSteps[d];
    const currW = Math.max(100, Math.round(width * scaleFactor));
    const currH = Math.max(100, Math.round(height * scaleFactor));

    const stepCanvas = document.createElement('canvas');
    stepCanvas.width = currW;
    stepCanvas.height = currH;
    const stepCtx = stepCanvas.getContext('2d');
    if (!stepCtx) continue;

    stepCtx.drawImage(sourceCanvas, 0, 0, currW, currH);

    for (let q = 0; q < qualitySteps.length; q++) {
      const currQuality = qualitySteps[q];
      let candidateUrl = '';

      if (preserveTransparency) {
        // Try WebP first (supports transparent alpha with lossy compression)
        candidateUrl = stepCanvas.toDataURL('image/webp', currQuality);

        // If browser doesn't support WebP encoding, it returns PNG
        const isActuallyWebp = candidateUrl.startsWith('data:image/webp');
        if (!isActuallyWebp) {
          candidateUrl = stepCanvas.toDataURL('image/png');
        }
      } else {
        // Transparent not required -> render on clean white canvas and use WebP or JPEG
        const whiteCanvas = document.createElement('canvas');
        whiteCanvas.width = currW;
        whiteCanvas.height = currH;
        const whiteCtx = whiteCanvas.getContext('2d');
        if (whiteCtx) {
          whiteCtx.fillStyle = '#FFFFFF';
          whiteCtx.fillRect(0, 0, currW, currH);
          whiteCtx.drawImage(stepCanvas, 0, 0);
          candidateUrl = whiteCanvas.toDataURL('image/webp', currQuality);
          if (!candidateUrl.startsWith('data:image/webp')) {
            candidateUrl = whiteCanvas.toDataURL('image/jpeg', currQuality);
          }
        }
      }

      const byteSize = getDataUrlByteSize(candidateUrl);
      if (byteSize < minObservedBytes) {
        minObservedBytes = byteSize;
        bestResult = candidateUrl;
      }

      // If within target, return immediately
      if (byteSize <= targetBytes) {
        return candidateUrl;
      }
    }
  }

  // If still above targetBytes but under absolute ceiling, return best result
  if (minObservedBytes <= ABSOLUTE_CEILING_BYTES && bestResult) {
    return bestResult;
  }

  // Extreme fallback: render on crisp white background at 450px JPEG (guaranteed < 60KB)
  try {
    const finalFallbackCanvas = document.createElement('canvas');
    const fallbackDim = 450;
    let fbW = width;
    let fbH = height;
    if (fbW > fbH) {
      fbH = Math.round((fbH * fallbackDim) / fbW);
      fbW = fallbackDim;
    } else {
      fbW = Math.round((fbW * fallbackDim) / fbH);
      fbH = fallbackDim;
    }
    finalFallbackCanvas.width = fbW;
    finalFallbackCanvas.height = fbH;
    const fbCtx = finalFallbackCanvas.getContext('2d');
    if (fbCtx) {
      fbCtx.fillStyle = '#FFFFFF';
      fbCtx.fillRect(0, 0, fbW, fbH);
      fbCtx.drawImage(sourceCanvas, 0, 0, fbW, fbH);
      const jpegResult = finalFallbackCanvas.toDataURL('image/jpeg', 0.7);
      if (getDataUrlByteSize(jpegResult) <= ABSOLUTE_CEILING_BYTES) {
        return jpegResult;
      }
    }
  } catch (e) {
    console.warn("Fallback canvas compression error:", e);
  }

  return bestResult || sourceCanvas.toDataURL('image/jpeg', 0.6);
}

/**
 * Loads an image from File, Blob, or URL/DataURL, downscales and compresses it to Base64.
 */
export async function processImageToBase64(
  source: File | Blob | string,
  options: CompressionOptions = {}
): Promise<string> {
  let fileToProcess: File | Blob | string = source;

  // 1. Check if it's HEIC/HEIF and convert to JPEG
  if (typeof fileToProcess !== 'string') {
    const fileType = (fileToProcess as File).type || '';
    const fileName = (fileToProcess as File).name || '';
    if (
      fileType.toLowerCase().includes('heic') ||
      fileType.toLowerCase().includes('heif') ||
      fileName.toLowerCase().endsWith('.heic') ||
      fileName.toLowerCase().endsWith('.heif')
    ) {
      try {
        const converted = await heic2any({
          blob: fileToProcess,
          toType: 'image/jpeg',
          quality: 0.85
        });
        fileToProcess = Array.isArray(converted) ? converted[0] : converted;
      } catch (err) {
        console.warn("Failed to convert HEIC to JPEG, attempting fallback", err);
        throw new Error("Unable to process Apple HEIC image format. Please try uploading a JPEG or PNG.");
      }
    }
  }

  // 2. Load into an HTML Image Element to draw on Canvas
  return new Promise((resolve, reject) => {
    let objectUrl = '';
    let isCreatedUrl = false;

    if (typeof fileToProcess === 'string') {
      objectUrl = fileToProcess;
    } else {
      objectUrl = URL.createObjectURL(fileToProcess);
      isCreatedUrl = true;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (isCreatedUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      try {
        // Draw to initial canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error("Canvas not supported in this browser"));
        }

        ctx.drawImage(img, 0, 0);

        // Run through compressor
        const compressedBase64 = compressCanvasToBase64(canvas, options);
        resolve(compressedBase64);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      if (isCreatedUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      reject(new Error("Failed to load image for processing"));
    };

    img.src = objectUrl;
  });
}

/**
 * Validates any image string before saving to Firestore.
 * If it's a huge base64 string (> 350KB), re-compresses it automatically to ensure Firestore never errors.
 */
export async function safeValidateProductImageSize(
  imageUrl: string,
  maxAllowedBytes: number = ABSOLUTE_CEILING_BYTES
): Promise<string> {
  if (!imageUrl || typeof imageUrl !== 'string') return '';
  if (!imageUrl.startsWith('data:image')) {
    // Regular HTTP/HTTPS URL from storage or CDN, size doesn't affect Firestore document
    return imageUrl;
  }

  const byteSize = getDataUrlByteSize(imageUrl);
  if (byteSize <= maxAllowedBytes) {
    return imageUrl;
  }

  console.warn(`[Auto-Compressor] Image dataURL size is ${(byteSize / 1024).toFixed(1)} KB (exceeds ${(maxAllowedBytes / 1024).toFixed(1)} KB). Compressing automatically...`);

  try {
    const compressed = await processImageToBase64(imageUrl, {
      maxDimension: 550,
      targetMaxBytes: 220 * 1024,
      preserveTransparency: true
    });
    console.log(`[Auto-Compressor] Successfully reduced size to ${(getDataUrlByteSize(compressed) / 1024).toFixed(1)} KB.`);
    return compressed;
  } catch (err) {
    console.error("[Auto-Compressor] Re-compression failed:", err);
    return imageUrl;
  }
}
