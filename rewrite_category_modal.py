import os

content = """import React, { useState, useRef } from 'react';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { processImageToBase64 } from '../../lib/imageProcessor';

interface Props {
  category?: any;
  onClose: () => void;
  onSaved: () => void;
}

export function AdminCategoryModal({ category, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nameEn, setNameEn] = useState(category?.nameEn || category?.name || '');
  const [nameHi, setNameHi] = useState(category?.nameHi || category?.name || '');
  const [emoji, setEmoji] = useState(category?.emoji || '');
  const [displayOrder, setDisplayOrder] = useState(category?.displayOrder || 0);
  const [isActive, setIsActive] = useState(category?.isActive ?? true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(category?.imageUrl || null);

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
      const catId = category?.id || nameEn.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const dataToSave: any = {
        nameEn: nameEn,
        nameHi: nameHi,
        name: nameEn, // Legacy compat
        emoji: emoji,
        displayOrder: Number(displayOrder),
        isActive: isActive,
      };

      if (imageUrl) {
        dataToSave.imageUrl = imageUrl;
      }

      await setDoc(doc(db, "categories", catId), dataToSave, { merge: true });
      onSaved();
    } catch (err) {
      console.error(err);
      alert("Error saving category");
    } finally {
      setLoading(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex justify-between items-center p-4">
          <h2 className="text-lg font-bold text-gray-900">{category ? 'Edit Category' : 'Add Category'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 pt-0 overflow-y-auto">
          <form id="cat-form" onSubmit={handleSubmit} className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
            
            {/* Image Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 bg-white border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative hover:bg-blue-50/50 transition-colors"
            >
              {imagePreview ? (
                imagePreview.startsWith("http") || imagePreview.startsWith("data:") ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-4xl">{imagePreview}</div>
                )
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-blue-300 mb-2" />
                  <span className="text-xs font-medium text-blue-700">Tap to upload photo (1:1 aspect ratio)</span>
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

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="English Name (e.g. Grocery)"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200"
              />
              <input
                type="text"
                placeholder="Hindi Name (e.g. किराना)"
                required
                value={nameHi}
                onChange={(e) => setNameHi(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Emoji (e.g. 🍎)"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200"
              />
              <input
                type="number"
                placeholder="Display Order (e.g. 1)"
                required
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200"
              />
            </div>

            <div className="flex flex-col gap-2 mt-2 bg-white p-3 rounded-xl border border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Active (Visible in Store)</span>
              </label>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-xl font-medium flex justify-center flex-col items-center gap-1 mt-2 shadow-sm">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {uploadStatus && (
                    <span className="text-[10px] opacity-80">{uploadStatus}</span>
                  )}
                </>
              ) : category ? (
                "Update Category"
              ) : (
                "Add Category"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
"""

with open("src/components/admin/AdminCategoryModal.tsx", "w") as f:
    f.write(content)

