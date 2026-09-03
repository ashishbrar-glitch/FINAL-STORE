import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Check, Loader2, Sparkles, Image as ImageIcon, SlidersHorizontal, Wand2, RefreshCcw, AlertCircle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { processImageToBase64 } from '../../lib/imageProcessor';
import { pipeline, env } from '@huggingface/transformers';
import heic2any from 'heic2any';

env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

interface Props {
  product?: any;
  categories: any[];
  onClose: () => void;
  onSaved: () => void;
}

type ImageState = 'idle' | 'processing' | 'generated' | 'failed';

export function AdminProductModal({ product, categories, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price || 0);
  const [category, setCategory] = useState(product?.categoryId || product?.category || '');
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [isBestseller, setIsBestseller] = useState(product?.isBestseller ?? false);
  
  // Image Editor State
  const [imageState, setImageState] = useState<ImageState>('idle');
  const [cleanStatus, setCleanStatus] = useState("");
  
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(product?.imageUrl || product?.image || null);
  
  const [baseTransparentCanvas, setBaseTransparentCanvas] = useState<HTMLCanvasElement | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [submitMode, setSubmitMode] = useState<'original' | 'generated' | 'existing'>('existing');
  const [errorMsg, setErrorMsg] = useState("");

  // Adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const handleGenerateImage = async () => {
    if (!name) {
      alert("Please enter a product name first to generate an image.");
      return;
    }
    setIsGeneratingImage(true);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: name })
      });
      if (!response.ok) throw new Error("Failed to generate image");
      const data = await response.json();
      setOriginalPreview(data.imageUrl);
      setOriginalImageFile(null);
      setImageState('idle');
    } catch (error) {
      console.error(error);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalImageFile(file);
      resetAdjustments();
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      await processBackgroundRemoval(file);
    }
  };

  const processBackgroundRemoval = async (file: File) => {
    setImageState('processing');
    setCleanStatus("Initializing AI...");
    
    try {
      let fileToProcess = file;
      const fileType = file.type || '';
      const fileName = file.name || '';
      
      if (
        fileType.toLowerCase().includes('heic') || 
        fileType.toLowerCase().includes('heif') || 
        fileName.toLowerCase().endsWith('.heic') || 
        fileName.toLowerCase().endsWith('.heif')
      ) {
        setCleanStatus("Converting HEIC format...");
        try {
          const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
          fileToProcess = Array.isArray(converted) ? converted[0] as File : converted as File;
        } catch (err) {
          throw new Error("Unable to convert HEIC image. Please upload a JPEG or PNG.");
        }
      }

      setCleanStatus("Loading Image...");
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileToProcess);
      });

      const segmenter = await pipeline('image-segmentation', 'Xenova/modnet', {
        progress_callback: (info: any) => {
          if (info.status === 'downloading') {
            setCleanStatus(`Downloading AI Model: ${Math.round(info.progress || 0)}%`);
          } else if (info.status === 'ready') {
            setCleanStatus("Analyzing pixels...");
          }
        }
      });

      setCleanStatus("Extracting product...");
      const result = await segmenter(dataUrl);
      
      let rawMask: any;
      if (Array.isArray(result)) {
        rawMask = result[0].mask || result[0];
      } else {
        rawMask = result;
      }
      
      let maskCanvas;
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

      const originalImg = new Image();
      await new Promise((resolve, reject) => { 
        originalImg.onload = resolve; 
        originalImg.onerror = () => reject(new Error("The source image could not be decoded."));
        originalImg.src = dataUrl;
      });
      
      const outCanvas = document.createElement('canvas');
      outCanvas.width = originalImg.width;
      outCanvas.height = originalImg.height;
      const ctx = outCanvas.getContext('2d')!;
      
      const scaledMaskCanvas = document.createElement('canvas');
      scaledMaskCanvas.width = outCanvas.width;
      scaledMaskCanvas.height = outCanvas.height;
      const maskCtx = scaledMaskCanvas.getContext('2d')!;
      
      maskCtx.filter = 'blur(1.5px)';
      maskCtx.drawImage(maskCanvas, 0, 0, outCanvas.width, outCanvas.height);
      
      ctx.drawImage(originalImg, 0, 0);
      
      const outImgData = ctx.getImageData(0, 0, outCanvas.width, outCanvas.height);
      const maskImgData = maskCtx.getImageData(0, 0, outCanvas.width, outCanvas.height);
      
      for (let i = 0; i < outImgData.data.length; i += 4) {
         outImgData.data[i + 3] = maskImgData.data[i]; 
      }
      
      ctx.putImageData(outImgData, 0, 0);
      
      setBaseTransparentCanvas(outCanvas);
      setGeneratedPreview(outCanvas.toDataURL('image/png'));
      setImageState('generated');
      
    } catch (err: any) {
      console.error(err);
      setImageState('failed');
      setCleanStatus("Failed to process image.");
    }
  };

  const getFinalGeneratedDataUrl = (): string | null => {
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
    
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(baseTransparentCanvas, 0, 0, width, height);
    
    let dataUrl = enhancedCanvas.toDataURL('image/webp', 0.8);
    if (!dataUrl.startsWith('data:image/webp')) {
      dataUrl = enhancedCanvas.toDataURL('image/png');
    }
    
    return dataUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (price === '' || price === null || price === undefined) {
      setErrorMsg("Please enter a valid price");
      return;
    }
    
    setLoading(true);
    setUploadStatus("Starting upload...");
    const mode = submitMode;
    
    try {
      let finalImageUrl = originalPreview || "";
      
      if (mode === 'original' && originalImageFile) {
        setUploadStatus("Compressing Original Image...");
        finalImageUrl = await processImageToBase64(originalImageFile);
      } else if (mode === 'generated' && baseTransparentCanvas) {
        setUploadStatus("Saving Generated Image...");
        finalImageUrl = getFinalGeneratedDataUrl() || "";
      }
      
      setUploadStatus("Saving product details...");
      const productId = product?.id || doc(collection(db, "products")).id;
      const dataToSave: any = {
        name,
        price: Number(price),
        categoryId: category,
        category: category,
        image: finalImageUrl,
        imageUrl: finalImageUrl,
        isAvailable,
        isBestseller,
        nameHi: product?.nameHi || '',
        mrp: product?.mrp || 0,
        unit: product?.unit || 'pc',
        isActive: product?.isActive ?? true,
      };
      
      if (!product?.id) {
        dataToSave.createdAt = new Date();
      }
      if (product?.id) {
        await updateDoc(doc(db, "products", product.id), dataToSave);
      } else {
        await setDoc(doc(db, "products", productId), dataToSave);
      }
      
      setUploadStatus("Success!");
      setTimeout(() => {
        onSaved();
      }, 500);
      
    } catch (err) {
      console.error(err);
      alert("Error saving product");
      setLoading(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-gray-50 w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-5 bg-white border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> {errorMsg}
              </div>
            )}
            
            {/* 1. Product Details */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <input
                type="text"
                placeholder="Product Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Price (₹)"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-1/3 text-sm px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-2/3 text-sm px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map(c => (
                    <option key={c.id || c.name} value={c.nameEn || c.name}>{c.nameEn || c.name} {c.emoji}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <input
                  type="checkbox"
                  id="modalIsAvailable"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="modalIsAvailable" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  In Stock (Available for purchase)
                </label>
              </div>
              <div className="flex items-center gap-3 bg-red-50 p-3.5 rounded-xl border border-red-100 mt-2">
                <input
                  type="checkbox"
                  id="modalIsBestseller"
                  checked={isBestseller}
                  onChange={(e) => setIsBestseller(e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-white border-red-300 rounded focus:ring-red-500"
                />
                <label htmlFor="modalIsBestseller" className="text-sm font-semibold text-red-800 cursor-pointer flex items-center gap-1.5">
                  🌟 Bestseller (Highlight this item)
                </label>
              </div>
            </div>
            
            {/* 2. Image Section */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
               <div className="flex items-center justify-between">
                 <h3 className="font-bold text-gray-800 text-sm">Product Image</h3>
                 {originalImageFile && (
                    <button type="button" onClick={() => { setOriginalImageFile(null); setImageState('idle'); setGeneratedPreview(null); }} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                       Change Image
                    </button>
                 )}
               </div>
               
               {!originalImageFile && (
                  <div className="space-y-3">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-44 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative hover:bg-gray-100 transition-colors"
                    >
                      {originalPreview ? (
                        originalPreview.startsWith("http") || originalPreview.startsWith("data:") ? (
                          <img src={originalPreview} alt="Preview" className="w-full h-full object-contain" />
                        ) : (
                          <div className="text-5xl">{originalPreview}</div>
                        )
                      ) : (
                        <>
                          <ImageIcon className="w-10 h-10 text-gray-400 mb-3" />
                          <span className="text-sm font-semibold text-gray-600">Tap to upload a product photo</span>
                          <span className="text-xs text-gray-400 mt-1">High quality JPEG or PNG</span>
                        </>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage || !name}
                      className="w-full py-3 px-4 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 flex items-center justify-center gap-2 font-bold text-sm hover:bg-purple-100 transition-colors disabled:opacity-50"
                    >
                      {isGeneratingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      {isGeneratingImage ? "Generating AI Image..." : "Auto-Generate AI Image"}
                    </button>
                  </div>
               )}
               
               {originalImageFile && (
                  <div className="space-y-5">
                    {/* The new image editor */}
                    <div className="flex gap-4">
                       {/* Original */}
                       <div className="flex-1 space-y-2">
                         <div className="aspect-square bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center p-2">
                           <img src={originalPreview!} alt="Original" className="w-full h-full object-contain rounded-lg" />
                         </div>
                         <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Original</p>
                       </div>
                       
                       {/* Generated */}
                       <div className="flex-1 space-y-2">
                         <div className="aspect-square bg-[url('https://transparenttextures.com/patterns/cubes.png')] bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center relative p-2">
                            {imageState === 'processing' && (
                               <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center backdrop-blur-sm rounded-xl z-10">
                                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                                  <span className="text-xs font-bold text-blue-800 text-center px-4">{cleanStatus}</span>
                               </div>
                            )}
                            {imageState === 'failed' && (
                               <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center rounded-xl z-10">
                                  <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                                  <span className="text-xs font-bold text-red-700">Failed</span>
                               </div>
                            )}
                            {(imageState === 'generated' || imageState === 'processing') && generatedPreview && (
                               <img 
                                 src={generatedPreview} 
                                 alt="Generated" 
                                 className="w-full h-full object-contain drop-shadow-md rounded-lg" 
                                 style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` }}
                               />
                            )}
                         </div>
                         <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider text-center flex items-center justify-center gap-1">
                            {imageState === 'processing' ? <Loader2 className="w-3 h-3 animate-spin"/> : '✨'} Generated
                         </p>
                       </div>
                    </div>
                    
                    {/* Controls */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                       <div className="flex justify-between items-center mb-4">
                          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1"><SlidersHorizontal className="w-4 h-4"/> Adjustments</h4>
                          <button type="button" onClick={resetAdjustments} className="text-[11px] text-gray-600 font-bold hover:text-gray-900 bg-white px-3 py-1.5 rounded-lg border shadow-sm flex items-center gap-1 transition-colors"><RefreshCcw className="w-3 h-3"/> Reset</button>
                       </div>
                       <div className="space-y-4 px-1">
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-gray-600 w-16">Brightness</span>
                            <input type="range" min="50" max="150" value={brightness} onChange={(e)=>setBrightness(Number(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" disabled={imageState !== 'generated'} />
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-gray-600 w-16">Contrast</span>
                            <input type="range" min="50" max="150" value={contrast} onChange={(e)=>setContrast(Number(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" disabled={imageState !== 'generated'} />
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-gray-600 w-16">Saturation</span>
                            <input type="range" min="0" max="200" value={saturation} onChange={(e)=>setSaturation(Number(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" disabled={imageState !== 'generated'} />
                          </div>
                       </div>
                    </div>
                  </div>
               )}
               
               <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*, .heic, .heif" className="hidden" />
            </div>

            {/* Form Actions */}
            <div className="pt-2 pb-6">
               {loading && (
                  <div className="flex flex-col items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 shadow-inner">
                     <Loader2 className="w-6 h-6 animate-spin mb-2" />
                     <span className="text-sm font-bold">{uploadStatus}</span>
                  </div>
               )}
               
               {!loading && originalImageFile && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button type="submit" onClick={() => setSubmitMode('original')} className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-50 shadow-sm transition-all active:scale-[0.98]">
                       Upload Original
                    </button>
                    <button type="submit" onClick={() => setSubmitMode('generated')} disabled={imageState !== 'generated'} className="flex-1 bg-blue-600 border-2 border-blue-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2">
                       <Wand2 className="w-4 h-4" /> Upload Generated
                    </button>
                  </div>
               )}
               
               {!loading && !originalImageFile && (
                  <button type="submit" onClick={() => setSubmitMode('existing')} className="w-full bg-[#0e783a] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#0c6631] shadow-sm transition-all active:scale-[0.98]">
                     {product ? "Update Item" : "Add Item"}
                  </button>
               )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
