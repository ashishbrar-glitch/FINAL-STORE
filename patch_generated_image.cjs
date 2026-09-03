const fs = require('fs');
const file = 'src/components/admin/AdminProductModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  const getFinalGeneratedDataUrl = (): string | null => {
    if (!baseTransparentCanvas) return null;
    const enhancedCanvas = document.createElement('canvas');
    enhancedCanvas.width = baseTransparentCanvas.width;
    enhancedCanvas.height = baseTransparentCanvas.height;
    const ctx = enhancedCanvas.getContext('2d')!;
    
    ctx.filter = \`brightness(\${brightness}%) contrast(\${contrast}%) saturate(\${saturation}%)\`;
    ctx.drawImage(baseTransparentCanvas, 0, 0);
    
    return enhancedCanvas.toDataURL('image/png');
  };`;

const replacement = `  const getFinalGeneratedDataUrl = (): string | null => {
    if (!baseTransparentCanvas) return null;
    
    const MAX_SIZE = 800;
    let width = baseTransparentCanvas.width;
    let height = baseTransparentCanvas.height;
    
    if (width > height) {
      if (width > MAX_SIZE) {
        height = Math.round(height * (MAX_SIZE / width));
        width = MAX_SIZE;
      }
    } else {
      if (height > MAX_SIZE) {
        width = Math.round(width * (MAX_SIZE / height));
        height = MAX_SIZE;
      }
    }
    
    const enhancedCanvas = document.createElement('canvas');
    enhancedCanvas.width = width;
    enhancedCanvas.height = height;
    const ctx = enhancedCanvas.getContext('2d')!;
    
    ctx.filter = \`brightness(\${brightness}%) contrast(\${contrast}%) saturate(\${saturation}%)\`;
    ctx.drawImage(baseTransparentCanvas, 0, 0, width, height);
    
    let dataUrl = enhancedCanvas.toDataURL('image/webp', 0.8);
    if (!dataUrl.startsWith('data:image/webp')) {
      dataUrl = enhancedCanvas.toDataURL('image/png');
    }
    
    return dataUrl;
  };`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log("Patched getFinalGeneratedDataUrl");
