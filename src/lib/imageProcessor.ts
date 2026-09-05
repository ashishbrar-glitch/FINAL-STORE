import heic2any from 'heic2any';

export async function processImageToBase64(file: File | Blob): Promise<string> {
  let fileToProcess = file;

  // 1. Check if it's HEIC/HEIF and convert to JPEG
  const fileType = file.type || '';
  const fileName = (file as File).name || '';
  if (
    fileType.toLowerCase().includes('heic') || 
    fileType.toLowerCase().includes('heif') || 
    fileName.toLowerCase().endsWith('.heic') || 
    fileName.toLowerCase().endsWith('.heif')
  ) {
    try {
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8
      });
      // heic2any can return an array of blobs if it's an image sequence, we take the first
      fileToProcess = Array.isArray(converted) ? converted[0] : converted;
    } catch (err) {
      console.warn("Failed to convert HEIC to JPEG, attempting fallback", err);
      throw new Error("Unable to process Apple HEIC image format. Please try uploading a JPEG or PNG.");
    }
  }

  // 2. Load into an HTML Image Element to draw on Canvas
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 3. Calculate new dimensions (Max 800x800)
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round(height *= MAX_SIZE / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round(width *= MAX_SIZE / height);
            height = MAX_SIZE;
          }
        }

        // 4. Draw to canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error("Canvas not supported in this browser"));
        }
        
        // If webp supports transparency, we don't strictly need white background, 
        // but it's safe to keep it, or we can just draw image directly. Let's just draw image directly to keep transparency if needed, 
        // wait, if we fill white, transparent PNGs become white.
        // Let's remove the white fill to preserve transparency in WebP.
        // ctx.fillStyle = '#FFFFFF';
        // ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // 5. Get highly compressed Base64 WebP string
        // 0.8 quality at 800px max dimension guarantees a small payload with good quality
        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        reject(new Error("Failed to load image for processing"));
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error("Failed to read file data"));
      }
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(fileToProcess);
  });
}
