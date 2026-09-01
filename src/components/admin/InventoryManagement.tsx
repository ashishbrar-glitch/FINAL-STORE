import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "../../lib/firebase";
import {
  collection,
  getDocs,
  getDocsFromCache,
  doc,
  setDoc,
  deleteDoc,
  query,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import imageCompression from "browser-image-compression";

import { processImageToBase64 } from '../../lib/imageProcessor';

export function InventoryManagement() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  
  const fetchCategories = async () => {
    const processCategories = (snapshot: any) => {
      const catList = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setCategories(catList);
      if (catList.length > 0 && !category) {
        setCategory(catList[0].id);
      }
    };
    try {
      const snapshot = await getDocs(query(collection(db, "categories")));
      processCategories(snapshot);
    } catch (err: any) {
      if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Fetch categories error:', err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        try {
          const snapshot = await getDocsFromCache(query(collection(db, "categories")));
          if (snapshot.empty) {
            setError("Firebase Database quota exceeded for today. Please try again tomorrow.");
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
    }
  };

  const fetchProducts = async () => {
    const processProducts = (snapshot: any) => {
      const prodList = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(prodList);
    };
    try {
      const q = query(collection(db, "products"));
      const snapshot = await getDocs(q);
      processProducts(snapshot);
    } catch (err: any) {
      if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Fetch products error:', err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        try {
          const snapshot = await getDocsFromCache(query(collection(db, "products")));
          processProducts(snapshot);
        } catch (e) { console.error(e); }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      // Use createObjectURL for instant preview (prevents UI freeze on large phone images)
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setCategory("");
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
    setIsAvailable(true);
    setShowAddForm(false);
  };

  const handleEdit = (product: any) => {
    document.getElementById('inventory-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setName(product.name);
    setPrice(product.price.toString());
    setCategory(product.category);
    setImagePreview(product.imageUrl || product.image); // fallback to emoji image for demo seed
    setEditingId(product.id);
    setIsAvailable(product.isAvailable !== false);
    setShowAddForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setUploadStatus("Starting...");

    try {
      let imageUrl = imagePreview; // keep existing if no new file

      // Upload new image if provided
      if (imageFile) {
        setUploadStatus("Processing Image (Format neutral)...");
        try {
          imageUrl = await processImageToBase64(imageFile);
        } catch (error: any) {
          throw new Error("Failed to process image: " + error.message);
        }
      }

      setUploadStatus("Saving product details...");
      const prodId = editingId || Date.now().toString();

      const dataToSave: any = {
        name,
        price: Number(price),
        category,
        categoryId: category,
        imageUrl: imageUrl,
        isActive: true,
        isAvailable: isAvailable,
      };
      if (!editingId) {
        dataToSave.createdAt = new Date();
      }

      await setDoc(doc(db, 'products', prodId), dataToSave, { merge: true });

      alert(
        editingId ? "Item successfully updated!" : "Item successfully added!",
      );
      fetchProducts();
      resetForm();
    } catch (err: any) {
      alert("Error saving product: " + err.message);
    } finally {
      setActionLoading(false);
      setUploadStatus("");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
    } catch (err: any) {
      alert("Error deleting product: " + err.message);
    }
  };

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0e783a]" />
      </div>
    );

  return (
    <div id="inventory-section" className="space-y-4 scroll-mt-20">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-lg">Inventory</h3>
        <button
          onClick={() => (showAddForm ? resetForm() : setShowAddForm(true))}
          className="flex items-center gap-1 text-sm bg-green-50 text-[#0e783a] px-3 py-1.5 rounded-lg font-medium"
        >
          {showAddForm ? (
            <X className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {showAddForm ? "Cancel" : "Add Item"}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleSaveProduct}
          className="bg-green-50/50 p-4 rounded-2xl border border-green-100 space-y-3"
        >
          {/* Image Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-32 bg-white border-2 border-dashed border-green-200 rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative hover:bg-green-50/50 transition-colors"
          >
            {imagePreview ? (
              // Use standard img tag if it's a URL, or render emoji if it's from the seed
              imagePreview.startsWith("http") ||
              imagePreview.startsWith("data:") ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-4xl">{imagePreview}</div>
              )
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-green-300 mb-2" />
                <span className="text-xs font-medium text-green-700">
                  Tap to upload photo
                </span>
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
            placeholder="Product Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-2/3 text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white"
            >
              <option value="" disabled>Select Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nameEn || c.name} {c.emoji}</option>
              ))}
            </select>

          </div>

          
          <div className="flex items-center gap-2 mt-2 bg-white p-3 rounded-xl border border-gray-100">
            <input
              type="checkbox"
              id="isAvailable"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="w-4 h-4 text-[#0e783a] bg-gray-100 border-gray-300 rounded focus:ring-[#0e783a]"
            />
            <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700">
              In Stock (Available for purchase)
            </label>
          </div>

          <button type="submit" disabled={actionLoading}
            className="w-full bg-[#0e783a] text-white py-2 rounded-xl font-medium flex justify-center flex-col items-center gap-1"
          >
            {actionLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {uploadStatus && (
                  <span className="text-[10px] opacity-80">{uploadStatus}</span>
                )}
              </>
            ) : editingId ? (
              "Update Item"
            ) : (
              "Add Item"
            )}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden text-2xl border border-gray-100">
              {product.imageUrl?.startsWith("http") ||
              product.imageUrl?.startsWith("data:") ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                product.image ||
                product.imageUrl || (
                  <Package className="w-6 h-6 text-gray-400" />
                )
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {product.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[#0e783a] font-bold text-xs">
                  ₹{product.price}
                </span>
                <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                  {categories.find(c => c.id === (product.categoryId || product.category))?.nameEn || product.category}
                </span>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => handleEdit(product)}
                className="p-2 text-gray-400 hover:text-[#0e783a] bg-gray-50 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteProduct(product.id)}
                className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No items in inventory.
          </div>
        )}
      </div>
    </div>
  );
}
