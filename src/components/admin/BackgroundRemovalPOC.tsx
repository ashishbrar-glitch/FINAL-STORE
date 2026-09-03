import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, ArrowRight, CheckCircle2, ShieldCheck, Loader2, SlidersHorizontal, Image as ImageIcon } from 'lucide-react';
import { processImageToBase64 } from '../../lib/imageProcessor';
import { pipeline, env, RawImage } from '@huggingface/transformers';
import heic2any from 'heic2any';

// Setup Transformers.js
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1; // Prevent UI freeze

interface Props {
  onClose: () => void;
}

export function BackgroundRemovalPOC({ onClose }: Props) {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [finalBase64, setFinalBase64] = useState<string | null>(null);
  const [finalSize, setFinalSize] = useState<string>('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  
  const [brightness, setBrightness] = useState(110);
  const [contrast, setContrast] = useState(115);
  const [saturation, setSaturation] = useState(120);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const extractedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const formatSize = (bytes: number) => {
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      setOriginalPreview(URL.createObjectURL(file));
      
      setProcessedPreview(null);
      setFinalBase64(null);
      setFinalSize('');
      extractedCanvasRef.current = null;
    }
  };

  const applyEnhancementsAndCompress = async (baseTransparentCanvas: HTMLCanvasElement) => {
     const enhancedCanvas = document.createElement('canvas');
     enhancedCanvas.width = baseTransparentCanvas.width;
     enhancedCanvas.height = baseTransparentCanvas.height;
     const ctx = enhancedCanvas.getContext('2d')!;
     
     // Apply user's selected filters BEFORE passing to the compressor
     ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
     ctx.drawImage(baseTransparentCanvas, 0, 0);
     
     const blob = await new Promise<Blob>((resolve) => enhancedCanvas.toBlob((b) => resolve(b!), 'image/png'));
     setProcessedPreview(URL.createObjectURL(blob));
     
     // Feed perfectly into EXISTING system
     const finalBase64String = await processImageToBase64(blob);
     setFinalBase64(finalBase64String);
     
     const base64Bytes = finalBase64String.length * 0.75;
     setFinalSize(formatSize(base64Bytes));
  };

  // Re-run compression when sliders change (if extraction is done)
  useEffect(() => {
    if (extractedCanvasRef.current && !isProcessing) {
      applyEnhancementsAndCompress(extractedCanvasRef.current);
    }
  }, [brightness, contrast, saturation]);

  const runAIPipeline = async () => {
    if (!originalFile) return;
    setIsProcessing(true);
    setStatusMsg("Initializing Local AI...");
    
    try {
      // Handle HEIC/HEIF
      let fileToProcess = originalFile;
      const fileType = originalFile.type || '';
      const fileName = originalFile.name || '';
      if (
        fileType.toLowerCase().includes('heic') || 
        fileType.toLowerCase().includes('heif') || 
        fileName.toLowerCase().endsWith('.heic') || 
        fileName.toLowerCase().endsWith('.heif')
      ) {
        setStatusMsg("Converting Apple HEIC format...");
        try {
          const converted = await heic2any({
            blob: originalFile,
            toType: 'image/jpeg',
            quality: 0.9
          });
          fileToProcess = Array.isArray(converted) ? converted[0] as File : converted as File;
        } catch (err) {
          throw new Error("Unable to convert HEIC image. Please upload a JPEG or PNG.");
        }
      }

      // Read as Data URL to prevent Blob URL issues and decoding errors
      setStatusMsg("Reading image data...");
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileToProcess);
      });
      const imgUrl = dataUrl;
      
      // Load model (Xenova/modnet is Apache 2.0 / Commercial safe)
      const segmenter = await pipeline('image-segmentation', 'Xenova/modnet', {
        progress_callback: (info: any) => {
          if (info.status === 'downloading') {
            setStatusMsg(`Downloading ML Model: ${Math.round(info.progress || 0)}% (One-time only)`);
          } else if (info.status === 'ready') {
            setStatusMsg("ML Model Loaded. Analyzing image pixels...");
          }
        }
      });

      setStatusMsg("Running neural network to perfectly isolate product...");
      const result = await segmenter(imgUrl);
      
      // In Transformers.js v3+ and v4+, result for image-segmentation with MODNet is typically a RawImage mask
      // or an array.
      // Usually, it's an array of { label, mask: RawImage } or a single RawImage
      let rawMask: any;
      if (Array.isArray(result)) {
        rawMask = result[0].mask || result[0];
      } else {
        rawMask = result;
      }
      
      setStatusMsg("Applying mask to original image...");
      
      // 1. Convert mask to canvas
      let maskCanvas;
      if (rawMask.toCanvas) {
         maskCanvas = rawMask.toCanvas();
      } else {
         maskCanvas = document.createElement('canvas');
         maskCanvas.width = rawMask.width;
         maskCanvas.height = rawMask.height;
         const maskCtx = maskCanvas.getContext('2d');
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

      // 2. Load original image to canvas
      const originalImg = new Image();
      await new Promise((resolve, reject) => { 
        originalImg.onload = resolve; 
        originalImg.onerror = () => reject(new Error("The source image could not be decoded."));
        originalImg.src = imgUrl;
      });
      
      const outCanvas = document.createElement('canvas');
      outCanvas.width = originalImg.width;
      outCanvas.height = originalImg.height;
      const ctx = outCanvas.getContext('2d');
      
      // Scale mask to original dimensions
      const scaledMaskCanvas = document.createElement('canvas');
      scaledMaskCanvas.width = outCanvas.width;
      scaledMaskCanvas.height = outCanvas.height;
      const maskCtx = scaledMaskCanvas.getContext('2d');
      
      // Apply edge feathering (smoothing) to the mask
      maskCtx.filter = 'blur(1.5px)';
      
      maskCtx.drawImage(maskCanvas, 0, 0, outCanvas.width, outCanvas.height);
      
      // Draw original
      ctx.drawImage(originalImg, 0, 0);
      
      // Extract pixels
      const outImgData = ctx.getImageData(0, 0, outCanvas.width, outCanvas.height);
      const maskImgData = maskCtx.getImageData(0, 0, outCanvas.width, outCanvas.height);
      
      // Apply mask using pixel manipulation (using R channel of mask as alpha)
      for (let i = 0; i < outImgData.data.length; i += 4) {
         outImgData.data[i + 3] = maskImgData.data[i]; 
      }
      
      ctx.putImageData(outImgData, 0, 0);
      
      // Store the base transparent cutout
      extractedCanvasRef.current = outCanvas;
      
      setStatusMsg("Enhancing colors and compressing...");
      await applyEnhancementsAndCompress(outCanvas);

    } catch (err: any) {
      console.error(err);
      alert("Error in AI processing: " + err.message);
    } finally {
      setIsProcessing(false);
      setStatusMsg("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">Machine Learning AI Extraction POC</h2>
            <p className="text-sm text-gray-500">Commercial Safe (Apache 2.0) • Edge Perfect • Zero API Cost</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50 flex flex-col md:flex-row gap-6">
          {/* Left Column: Input & Controls */}
          <div className="w-full md:w-1/3 flex flex-col gap-4">
             {!originalFile ? (
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 bg-white rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-green-500">
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="font-semibold text-center text-sm">Upload Photo with complex background / lines</p>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
             ) : (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm">Original Image</span>
                    <button onClick={() => setOriginalFile(null)} className="text-xs text-red-600 hover:underline">Change</button>
                  </div>
                  <img src={originalPreview!} alt="Original" className="w-full h-48 object-cover rounded-lg" />
                  
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><SlidersHorizontal className="w-4 h-4"/> Auto-Enhance Sliders</h4>
                    
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Brightness ({brightness}%)</span>
                      </div>
                      <input type="range" min="80" max="150" value={brightness} onChange={(e)=>setBrightness(Number(e.target.value))} className="w-full" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Contrast ({contrast}%)</span>
                      </div>
                      <input type="range" min="80" max="150" value={contrast} onChange={(e)=>setContrast(Number(e.target.value))} className="w-full" />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Saturation ({saturation}%)</span>
                      </div>
                      <input type="range" min="80" max="200" value={saturation} onChange={(e)=>setSaturation(Number(e.target.value))} className="w-full" />
                    </div>
                  </div>

                  <button 
                    onClick={runAIPipeline} 
                    disabled={isProcessing}
                    className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Run AI Extraction"}
                  </button>
                  {statusMsg && <p className="text-xs text-blue-600 mt-2 text-center font-medium animate-pulse">{statusMsg}</p>}
                </div>
             )}
          </div>

          {/* Right Column: Output */}
          <div className="w-full md:w-2/3 flex flex-col gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 p-6 flex flex-col relative overflow-hidden">
                 <h3 className="font-bold text-gray-800 mb-1">Final Result (Passed to Compressor)</h3>
                 <p className="text-xs text-gray-500 mb-4">Background perfectly masked, colors enhanced, forced onto white square background</p>
                 
                 <div className="flex-1 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-[url('https://transparenttextures.com/patterns/cubes.png')] bg-gray-50 relative">
                    {finalBase64 ? (
                      <img src={finalBase64} className="w-full h-full object-contain drop-shadow-xl" alt="Result" />
                    ) : (
                      <div className="text-center text-gray-400">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>Waiting for AI process...</p>
                      </div>
                    )}
                 </div>
                 
                 {finalSize && (
                   <div className="mt-4 bg-green-50 text-green-800 p-3 rounded-lg text-sm flex items-start gap-2 border border-green-200">
                     <CheckCircle2 className="w-5 h-5 shrink-0" />
                     <div>
                       <strong>Compression Success!</strong>
                       <p>Final image size: <strong>{finalSize}</strong>. It runs through your exact `processImageToBase64` logic to maintain perfect file size limits.</p>
                     </div>
                   </div>
                 )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
