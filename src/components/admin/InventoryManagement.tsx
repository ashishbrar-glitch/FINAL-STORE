import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "../../lib/firebase";
import {
  collection,
  getDocs,
  getDocsFromCache,
  doc,
  setDoc,
  deleteDoc, onSnapshot,
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

import { BackgroundRemovalPOC } from "./BackgroundRemovalPOC";
import { AdminProductModal } from "./AdminProductModal";

export function InventoryManagement() {
  const [showBGPOC, setShowBGPOC] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [modalProduct, setModalProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    const processCategories = (snapshot: any) => {
      const catList = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setCategories(catList);
      if (catList.length > 0 && !category) {
        setCategory(catList[0].id);
      }
    };

    const unsubCats = onSnapshot(query(collection(db, "categories")), (snapshot) => {
      processCategories(snapshot);
    }, (err: any) => {
      if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Fetch categories error:', err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        getDocsFromCache(query(collection(db, "categories"))).then((snapshot) => {
          if (snapshot.empty) setError("Firebase Database quota exceeded for today. Please try again tomorrow.");
          else processCategories(snapshot);
        }).catch((e) => {
          console.error(e);
          setError("Database quota exceeded and no local cache available.");
        });
      } else {
        setError(err.message);
      }
    });

    const processProducts = (snapshot: any) => {
      const prodList = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setProducts(prodList);
      setLoading(false);
    };

    const unsubProds = onSnapshot(query(collection(db, "products")), (snapshot) => {
      processProducts(snapshot);
    }, (err: any) => {
      if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Fetch products error:', err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        getDocsFromCache(query(collection(db, "products")))
          .then(processProducts)
          .catch(e => { console.error(e); setLoading(false); });
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubCats();
      unsubProds();
    };
  }, []);

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
    setModalProduct(product);
    setIsModalOpen(true);
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
      
      resetForm();
    } catch (err: any) {
      setActionError("Error saving: " + err.message);
    } finally {
      setActionLoading(false);
      setUploadStatus("");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setDeleteConfirmId(id);
    return;
  };

  const executeDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
      
    } catch (err: any) {
      setActionError("Error deleting: " + err.message);
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
        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">Inventory</h3>
        <button
          onClick={() => { setModalProduct(null); setIsModalOpen(true); }}
          className="flex items-center gap-1 text-sm bg-green-50 text-[#0e783a] px-3 py-1.5 rounded-lg font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {isModalOpen && (
        <AdminProductModal 
          product={modalProduct}
          categories={categories}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => setIsModalOpen(false)}
        />
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
    
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
            <p className="text-gray-600">Are you sure you want to delete this product?</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">Cancel</button>
              <button onClick={() => { executeDelete(deleteConfirmId); setDeleteConfirmId(null); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700">Delete</button>

      
  </div>

      
  </div>

      
  </div>
      )}
      {actionError && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-600 text-white p-4 rounded-xl shadow-lg flex justify-between items-center z-50">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="p-1 hover:bg-red-700 rounded">
            <X className="w-5 h-5" />
          </button>

      
  </div>
      )}
  
    
      {showBGPOC && <BackgroundRemovalPOC onClose={() => setShowBGPOC(false)} />}
  </div>
  );
}
