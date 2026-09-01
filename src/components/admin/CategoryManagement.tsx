import React, { useState, useEffect, useRef } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  getDocs,
  getDocsFromCache,
  doc,
  setDoc,
  deleteDoc,
  query,
} from "firebase/firestore";
import {
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { processImageToBase64 } from '../../lib/imageProcessor';

export function CategoryManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameEn, setNameEn] = useState("");
  const [nameHi, setNameHi] = useState("");
  const [emoji, setEmoji] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const processCategories = (snapshot: any) => {
      const catList = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
      catList.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setCategories(catList);
    };

    try {
      const q = query(collection(db, "categories"));
      const snapshot = await getDocs(q);
      processCategories(snapshot);
    } catch (err: any) {
      if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Fetch categories error:', err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        try {
          const snapshot = await getDocsFromCache(query(collection(db, "categories")));
          if (snapshot.empty) {
            setError("Firebase Database quota exceeded for today. Please upgrade your Firebase plan or try again tomorrow.");
          } else {
            processCategories(snapshot);
          }
        } catch (e) { 
          console.error(e); 
          setError("Database quota exceeded and no local cache available.");
        }
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

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

  const resetForm = () => {
    setNameEn("");
    setNameHi("");
    setEmoji("");
    setDisplayOrder("");
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    setShowAddForm(false);
    setUploadStatus("");
  };

  const handleEdit = (category: any) => {
    document.getElementById('category-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setNameEn(category.nameEn || category.name || "");
    setNameHi(category.nameHi || category.name || "");
    setEmoji(category.emoji || "");
    setDisplayOrder(category.displayOrder?.toString() || "0");
    setImagePreview(category.imageUrl || null);
    setImageFile(null);
    setEditingId(category.id);
    setShowAddForm(true);
    setUploadStatus("");
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      let imageUrl = imagePreview || "";
      if (imageFile) {
        setUploadStatus("Processing Image...");
        imageUrl = await processImageToBase64(imageFile);
      }

      setUploadStatus("Saving...");
      const catId = editingId || nameEn.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const dataToSave: any = {
        nameEn,
        nameHi,
        name: nameEn, // for legacy compat
        emoji,
        displayOrder: Number(displayOrder) || 0,
        isActive: true,
      };

      if (imageUrl) {
        dataToSave.imageUrl = imageUrl;
      }

      await setDoc(doc(db, "categories", catId), dataToSave, { merge: true });
      alert(editingId ? "Category successfully updated!" : "Category successfully added!");
      fetchCategories();
      resetForm();
    } catch (err: any) {
      alert("Error saving category: " + err.message);
    } finally {
      setActionLoading(false);
      setUploadStatus("");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Delete this category? Products in this category will still exist but might not display correctly until updated.")) return;
    try {
      await deleteDoc(doc(db, "categories", id));
      fetchCategories();
    } catch (err: any) {
      alert("Error deleting category: " + err.message);
    }
  };

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0e783a]" />
      </div>
    );

  return (
    <div id="category-section" className="space-y-4 scroll-mt-20">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-lg">Categories</h3>
        <button
          onClick={() => (showAddForm ? resetForm() : setShowAddForm(true))}
          className="flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? "Cancel" : "Add Category"}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleSaveCategory}
          className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3"
        >
          {/* Image Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-24 bg-white border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative hover:bg-blue-50 transition-colors"
          >
            {imagePreview ? (
              imagePreview.startsWith("http") || imagePreview.startsWith("data:") ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-4xl">{imagePreview}</div>
              )
            ) : (
              <>
                <ImageIcon className="w-6 h-6 text-blue-300 mb-1" />
                <span className="text-[10px] font-medium text-blue-700">Tap to upload 1:1 image</span>
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
              placeholder="English Name"
              required
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200"
            />
            <input
              type="text"
              placeholder="Hindi Name"
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
              placeholder="Order (e.g. 1)"
              required
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200"
            />
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-xl font-medium flex justify-center flex-col items-center gap-1 mt-1 shadow-sm"
          >
            {actionLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {uploadStatus && (
                  <span className="text-[10px] opacity-80">{uploadStatus}</span>
                )}
              </>
            ) : editingId ? (
              "Update Category"
            ) : (
              "Add Category"
            )}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden text-2xl border border-gray-100">
              {cat.imageUrl ? (
                <img src={cat.imageUrl} className="w-full h-full object-cover" alt="" />
              ) : (
                cat.emoji
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {cat.nameEn}
              </p>
              <p className="text-xs text-gray-500">
                {cat.nameHi} &bull; Order: {cat.displayOrder}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => handleEdit(cat)}
                className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No categories found.
          </div>
        )}
      </div>
    </div>
  );
}
