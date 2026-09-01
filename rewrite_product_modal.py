import os

content = """import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { doc, setDoc, updateDoc, collection } from "firebase/firestore";
import { db } from '../../lib/firebase';
import { processImageToBase64 } from '../../lib/imageProcessor';

interface Props {
  product?: any | null;
  categories: any[];
  onClose: () => void;
  onSaved: () => void;
}

export function AdminProductModal({ product, categories, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(product?.name || '');
  const [nameHi, setNameHi] = useState(product?.nameHi || '');
  const [price, setPrice] = useState(product?.price || 0);
  const [mrp, setMrp] = useState(product?.mrp || 0);
  const [category, setCategory] = useState(product?.categoryId || product?.category || '');
  const [unit, setUnit] = useState(product?.unit || 'pc');
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl || product?.image || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploadStatus("Starting...");
    
    try {
      let imageUrl = imagePreview || "";
      if (imageFile) {
        setUploadStatus("Processing Image...");
        imageUrl = await processImageToBase64(imageFile);
      }
      
      setUploadStatus("Saving details...");

      const productId = product?.id || doc(collection(db, "products")).id;
      const dataToSave: any = {
        name,
        nameHi,
        price: Number(price),
        mrp: Number(mrp),
        categoryId: category,
        category: category,
        image: imageUrl,
        imageUrl: imageUrl, // Save to both for legacy support
        unit,
        isActive,
        isAvailable,
      };

      if (!product?.id) {
        dataToSave.createdAt = new Date();
      }

      if (product?.id) {
        await updateDoc(doc(db, "products", product.id), dataToSave);
      } else {
        await setDoc(doc(db, "products", productId), dataToSave);
      }
      onSaved();
    } catch (err) {
      console.error(err);
      alert("Error saving product");
    } finally {
      setLoading(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4">
          <h2 className="text-lg font-bold text-gray-900">{product ? 'Edit Item' : 'Add New Item'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 pt-0 overflow-y-auto">
          <form id="product-form" onSubmit={handleSubmit} className="bg-green-50/50 p-4 rounded-2xl border border-green-100 space-y-3">
            {/* Image Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 bg-white border-2 border-dashed border-green-200 rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative hover:bg-green-50/50 transition-colors"
            >
              {imagePreview ? (
                imagePreview.startsWith("http") || imagePreview.startsWith("data:") ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-4xl">{imagePreview}</div>
                )
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-green-300 mb-2" />
                  <span className="text-xs font-medium text-green-700">Tap to upload photo</span>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*, .heic, .heif"
                className="hidden"
              />
            </div>

            <input
              type="text"
              placeholder="Product Name (English)"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200"
            />
            
            <input
              type="text"
              placeholder="Product Name (Hindi) - Optional"
              value={nameHi}
              onChange={(e) => setNameHi(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200"
            />

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Price (₹)"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-1/3 text-sm px-3 py-2 rounded-xl border border-gray-200"
              />
              
              <input
                type="number"
                placeholder="MRP (₹)"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                className="w-1/3 text-sm px-3 py-2 rounded-xl border border-gray-200"
              />
              
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-1/3 text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white"
              >
                <option value="" disabled>Category</option>
                {categories.map(c => (
                  <option key={c.id || c.name} value={c.nameEn || c.name}>{c.nameEn || c.name} {c.emoji}</option>
                ))}
              </select>
            </div>
            
            <input
              type="text"
              placeholder="Unit (kg, g, pc...)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200"
            />

            <div className="flex flex-col gap-2 mt-2 bg-white p-3 rounded-xl border border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#0e783a] bg-gray-100 border-gray-300 rounded focus:ring-[#0e783a]"
                />
                <span className="text-sm font-medium text-gray-700">Active (Visible in Store)</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 text-[#0e783a] bg-gray-100 border-gray-300 rounded focus:ring-[#0e783a]"
                />
                <span className="text-sm font-medium text-gray-700">In Stock (Available for purchase)</span>
              </label>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#0e783a] text-white py-2 rounded-xl font-medium flex justify-center flex-col items-center gap-1 mt-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {uploadStatus && (
                    <span className="text-[10px] opacity-80">{uploadStatus}</span>
                  )}
                </>
              ) : product ? (
                "Update Item"
              ) : (
                "Add Item"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
"""

with open("src/components/admin/AdminProductModal.tsx", "w") as f:
    f.write(content)

