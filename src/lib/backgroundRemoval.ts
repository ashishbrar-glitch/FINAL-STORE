import { pipeline, env } from '@huggingface/transformers';
import heic2any from 'heic2any';

// Configure ONNX WebAssembly environment safely
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

// Global singleton pipeline instance so ONNX runtime is created once and reused
let sharedSegmenterPromise: Promise<any> | null = null;

export async function getSharedSegmenter(
  onProgress?: (info: { status: string; progress?: number }) => void
): Promise<any> {
  if (!sharedSegmenterPromise) {
    sharedSegmenterPromise = pipeline('image-segmentation', 'Xenova/modnet', {
      progress_callback: (info: any) => {
        if (onProgress) onProgress(info);
      }
    }).catch(err => {
      // Reset so a user can retry if network dropped
      sharedSegmenterPromise = null;
      throw err;
    });
  }
  return sharedSegmenterPromise;
}

/**
 * Pre-processes an image file (converting HEIC if needed, downscaling to max 512px for inference)
 * to prevent browser tab out-of-memory crashes on high-res camera photos.
 */
async function prepareInferenceImage(
  file: File | Blob,
  maxDimension: number = 512
): Promise<{ inferenceDataUrl: string; sourceImg: HTMLImageElement }> {
  let fileToProcess = file;
  const fileType = file.type || '';
  const fileName = (file as File).name || '';

  // 1. Convert Apple HEIC/HEIF if needed
  if (
    fileType.toLowerCase().includes('heic') ||
    fileType.toLowerCase().includes('heif') ||
    fileName.toLowerCase().endsWith('.heic') ||
    fileName.toLowerCase().endsWith('.heif')
  ) {
    try {
      const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
      fileToProcess = Array.isArray(converted) ? (converted[0] as File) : (converted as File);
    } catch {
      throw new Error("Unable to convert Apple HEIC image. Please upload a JPEG or PNG.");
    }
  }

  // 2. Load into Image object
  const objectUrl = URL.createObjectURL(fileToProcess);
  const sourceImg = new Image();
  await new Promise<void>((resolve, reject) => {
    sourceImg.onload = () => resolve();
    sourceImg.onerror = () => reject(new Error("Unable to decode image file."));
    sourceImg.src = objectUrl;
  });
  URL.revokeObjectURL(objectUrl);

  // 3. Pre-downscale to maxDimension for ONNX inference
  let width = sourceImg.width;
  let height = sourceImg.height;

  if (width > height) {
    if (width > maxDimension) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    }
  } else {
    if (height > maxDimension) {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const smallCanvas = document.createElement('canvas');
  smallCanvas.width = width;
  smallCanvas.height = height;
  const ctx = smallCanvas.getContext('2d');
  if (!ctx) {
    throw new Error("Canvas context is not available.");
  }
  ctx.drawImage(sourceImg, 0, 0, width, height);

  const inferenceDataUrl = smallCanvas.toDataURL('image/jpeg', 0.85);
  return { inferenceDataUrl, sourceImg };
}

/**
 * Runs memory-safe background removal on an image file.
 * Returns a transparent canvas with the isolated subject.
 */
export async function removeBackgroundSafe(
  file: File | Blob,
  onStatus?: (status: string) => void,
  checkCancelled?: () => boolean
): Promise<HTMLCanvasElement> {
  onStatus?.("Preparing image...");

  const { inferenceDataUrl, sourceImg } = await prepareInferenceImage(file, 512);

  if (checkCancelled && checkCancelled()) {
    throw new Error("Operation cancelled");
  }

  onStatus?.("Initializing AI Model...");
  const segmenter = await getSharedSegmenter((info) => {
    if (info.status === 'downloading') {
      onStatus?.(`Downloading AI: ${Math.round(info.progress || 0)}%`);
    } else if (info.status === 'ready') {
      onStatus?.("Analyzing pixels...");
    }
  });

  if (checkCancelled && checkCancelled()) {
    throw new Error("Operation cancelled");
  }

  onStatus?.("Extracting product...");
  const result = await segmenter(inferenceDataUrl);

  if (checkCancelled && checkCancelled()) {
    throw new Error("Operation cancelled");
  }

  // Extract raw mask
  let rawMask: any = Array.isArray(result) ? result[0].mask || result[0] : result;

  let maskCanvas: HTMLCanvasElement;
  if (rawMask.toCanvas) {
    maskCanvas = rawMask.toCanvas();
  } else {
    maskCanvas = document.createElement('canvas');
    maskCanvas.width = rawMask.width;
    maskCanvas.height = rawMask.height;
    const maskCtx = maskCanvas.getContext('2d')!;
    const imgData = maskCtx.createImageData(rawMask.width, rawMask.height);
    for (let i = 0; i < rawMask.data.length; i++) {
      const val = rawMask.channels === 1 ? rawMask.data[i] : rawMask.data[i * 4];
      imgData.data[i * 4] = val;
      imgData.data[i * 4 + 1] = val;
      imgData.data[i * 4 + 2] = val;
      imgData.data[i * 4 + 3] = 255;
    }
    maskCtx.putImageData(imgData, 0, 0);
  }

  // Create final output canvas capped at 600px for optimal memory and sharpness
  const MAX_TARGET = 600;
  let outW = sourceImg.width;
  let outH = sourceImg.height;

  if (outW > outH) {
    if (outW > MAX_TARGET) {
      outH = Math.round((outH * MAX_TARGET) / outW);
      outW = MAX_TARGET;
    }
  } else {
    if (outH > MAX_TARGET) {
      outW = Math.round((outW * MAX_TARGET) / outH);
      outH = MAX_TARGET;
    }
  }

  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const ctx = outCanvas.getContext('2d')!;

  const scaledMaskCanvas = document.createElement('canvas');
  scaledMaskCanvas.width = outW;
  scaledMaskCanvas.height = outH;
  const maskCtx = scaledMaskCanvas.getContext('2d')!;

  maskCtx.filter = 'blur(1.5px)';
  maskCtx.drawImage(maskCanvas, 0, 0, outW, outH);

  ctx.drawImage(sourceImg, 0, 0, outW, outH);

  const outImgData = ctx.getImageData(0, 0, outW, outH);
  const maskImgData = maskCtx.getImageData(0, 0, outW, outH);

  for (let i = 0; i < outImgData.data.length; i += 4) {
    outImgData.data[i + 3] = maskImgData.data[i];
  }

  ctx.putImageData(outImgData, 0, 0);
  return outCanvas;
}
