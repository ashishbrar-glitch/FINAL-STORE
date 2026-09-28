import { compressCanvasToBase64 } from './imageProcessor';

export async function autoCropImage(imageSrc: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return resolve(null);
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
      let isNotEmpty = false;
      
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx+1];
          const b = data[idx+2];
          const a = data[idx+3];
          
          // Consider transparent or pure white as empty space
          // White is > 240, 240, 240
          const isWhite = r > 245 && g > 245 && b > 245;
          const isTransparent = a < 10;
          
          if (!isWhite && !isTransparent) {
            isNotEmpty = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      
      if (!isNotEmpty) return resolve(null); // Empty image
      
      // Add a small padding (e.g. 5%)
      const padding = Math.max(canvas.width, canvas.height) * 0.05;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(canvas.width, maxX + padding);
      maxY = Math.min(canvas.height, maxY + padding);
      
      const croppedWidth = maxX - minX;
      const croppedHeight = maxY - minY;
      
      // If the cropped area is almost the same as the original, don't change it
      if (croppedWidth >= canvas.width * 0.95 && croppedHeight >= canvas.height * 0.95) {
        return resolve(null); // No significant cropping needed
      }
      
      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = croppedWidth;
      croppedCanvas.height = croppedHeight;
      const croppedCtx = croppedCanvas.getContext("2d");
      if (!croppedCtx) return resolve(null);
      
      // Fill with white background in case of transparent
      croppedCtx.fillStyle = "#FFFFFF";
      croppedCtx.fillRect(0, 0, croppedWidth, croppedHeight);
      
      croppedCtx.drawImage(
        canvas,
        minX, minY, croppedWidth, croppedHeight,
        0, 0, croppedWidth, croppedHeight
      );
      
      const compressedResult = compressCanvasToBase64(croppedCanvas, {
        maxDimension: 600,
        targetMaxBytes: 220 * 1024,
        preserveTransparency: false,
        preferredQuality: 0.78
      });
      resolve(compressedResult);
    };
    img.onerror = () => resolve(null);
    img.src = imageSrc;
  });
}
