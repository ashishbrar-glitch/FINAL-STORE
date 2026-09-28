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
  Download,
  Upload,
  Search,
  Sparkles,
} from "lucide-react";
import imageCompression from "browser-image-compression";

import { processImageToBase64, safeValidateProductImageSize } from '../../lib/imageProcessor';

import { BackgroundRemovalPOC } from "./BackgroundRemovalPOC";
import { AdminProductModal } from "./AdminProductModal";

// Helper to determine the creation or update timestamp in milliseconds
const getProductTime = (p: any): number => {
  if (p?.createdAt) {
    if (typeof p.createdAt.toMillis === 'function') return p.createdAt.toMillis();
    if (typeof p.createdAt.toDate === 'function') return p.createdAt.toDate().getTime();
    if (p.createdAt instanceof Date) return p.createdAt.getTime();
    if (typeof p.createdAt === 'number') return p.createdAt;
    if (typeof p.createdAt === 'string') {
      const parsed = Date.parse(p.createdAt);
      if (!isNaN(parsed)) return parsed;
    }
    if (p.createdAt?.seconds) return p.createdAt.seconds * 1000;
  }
  if (p?.updatedAt) {
    if (typeof p.updatedAt.toMillis === 'function') return p.updatedAt.toMillis();
    if (typeof p.updatedAt.toDate === 'function') return p.updatedAt.toDate().getTime();
    if (p.updatedAt instanceof Date) return p.updatedAt.getTime();
    if (typeof p.updatedAt === 'number') return p.updatedAt;
    if (typeof p.updatedAt === 'string') {
      const parsed = Date.parse(p.updatedAt);
      if (!isNaN(parsed)) return parsed;
    }
    if (p.updatedAt?.seconds) return p.updatedAt.seconds * 1000;
  }
  const numId = Number(p?.id);
  if (!isNaN(numId) && numId > 1500000000000) {
    return numId;
  }
  return 0;
};

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

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState("all");

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
      // Newly added items appear on top (descending order by timestamp)
      prodList.sort((a: any, b: any) => getProductTime(b) - getProductTime(a));
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

  const handleExportCSV = () => {
    if (products.length === 0) return;
    const headers = ["id", "name", "nameHi", "price", "mrp", "category", "categoryId", "isAvailable", "isBestseller", "imageUrl", "unit"];
    const rows = products.map(p => {
      return headers.map(h => {
        let val = p[h] ?? "";
        if (typeof val === "string") val = val.replace(/"/g, '""');
        return `"${val}"`;
      }).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!window.confirm("Are you sure you want to import this CSV? This will OVERWRITE existing products with matching IDs and add new ones.")) {
      e.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split("\n").filter(l => l.trim().length > 0);
      if (lines.length < 2) throw new Error("CSV has no data");
      
      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      let successCount = 0;

      for (let i = 1; i < lines.length; i++) {
        // Simple CSV parser that respects quotes
        const line = lines[i];
        let values: string[] = [];
        let inQuotes = false;
        let curr = "";
        for (let char of line) {
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) { values.push(curr); curr = ""; }
          else curr += char;
        }
        values.push(curr);

        const data: any = {};
        headers.forEach((h, idx) => {
          let val = values[idx]?.replace(/^"|"$/g, "").replace(/""/g, '"');
          if (val === "true") data[h] = true;
          else if (val === "false") data[h] = false;
          else if (h === "price" || h === "mrp") data[h] = val ? Number(val) : 0;
          else data[h] = val;
        });

        if (!data.name) continue;

        const docRef = data.id ? doc(collection(db, "products"), data.id) : doc(collection(db, "products"));
        await setDoc(docRef, { ...data, updatedAt: new Date() }, { merge: true });
        successCount++;
      }
      alert(`Successfully imported/updated ${successCount} products!`);
    } catch (err) {
      console.error(err);
      alert("Failed to parse CSV file.");
    } finally {
      e.target.value = '';
    }
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
          imageUrl = await processImageToBase64(imageFile, {
            maxDimension: 600,
            targetMaxBytes: 250 * 1024,
            preserveTransparency: true
          });
        } catch (error: any) {
          throw new Error("Failed to process image: " + error.message);
        }
      }

      if (imageUrl && imageUrl.startsWith('data:image')) {
        imageUrl = await safeValidateProductImageSize(imageUrl);
      }

      setUploadStatus("Saving product details...");
      const prodId = editingId || Date.now().toString();
      const existingProduct = products.find(p => p.id === editingId);
      const isCreate = !editingId;
      const nextVersion = isCreate ? 1 : ((Number(existingProduct?.productVersion) || 0) + 1);
      const finalCategoryId = category || (categories[0]?.id) || 'gro';

      const dataToSave: any = {
        name: name.trim(),
        price: Number(price),
        category: finalCategoryId,
        categoryId: finalCategoryId,
        imageUrl: imageUrl,
        isActive: true,
        isAvailable: isAvailable,
        productVersion: nextVersion,
        updatedAt: new Date(),
      };
      if (isCreate) {
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

  const isRecentlyAdded = (p: any): boolean => {
    const t = getProductTime(p);
    if (!t) return false;
    return Date.now() - t < 24 * 60 * 60 * 1000;
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCatFilter !== "all" && (p.categoryId || p.category) !== selectedCatFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (p.name || "").toLowerCase().includes(q) || (p.nameHi || "").toLowerCase().includes(q);
    const catObj = categories.find((c) => c.id === (p.categoryId || p.category));
    const catMatch = (catObj?.nameEn || catObj?.name || p.category || "").toLowerCase().includes(q);
    return nameMatch || catMatch;
  });

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0e783a]" />
      </div>
    );

  return (
    <div id="inventory-section" className="space-y-4 scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
          Inventory
          <span className="text-xs bg-emerald-50 text-[#0e783a] border border-emerald-100 font-semibold px-2 py-0.5 rounded-full">
            {filteredProducts.length} items
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-sm bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg font-medium cursor-pointer hover:bg-gray-100 transition-colors">
            <Upload className="w-4 h-4" />
            Import CSV
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 text-sm bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => { setModalProduct(null); setIsModalOpen(true); }}
            className="flex items-center gap-1 text-sm bg-[#0e783a] text-white px-3.5 py-1.5 rounded-lg font-medium hover:bg-[#0c6631] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0e783a]/20 focus:border-[#0e783a] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {categories.length > 0 && (
          <select
            value={selectedCatFilter}
            onChange={(e) => setSelectedCatFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl text-sm px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0e783a]/20 focus:border-[#0e783a]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn || c.name}
              </option>
            ))}
          </select>
        )}
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
        {filteredProducts.map((product) => {
          const isNew = isRecentlyAdded(product);
          return (
            <div
              key={product.id}
              className={`bg-white p-3 rounded-2xl border shadow-sm flex items-center gap-3 transition-all ${
                isNew ? "border-emerald-200 bg-emerald-50/15" : "border-gray-100"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden text-2xl border border-gray-100">
                {product.imageUrl?.startsWith("http") ||
                product.imageUrl?.startsWith("data:") ? (
                  <img
                    src={product.imageUrl || undefined}
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
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {product.name}
                  </p>
                  {isNew && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-1.5 py-0.2 rounded-md shrink-0 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      New
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[#0e783a] font-bold text-xs">
                    ₹{product.price}
                  </span>
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                    {categories.find(c => c.id === (product.categoryId || product.category))?.nameEn || product.category}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => handleEdit(product)}
                  className="p-2 text-gray-400 hover:text-[#0e783a] bg-gray-50 hover:bg-green-50 rounded-lg transition-colors"
                  title="Edit Product"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500 text-sm bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            {searchQuery ? `No items found matching "${searchQuery}".` : "No items in inventory."}
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
