import { normalizeStr } from './lib/search/normalize';
import { Product, CartItem, Category, ProductRecommendation } from './types';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Fuse from "fuse.js";
import {
  PhoneCall,
  MapPin,
  ShoppingCart,
  Download,
  BookOpen,
  ArrowLeft,
  Plus,
  Minus,
  Send,
  CheckCircle2,
  ChevronRight,
  User,
  Search,
  Loader2,
  X,
  Wifi,
  WifiOff,
  Users,
  Zap,
  Wind,
  Droplets, Star,
  ShieldCheck,
  Shield,
  Flame,
  Grid,
  Timer,
  ArrowRight,
  Edit2,
  Settings,
  Store,
  Truck,
  BadgeCheck,
  Tag,
  Sparkles,
} from "lucide-react";
import { AdminLogin } from "./components/AdminLogin";
import { AdminDashboard } from "./components/AdminDashboard";
import ScooterRider from "./components/ScooterRider";
import Confetti from "react-confetti";
import { doc, getDoc, collection, getDocs, getDocsFromCache, setDoc, updateDoc, query, limit, startAfter, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { AdminCategoryModal } from "./components/admin/AdminCategoryModal";
import { AdminProductModal } from "./components/admin/AdminProductModal";

const FunnySearchSkeleton = () => {
  const loadingMessages = [
    "AI is running down the aisles... 🏃💨",
    "Asking the store manager... 👨‍💼",
    "Looking behind the counter... 🔍",
    "Checking the godown... 📦",
    "Scanning the shelves... 🧐",
  ];
  const [msgIdx, React_useState] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      React_useState(i => (i + 1) % loadingMessages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex flex-col items-center pb-24 pt-4">
      <div className="py-4 px-4 text-center mb-4">
        <div className="inline-flex items-center gap-2 bg-[#0e783a]/10 px-4 py-2 rounded-full text-[#0e783a] font-bold text-xs tracking-wide">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span className="min-w-[200px]">{loadingMessages[msgIdx]}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full px-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col gap-2 relative">
            <div className="w-full aspect-square bg-gray-200 rounded-xl animate-pulse flex flex-col items-center justify-center overflow-hidden">
               <span className="text-4xl opacity-20 animate-bounce" style={{ animationDelay: `${i * 150}ms` }}>
                 {['🛒', '🤔', '📦', '🔍', '🏃', '💡'][i-1]}
               </span>
            </div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mt-1"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
            <div className="absolute top-2 right-2 w-6 h-6 bg-gray-300 rounded-full animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- TYPES ---
type View =
  | "home"
  | "order"
  | "cart"
  | "library"
  | "library-summary"
  | "admin-login"
  | "admin-dashboard";


const PHONE_NUMBER = "918601866018";

// Generate seats
const GIRLS_SEATS = Array.from({ length: 33 }, (_, i) => `G${i + 1}`);
const BOYS_SEATS = Array.from({ length: 38 }, (_, i) => `B${i + 34}`);

const randomOffsets: Record<string, number> = {};
function getSortWeight(id: string) {
  if (randomOffsets[id] === undefined) {
    randomOffsets[id] = Math.random();
  }
  return randomOffsets[id];
}





const RECOMMENDATION_WEIGHTS = {
  complementary: 100,
  similar: 50,
  priority: 0.2,
  categoryFit: 10,
  bestsellerBoost: 5,
  priceFit: 5,
  confidence: 2
};

function scoreRecommendation(
  candidate: Product,
  sourceProduct: Product,
  rel: ProductRecommendation
): number {
  let score = 0;
  
  if (rel.type === "complementary") score += RECOMMENDATION_WEIGHTS.complementary;
  else if (rel.type === "similar") score += RECOMMENDATION_WEIGHTS.similar;
  
  score += (rel.categoryFit ?? (candidate.category === sourceProduct.category ? 1 : 0)) * RECOMMENDATION_WEIGHTS.categoryFit;
  score += (rel.priority || 0) * RECOMMENDATION_WEIGHTS.priority;
  score += (rel.bestsellerBoost ?? (candidate.isBestseller ? 1 : 0)) * RECOMMENDATION_WEIGHTS.bestsellerBoost;
  
  const defaultPriceFit = sourceProduct.price > 0 && candidate.price > 0
    ? 1 - Math.min((Math.max(sourceProduct.price, candidate.price) / Math.min(sourceProduct.price, candidate.price) - 1), 1)
    : 0.5;
  score += (rel.priceFit ?? defaultPriceFit) * RECOMMENDATION_WEIGHTS.priceFit;
  
  score += (rel.confidence || 0) * RECOMMENDATION_WEIGHTS.confidence;
  
  return score;
}

function RecommendationRow({
  sourceProduct,
  products,
  onClose,
  onAddToCart
}: {
  sourceProduct: Product;
  products: Product[];
  onClose: () => void;
  onAddToCart: (id: string, delta: number) => void;
}) {
  const [candidates, setCandidates] = useState<{ product: Product, rel: ProductRecommendation }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "productRecommendations"),
      where("sourceProductId", "==", sourceProduct.id),
      where("status", "==", "approved")
    );
    
    const unsub = onSnapshot(q, (snap) => {
       const bestCandidates = new Map<string, { product: Product, rel: ProductRecommendation }>();
       
       snap.forEach(docSnap => {
          const rel = docSnap.data() as ProductRecommendation;
          
          const p = products.find(prod => prod.id === rel.targetProductId);
          if (p && p.isActive && p.isAvailable) {
             const currentScore = scoreRecommendation(p, sourceProduct, rel);
             const existing = bestCandidates.get(rel.targetProductId);
             if (!existing || currentScore > scoreRecommendation(existing.product, sourceProduct, existing.rel)) {
                bestCandidates.set(rel.targetProductId, { product: p, rel });
             }
          }
       });
       
       const results = Array.from(bestCandidates.values());
       
       // Rank candidates using the score function
       results.sort((a, b) => scoreRecommendation(b.product, sourceProduct, b.rel) - scoreRecommendation(a.product, sourceProduct, a.rel));
       
       setCandidates(results);
       setLoading(false);
    });
    
    return () => unsub();
  }, [sourceProduct.id, products]);

  if (loading) return null;
  if (candidates.length === 0) return null;

  return (
    <div className="w-full mt-6 mb-8 px-2">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#0e783a]" /> Goes well with
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-1.5 rounded-full transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex overflow-x-auto gap-4 pb-4 px-2 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {candidates.map(({ product }) => (
          <div key={product.id} className="snap-start shrink-0 w-40 bg-white border border-gray-100 rounded-[16px] shadow-sm flex flex-col p-2 relative">
            <div className="w-full aspect-square bg-[#F4F6F8] rounded-[12px] mb-2 flex items-center justify-center overflow-hidden">
               {product.image ? (
                 <img src={product.image || undefined} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" />
               ) : (
                 <span className="text-4xl">🛒</span>
               )}
            </div>
            <div className="flex flex-col flex-1">
              <h4 className="text-xs font-bold text-gray-800 line-clamp-2 mb-1">{product.name}</h4>
              <span className="text-xs text-gray-500 mb-2">{product.unit || '1 unit'}</span>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">₹{product.price}</span>
                <button
                  onClick={() => onAddToCart(product.id, 1)}
                  className="w-8 h-8 rounded-full bg-[#0c831f] text-white flex items-center justify-center shadow-sm hover:bg-[#0b731b] active:scale-95 transition-transform"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



const SUGGESTED_BUNDLES = [
  {
    id: "bundle-1",
    name: "Late Night Snack",
    description: "Perfect for cravings",
    triggerKeywords: ["maggi", "noodle", "pasta", "yippee", "wai wai"],
    bundleKeywords: ["thumbs up", "lays", "pepsi", "coke", "kurkure", "doritos", "bingo"],
    bundleEmojis: "🍿+🥤"
  },
  {
    id: "bundle-2",
    name: "Morning Chai",
    description: "Start your day right",
    triggerKeywords: ["tea", "chai", "coffee", "milk", "tata tea", "red label"],
    bundleKeywords: ["biscuit", "rusk", "parle", "good day", "britannia", "namkeen", "cookies"],
    bundleEmojis: "☕+🍪"
  },
  {
    id: "bundle-3",
    name: "Party Pack",
    description: "Get the party started",
    triggerKeywords: ["pizza", "burger", "party", "cold drink", "thumbs up", "sprite", "coke", "pepsi"],
    bundleKeywords: ["lays", "kurkure", "doritos", "pringles", "bhujia", "mixture", "chips"],
    bundleEmojis: "🥤+🎉"
  },
  {
    id: "bundle-4",
    name: "Healthy Breakfast",
    description: "A nutritious start",
    triggerKeywords: ["oats", "corn flakes", "muesli", "kellogg", "saffola", "cornflakes"],
    bundleKeywords: ["milk", "amul", "mother dairy", "honey", "almond", "peanut butter", "bournvita"],
    bundleEmojis: "🥣+🥛"
  }
];

function MainContent() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentView, setCurrentView] = useState<View>("home");
  const [products, setProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [lastProductDoc, setLastProductDoc] = useState<any>(null);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [pastPurchasedIds, setPastPurchasedIds] = useState<string[]>([]);
  const [showBuyAgain, setShowBuyAgain] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bcn_past_purchases");
      if (saved) {
        setPastPurchasedIds(JSON.parse(saved));
      }
    } catch(e) {}
  }, []);
  const [learnedSearches, setLearnedSearches] = useState<Record<string, {ids: string[], terms: string[]}>>({});
  
  const [lastSyncHash, setLastSyncHash] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ["All", ...cats];
  }, [products]);

  

  // Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [crossSellSource, setCrossSellSource] = useState<Product | null>(null);



  // Library State
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [activeLibrarySection, setActiveLibrarySection] = useState<
    "girls" | "boys"
  >("girls");
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Admin State
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const isAdmin = adminRole === 'admin' || adminRole === 'superadmin';

  // Modals
  const [editingCategory, setEditingCategory] = useState<Category | null | "new">(null);
  const [editingProduct, setEditingProduct] = useState<Product | null | "new">(null);

  // Db Categories
  const [dbCategories, setDbCategories] = useState<Category[]>([]);

  // Suggested Bundle Logic
  const suggestedBundle = useMemo(() => {
    if (cart.length === 0) return null;
    
    const cartKeywords = cart.map(item => {
      const p = products.find(prod => prod.id === item.id);
      return p ? p.name.toLowerCase() : "";
    });
    
    const matchedBundleDef = SUGGESTED_BUNDLES.find(bundle => 
      bundle.triggerKeywords.some(tk => cartKeywords.some(ck => ck.includes(tk)))
    );
    
    if (!matchedBundleDef) return null;
    
    const bundleProducts = [];
    const addedCategories = new Set();
    
    for (const bk of matchedBundleDef.bundleKeywords) {
      const prod = products.find(p => 
        p.name.toLowerCase().includes(bk) && 
        p.isAvailable !== false &&
        !cart.some(c => c.id === p.id) &&
        !addedCategories.has(p.category)
      );
      
      if (prod) {
        bundleProducts.push(prod);
        addedCategories.add(prod.category);
      }
      
      if (bundleProducts.length >= 2) break;
    }
    
    if (bundleProducts.length > 0) {
      return {
        ...matchedBundleDef,
        products: bundleProducts
      };
    }
    
    return null;
  }, [cart, products]);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
      });
    } else {
      setShowInstallModal(true);
    }
  };

  // Restore admin session from localStorage and monitor Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAdminRole(null);
        if (currentView === "admin-dashboard") {
          setCurrentView("admin-login");
        }
      } else {
        try {
          const d = await getDoc(doc(db, "users", user.uid));
          if (!d.exists()) {
            setAdminRole(null);
                if (currentView === "admin-dashboard") {
              setCurrentView("admin-login");
            }
          } else {
            const role = d.data().role;
            setAdminRole(role);
          }
        } catch(e) {
          console.error("Auth sync error:", e);
        }
      }
    });
    return () => unsub();
  }, [currentView]);

  useEffect(() => {
    let currentCatSnap: any = null;
    let currentProdSnap: any = null;

    const processData = () => {
      if (!currentCatSnap || !currentProdSnap) return;
      let catList = currentCatSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Category));
      catList.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
      
      if (catList.length === 0) {
        catList = [
          { id: "veg", nameEn: "Vegetables", nameHi: "सब्ज़ियाँ", emoji: "🥦", displayOrder: 1, isActive: true },
          { id: "gro", nameEn: "Grocery", nameHi: "किराना", emoji: "🛍️", displayOrder: 2, isActive: true },
          { id: "sna", nameEn: "Snacks", nameHi: "नाश्ते", emoji: "🍪", displayOrder: 3, isActive: true },
          { id: "per", nameEn: "Personal Care", nameHi: "पर्सनल केयर", emoji: "🧴", displayOrder: 4, isActive: true },
        ];
      }
      setDbCategories(catList);

      if (currentProdSnap.docs.length > 0) {
        setLastProductDoc(currentProdSnap.docs[currentProdSnap.docs.length - 1]);
      }
      setHasMoreProducts(currentProdSnap.docs.length === 40);
      const prodList = currentProdSnap.docs.map((doc: any, idx: number) => {
        const data = doc.data();
        // Migrate legacy aliases if present
        let manualSearchAliases = data.manualSearchAliases || [];
        if (data.searchAliases && Array.isArray(data.searchAliases)) {
          const newAliases = data.searchAliases.filter((a: string) => !manualSearchAliases.includes(a));
          manualSearchAliases = [...manualSearchAliases, ...newAliases];
        }

        return {
          id: doc.id,
          name: data.name,
          nameEn: data.nameEn || '',
          nameHi: data.nameHi || '',
          brand: data.brand || '',
          category: catList.find((c: any) => c.id === (data.categoryId || data.category))?.nameEn || data.category || data.categoryId || "Uncategorized",
          categoryId: data.categoryId || '',
          subcategory: data.subcategory || '',
          variant: data.variant || '',
          unit: data.unit || '',
          attributes: data.attributes || {},
          price: data.price,
          mrp: data.mrp,
          image: data.imageUrl || data.image,
          isActive: data.isActive ?? true,
          isAvailable: data.isAvailable ?? true,
          isBestseller: data.isBestseller ?? (idx === 0 || idx === 3),
          manualSearchAliases,
          aiSearchAliases: data.aiSearchAliases || [],
          searchStatus: data.searchStatus || 'pending',
          searchError: data.searchError || null,
          searchErrorAt: data.searchErrorAt || null,
          processingAttempts: data.processingAttempts || 0,
          processingStartedAt: data.processingStartedAt || null,
          processingJobId: data.processingJobId || null,
          lastProcessedAt: data.lastProcessedAt || null,
          productVersion: data.productVersion || 0,
        };
      }) as Product[];
      // Sort items randomly but stably per page load
      prodList.sort((a, b) => getSortWeight(a.id) - getSortWeight(b.id));
      
      setProducts(prodList);
      setDisplayedProducts(prodList);
    };

    const handleQuotaFallback = async () => {
      console.log("Attempting to load from local cache...");
      try {
        currentCatSnap = await getDocsFromCache(collection(db, "categories"));
        currentProdSnap = await getDocsFromCache(query(collection(db, "products")));
        if (currentCatSnap.empty && currentProdSnap.empty) {
          throw new Error("Cache is empty");
        }
        processData();
      } catch (cacheErr) {
        console.warn("Cache fallback failed:", cacheErr);
        setDbCategories([
          { id: "gro", nameEn: "Grocery", nameHi: "किराना", emoji: "🛍️", displayOrder: 1, isActive: true }
        ]);
        setDisplayedProducts([
          { id: "1", name: "PATAKA TEA 250GM (Offline Mode)", price: 100, category: "Grocery", image: "https://m.media-amazon.com/images/I/71R2nJgW-uL._SL1000_.jpg", isActive: true, isAvailable: true, isBestseller: true }
        ]);
      }
    };

    const unsubCats = onSnapshot(collection(db, "categories"), (snap) => {
      currentCatSnap = snap;
      processData();
    }, (err: any) => {
      if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Firebase fetch error:', err);
      if (err.code === 'permission-denied') { alert('Please refresh the page to load the new database configuration.'); }
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        handleQuotaFallback();
      }
    });

    const unsubProds = onSnapshot(query(collection(db, "products")), (snap) => {
      currentProdSnap = snap;
      processData();
    }, (err: any) => {
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        handleQuotaFallback();
      }
    });

    const unsubLearnings = onSnapshot(collection(db, "searchMappings"), (snap) => {
      const mappings: Record<string, {ids: string[], terms: string[]}> = {};
      snap.forEach(doc => {
        const data = doc.data();
        if (data.query) {
          mappings[data.query.toLowerCase()] = { ids: data.ids || [], terms: data.terms || [] };
        }
      });
      setLearnedSearches(mappings);
    }, (err: any) => {
      console.warn("Learnings fetch error:", err);
    });

            return () => {
      unsubCats();
      unsubProds();
      unsubLearnings();
    };
  }, []);

  

  const loadMoreProducts = async () => { return; /* Disabled to load all */
    if (!lastProductDoc) return;
    
    const processSnapshot = (snapshot: any) => {
      const newProds = snapshot.docs.map((doc: any, idx: number) => {
        const data = doc.data();
        let manualSearchAliases = data.manualSearchAliases || [];
        if (data.searchAliases && Array.isArray(data.searchAliases)) {
          const newAliases = data.searchAliases.filter((a: string) => !manualSearchAliases.includes(a));
          manualSearchAliases = [...manualSearchAliases, ...newAliases];
        }

        return {
          id: doc.id,
          name: data.name,
          nameEn: data.nameEn || '',
          nameHi: data.nameHi || '',
          brand: data.brand || '',
          category: dbCategories.find((c: any) => c.id === (data.categoryId || data.category))?.nameEn || data.category || data.categoryId || "Uncategorized",
          categoryId: data.categoryId || '',
          subcategory: data.subcategory || '',
          variant: data.variant || '',
          unit: data.unit || '',
          attributes: data.attributes || {},
          price: data.price,
          mrp: data.mrp,
          image: data.imageUrl || data.image,
          isActive: data.isActive ?? true,
          isAvailable: data.isAvailable ?? true,
          isBestseller: data.isBestseller ?? false,
          manualSearchAliases,
          aiSearchAliases: data.aiSearchAliases || [],
          searchStatus: data.searchStatus || 'pending',
          searchError: data.searchError || null,
          searchErrorAt: data.searchErrorAt || null,
          processingAttempts: data.processingAttempts || 0,
          processingStartedAt: data.processingStartedAt || null,
          processingJobId: data.processingJobId || null,
          lastProcessedAt: data.lastProcessedAt || null,
          productVersion: data.productVersion || 0,
        };
      }) as Product[];
      
      setProducts(prev => [...prev, ...newProds]);
      
      if (snapshot.docs.length > 0) {
        setLastProductDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMoreProducts(snapshot.docs.length === 40);
    };

    try {
      const q = query(collection(db, "products"), startAfter(lastProductDoc), limit(40));
      const snapshot = await getDocs(q);
      processSnapshot(snapshot);
    } catch (err: any) {
      if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Load more error:', err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        try {
          const q = query(collection(db, "products"), startAfter(lastProductDoc), limit(40));
          const snapshot = await getDocsFromCache(q);
          processSnapshot(snapshot);
        } catch (cacheErr) {
          console.warn("Cache fallback failed for load more:", cacheErr);
        }
      }
    }
  };

  // Fetch real seat allocations
  const [occupiedSeats, setOccupiedSeats] = useState<Set<string>>(new Set());
  useEffect(() => {
    let unsub = () => {};
    // Only fetch seats if we are viewing the library to save quota!
    if (currentView === "library" || currentView === "library-summary") {
      const processSeats = (snapshot: any) => {
        const occupied = new Set<string>();
        snapshot.forEach((doc: any) => {
          if (doc.data().isOccupied) {
            occupied.add(doc.id);
          }
        });
        setOccupiedSeats(occupied);
      };

      unsub = onSnapshot(collection(db, "seatAvailability"), (snapshot) => {
        processSeats(snapshot);
      }, (err: any) => {
        if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Seat fetch error:', err);
        if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
          getDocsFromCache(collection(db, "seatAvailability"))
            .then(processSeats)
            .catch(cacheErr => console.warn("Cache fallback for seats failed:", cacheErr));
        }
      });
    }
    
    return () => unsub();
  }, [currentView]); // Re-fetch seats when opening the library

  
  // Handle Search & Filter

  // 1. Memoize active catalog and Fuse index
  const activeProducts = useMemo(() => {
    return products.filter(p => p.isActive !== false && p.isAvailable !== false);
  }, [products]);

  const fuseActiveProducts = useMemo(() => {
    return activeProducts.map(p => {
      let attrValues = [];
      if (p.attributes) {
        Object.entries(p.attributes).forEach(([k, v]) => {
           if (k) attrValues.push(String(k));
           if (v) attrValues.push(String(v));
        });
      }
      return {
        item: p,
        _searchStr: [
          p.name, p.nameEn, p.nameHi, p.brand, p.category, p.subcategory, p.variant, p.unit,
          ...(p.manualSearchAliases || []),
          ...(p.aiSearchAliases || []),
          ...attrValues
        ].filter(Boolean).join(" ")
      };
    });
  }, [activeProducts]);

  const fuse = useMemo(() => {
    return new Fuse(fuseActiveProducts, {
      keys: ['_searchStr'],
      threshold: 0.4,
      ignoreLocation: true,
      ignoreFieldNorm: true,
      minMatchCharLength: 2,
      includeScore: true
    });
  }, [fuseActiveProducts]);



  useEffect(() => {
    const lowerQuery = normalizeStr(searchQuery);

    let categoryMatches = activeProducts;
    if (selectedCategory !== "All") {
      categoryMatches = activeProducts.filter(p => p.category === selectedCategory);
    }

    if (!lowerQuery) {
      setDisplayedProducts(categoryMatches);
      setIsSearching(false);
      return;
    }

    // 1. Gather candidates & Fuzzy match against category filter
    const fuseResults = fuse.search(lowerQuery).filter(r => 
      selectedCategory === "All" || r.item.item.category === selectedCategory
    ).map(r => ({ ...r, item: r.item.item }));
    
    // 2. Exact matches
    const exactMatches = categoryMatches.filter(p => {
       const n1 = normalizeStr(p.name);
       const n2 = normalizeStr(p.nameEn);
       const n3 = normalizeStr(p.nameHi);
       const aliases = [...(p.manualSearchAliases || []), ...(p.aiSearchAliases || [])].map(normalizeStr);
       
       return n1.includes(lowerQuery) || n2.includes(lowerQuery) || n3.includes(lowerQuery) || aliases.some(a => a.includes(lowerQuery));
    });

    // 3. Learned Matches (Retrieval signal only)
    const learnedIds = new Set<string>();
    if (learnedSearches[lowerQuery]) {
       learnedSearches[lowerQuery].ids.forEach((id: string) => learnedIds.add(id));
    } else {
       Object.entries(learnedSearches).forEach(([learnedQuery, data]: [string, any]) => {
         if (lowerQuery.length >= 3 && (String(learnedQuery).includes(lowerQuery) || data.terms.some((t: string) => normalizeStr(t).includes(lowerQuery)))) {
           data.ids.forEach((id: string) => learnedIds.add(id));
         }
       });
    }
    
    const learnedMatches = categoryMatches.filter(p => learnedIds.has(p.id));

    // Combine and Rank
    // Rules: Exact > Fuzzy > Learned > Bestseller
    const candidateMap = new Map<string, { product: Product, score: number }>();
    
    const addCandidate = (p: Product, baseScore: number) => {
       // Hard filter just in case, though activeProducts already handles this
       if (p.isActive === false || p.isAvailable === false) return; 
       
       let finalScore = baseScore;
       if (p.isBestseller) finalScore += 0.05; // Tiny tie-breaker only
       
       const existing = candidateMap.get(p.id);
       if (!existing || existing.score < finalScore) {
          candidateMap.set(p.id, { product: p, score: finalScore });
       }
    };

    exactMatches.forEach(p => addCandidate(p, 10)); // Highest
    fuseResults.forEach(r => addCandidate(r.item, 10 - (r.score || 0) * 5)); // Higher fuse score is worse (0 is perfect)
    learnedMatches.forEach(p => addCandidate(p, 3)); // Moderate signal

    const rankedResults = Array.from(candidateMap.values())
      .sort((a, b) => b.score - a.score)
      .map(c => c.product);

    setDisplayedProducts(rankedResults);
    setIsSearching(false);
  }, [searchQuery, activeProducts, selectedCategory, fuse, learnedSearches]);


  // --- ACTIONS ---
  const updateQuantity = (id: string, delta: number) => {
    const product = products.find(p => p.id === id);
    const existing = cart.find((item) => item.id === id);
    
    // Trigger cross-sell if it's a new item added to the cart
    if (delta > 0 && !existing && product) {
      setCrossSellSource(product);
    } else if (delta < 0 && crossSellSource && crossSellSource.id === id) {
      if (existing && existing.quantity + delta <= 0) {
        setCrossSellSource(null);
      }
    }

    setCart((prev) => {
      if (product && product.isAvailable === false && delta > 0) {
        return prev; // Block adding out of stock items
      }
      const existingInPrev = prev.find((item) => item.id === id);
      if (existingInPrev) {
        const newQty = existingInPrev.quantity + delta;
        if (newQty <= 0) return prev.filter((item) => item.id !== id);
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: newQty } : item,
        );
      } else if (delta > 0) {
        return [...prev, { id, quantity: delta }];
      }
      return prev;
    });
  };

  const getQuantity = (id: string) =>
    cart.find((item) => item.id === id)?.quantity || 0;

  const itemsTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const product = products.find((p) => p.id === item.id);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  }, [cart, products]);

  const deliveryFee = itemsTotal > 0 && itemsTotal < 250 ? 20 : 0;
  const finalTotal = itemsTotal + deliveryFee;

  const handleSendOrder = () => {
    if (cart.length === 0) return;

    let message = "Hello BCN Store, I would like to place an order:\import { normalizeStr } from './lib/search/normalize';\nn";
    try {
      const existingStr = localStorage.getItem("bcn_past_purchases");
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const newIds = cart.map((item) => item.id);
      const combined = [...new Set([...newIds, ...existing])];
      localStorage.setItem("bcn_past_purchases", JSON.stringify(combined));
      setPastPurchasedIds(combined);
    } catch(e) {}
    cart.forEach((item) => {
      const product = products.find((p) => p.id === item.id);
      if (product) {
        message += `${item.quantity}x ${product.name} - ₹${product.price * item.quantity}\n`;
      }
    });
    
    if (deliveryFee > 0) {
      message += `Delivery Fee: ₹${deliveryFee}\n`;
    } else {
      message += `Delivery Fee: FREE\n`;
    }
    message += `\nTotal Amount: ₹${finalTotal}\n`;
    message += "\nPlease confirm my order.";

    const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    setCart([]);
    setCurrentView("home");
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 8000);
  };

  const buyAgainProducts = useMemo(() => {
    return products.filter(p => pastPurchasedIds.includes(p.id) && p.isActive !== false);
  }, [products, pastPurchasedIds]);

  const handleSendBooking = () => {
    if (!selectedSeat) return;

    const section = selectedSeat.startsWith("G")
      ? "Girls Section"
      : "Boys Section";
    const message = `Hello BCN Store, I would like to book a seat at the library.\n\nSeat Selected: ${selectedSeat} (${section})\n\nPlease confirm my booking.`;

    const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 8000);
  };

  // --- RENDERERS ---
  const renderHeader = (
    title: string,
    onBack?: () => void,
    rightElement?: React.ReactNode,
    headerColor: string = "bg-[#0e783a]",
    iconTextColor: string = "text-[#0e783a]",
    iconBorderColor: string = "border-[#0e783a]"
  ) => (
    <header className={`sticky top-0 z-50 flex items-center justify-between px-4 h-[51px] ${headerColor} shadow-sm`}>
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 -ml-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
        )}
        {title === "BCN Store" ? (
          <div className="flex items-center gap-2.5">
            <div className="bg-white rounded-xl px-2 py-1 shadow-sm shrink-0">
              <img src="/logo.png" alt="BCN Store Logo" className="h-8 sm:h-9 object-contain" fetchPriority="high" loading="eager" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[9px] font-extrabold text-[#EFC04E] uppercase tracking-widest leading-tight">Available in</span>
              <span className="text-[12px] font-semibold text-white leading-tight flex items-center gap-1">Singhwa Khas & Madanheri <span className="text-[10px]">📍</span></span>
            </div>
          </div>
        ) : (
          <>
            {!onBack && (
              <div className={`flex items-center justify-center w-10 h-10 bg-white ${iconTextColor} rounded-full font-bold text-xl`}>
                B
              </div>
            )}
            <div>
              <h1 className="font-semibold text-white text-lg leading-tight">
                {title}
              </h1>
              {!onBack && (
                <p className="text-sm text-green-100 leading-tight">
                  Singhwa Madanheri
                </p>
              )}
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!isOnline && (
          <div className="flex items-center gap-1 bg-red-500/20 text-red-100 px-2 py-1 rounded-full text-[10px] font-medium border border-red-500/30 whitespace-nowrap" title="Offline - Showing cached data">
            <WifiOff className="w-3 h-3" />
            <span className="hidden sm:inline">Offline</span>
          </div>
        )}
        {rightElement !== undefined ? rightElement : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className={`p-2 ${iconTextColor} bg-white rounded-full hover:bg-gray-50 shadow-sm transition-colors`}
              title="Install App"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentView("cart")}
              className={`relative p-2 ${iconTextColor} bg-white rounded-full hover:bg-gray-50 shadow-sm transition-colors`}
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <motion.span 
                  key={cart.reduce((a, b) => a + b.quantity, 0)}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [1.5, 1] }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className={`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 ${iconBorderColor}`}
                >
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </motion.span>
              )}
            </button>
          </div>
      )}
      </div>
    </header>
  );


  const globalOverlays = (
    <>
      <AnimatePresence>
        
      </AnimatePresence>
      {currentView !== "admin-dashboard" && (
        <a
          href={`https://wa.me/${PHONE_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`fixed right-4 z-50 bg-[#25D366] text-white p-3.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center ${cart.length > 0 && currentView !== 'cart' && currentView !== 'order' ? 'bottom-20' : 'bottom-6'}`}
          title="Chat on WhatsApp"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
          </svg>
        </a>
      )}
    </>
  );

  const adminModals = (
    <>
      {editingCategory && (
        <AdminCategoryModal 
          category={editingCategory === "new" ? null : editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={() => { setEditingCategory(null); }}
        />
      )}
      {editingProduct && (
        <AdminProductModal 
          product={editingProduct === "new" ? null : editingProduct}
          categories={dbCategories}
          onClose={() => setEditingProduct(null)}
          onSaved={() => { setEditingProduct(null); }}
        />
      )}
    </>
  );

  
  const floatingCartFab = (
    <AnimatePresence>
      {cart.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-0 left-0 right-0 z-40 px-3 py-3 pointer-events-none"
        >
          <div className="max-w-md mx-auto relative pointer-events-auto">
            <button
              onClick={() => setCurrentView("cart")}
              className="w-full bg-[#0c831f] text-white rounded-[16px] px-4 py-3 flex items-center justify-between shadow-[0_8px_20px_rgba(12,131,31,0.25)] active:scale-[0.98] transition-transform overflow-hidden relative"
            >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-[100%] animate-[shimmer_2s_infinite]"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-black/10 rounded-[10px] flex items-center justify-center border border-white/10 backdrop-blur-sm shadow-inner">
               <svg className="w-5 h-5 text-white fill-current drop-shadow-sm" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
               </svg>
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="font-bold text-[14px] leading-[1.1] flex items-center gap-1.5">
                {cart.reduce((a, b) => a + b.quantity, 0)} ITEM{cart.reduce((a, b) => a + b.quantity, 0) > 1 ? 'S' : ''}
              </span>
              <motion.div
                key={finalTotal}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="text-[12px] font-medium text-green-100 flex items-center gap-1 whitespace-nowrap"
              >
                ₹{finalTotal} <span className="w-1 h-1 bg-green-200/50 rounded-full inline-block mx-0.5"></span> {itemsTotal < 250 ? `Add ₹${250 - itemsTotal} for FREE Delivery` : 'FREE Delivery applied'}
              </motion.div>
            </div>
          </div>

          <div className="flex items-center gap-1 relative z-10">
            <span className="font-bold text-[14px]">View cart</span>
            <ChevronRight className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>
    </motion.div>
    )}
    </AnimatePresence>
  );

  if (currentView === "order") {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {renderHeader("Order Items", () => setCurrentView("home"))}

        {/* Search Bar & Categories (Sticky) */}
        <div className="sticky top-[51px] z-40 bg-gray-50/95 backdrop-blur-sm pt-4 pb-3 border-b border-gray-200">
          <div className="relative max-w-md mx-auto px-4 mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search 'sugar', 'headache', 'bulb'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e783a]/30 focus:border-[#0e783a] bg-white transition-all text-sm"
              />
              {isSearching ? (
                <Loader2 className="w-5 h-5 absolute left-3.5 top-3.5 text-gray-400 animate-spin" />
              ) : (
                <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-gray-400" />
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 p-1 rounded-full text-gray-400 hover:text-gray-600 bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {isSearching && displayedProducts.length > 0 && (
              <div className="mt-2.5 flex justify-center items-center gap-2 text-[#0e783a] animate-pulse">
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 bg-[#0e783a] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-1 h-1 bg-[#0e783a] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-1 h-1 bg-[#0e783a] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
                <span className="text-[10px] font-bold tracking-[0.1em] uppercase">AI is searching the aisles... 🏃💨</span>
              </div>
            )}
    </div>

          <div className="max-w-md mx-auto px-4 overflow-x-auto no-scrollbar flex items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCategory === cat
                    ? "bg-[#0e783a] text-white shadow-md ring-1 ring-[#0e783a]"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 max-w-md mx-auto">
          
          {showBuyAgain && buyAgainProducts.length > 0 && selectedCategory === "All" && !searchQuery && (
            <div className="pb-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-[15px] font-extrabold text-gray-900 flex items-center gap-2"><Star className="w-4 h-4 text-orange-400 fill-current" /> Buy Again</h2>
                <button onClick={() => setShowBuyAgain(false)} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex overflow-x-auto gap-4 pb-2 snap-x hide-scrollbar -mx-4 px-4">
                {buyAgainProducts.map(product => {
                  const cartItem = cart.find((item) => item.id === product.id);
                  const quantity = cartItem ? cartItem.quantity : 0;
                  return (
                    <div key={product.id} className="min-w-[130px] w-[130px] snap-start">
                      <div className="bg-white p-2 rounded-[16px] shadow-sm hover:shadow-md border border-gray-100 flex flex-col justify-between h-full relative transition-all duration-300">
                        <div className="flex flex-col">
                          <div className={`w-full aspect-square bg-[#F4F6F8] rounded-[12px] mb-2 flex items-center justify-center text-4xl overflow-hidden relative ${product.isAvailable === false ? "grayscale opacity-50" : ""}`}>
                            {product.isBestseller && (
                              <div className="absolute top-0 left-0 bg-gradient-to-r from-[#FF7A00] to-[#FF9900] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br-[10px] z-10 shadow-sm">
                                Bestseller
                              </div>
                            )}
                            {product.image?.startsWith("http") ||
                            product.image?.startsWith("data:") ? (
                              <img
                                src={product.image || undefined}
                                alt={product.name}
                                className="w-full h-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">{product.image}</div>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-800 text-[12px] leading-[1.3] line-clamp-2 min-h-[31px]">
                            {product.name}
                          </h3>
                          
                        </div>
                        <div className="mt-auto pt-2 flex items-center justify-between gap-1">
                          <div className="flex flex-col shrink-0">
                            {(product.mrp || 0) > product.price && (
                              <span className="text-[10px] text-gray-400 line-through leading-none mb-0.5">₹{product.mrp}</span>
                            )}
                            <span className="text-gray-900 font-bold text-[13px] leading-none">
                              ₹{product.price}
                            </span>
                          </div>
                          
                          {product.isAvailable === false ? (
                            <div className="h-[28px] px-2 flex items-center justify-center rounded-lg border border-gray-200 text-[9px] font-bold uppercase tracking-wide bg-gray-50 text-gray-400 shrink-0">
                              Out
                            </div>
                          ) : quantity === 0 ? (
                            <button
                              onClick={() => updateQuantity(product.id, 1)}
                              className="h-[28px] w-[64px] flex items-center justify-center rounded-lg border border-[#187D39]/30 text-[#187D39] bg-[#187D39]/5 hover:bg-[#187D39]/10 text-[12px] font-bold uppercase tracking-wide transition-colors active:scale-95 shrink-0"
                            >
                              ADD
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-[#187D39] text-white rounded-lg p-0.5 h-[28px] w-[64px] shadow-sm shrink-0">
                              <button
                                onClick={() => updateQuantity(product.id, -1)}
                                className="w-6 h-full flex items-center justify-center active:scale-90"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-[13px] font-bold">{quantity}</span>
                              <button
                                onClick={() => updateQuantity(product.id, 1)}
                                className="w-6 h-full flex items-center justify-center active:scale-90"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="mb-4">
              <button
                onClick={() => setEditingProduct("new")}
                className="w-full bg-green-50 text-[#0e783a] py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-green-200 border-dashed"
              >
                <Plus className="w-5 h-5" /> Add New Item
              </button>
            </div>
          )}
          {displayedProducts.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {displayedProducts.map((product) => (
                    <motion.div
                      layout
                      key={product.id}
                      className="group bg-white border-gray-100 p-2 rounded-[16px] shadow-sm hover:shadow-md border flex flex-col justify-between h-full relative transition-all duration-300"
                    >
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProduct(product);
                          }}
                          className="absolute -top-1.5 -right-1.5 z-20 p-1.5 bg-white border border-gray-200 rounded-full shadow-md text-gray-400 hover:text-[#0c831f] transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      
                      <div className="flex flex-col">
                        <div className={`w-full aspect-square bg-[#F4F6F8] rounded-[12px] mb-2 flex items-center justify-center text-4xl overflow-hidden relative ${product.isAvailable === false ? "grayscale opacity-50" : ""}`}>
                          {product.isBestseller && (
                            <div className="absolute top-0 left-0 bg-gradient-to-r from-[#FF7A00] to-[#FF9900] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br-[10px] z-10 shadow-sm">
                              Bestseller
                            </div>
                          )}
                          {product.image?.startsWith("http") ||
                          product.image?.startsWith("data:") ? (
                            <img
                              src={product.image || undefined}
                              alt={product.name}
                              className="w-[85%] h-[85%] object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">{product.image}</div>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-800 text-[12px] leading-[1.3] line-clamp-2 min-h-[31px]">
                          {product.name}
                        </h3>
                      </div>
                      <div className="mt-auto pt-2 flex items-center justify-between gap-1">
                        <div className="flex flex-col shrink-0">
                          {(product.mrp || 0) > product.price && (
                            <span className="text-[10px] text-gray-400 line-through leading-none mb-0.5">₹{product.mrp}</span>
                          )}
                          <span className="text-gray-900 font-bold text-[13px] leading-none">
                            ₹{product.price}
                          </span>
                        </div>
                        
                        {product.isAvailable === false ? (
                          <div className="h-[28px] px-2 flex items-center justify-center rounded-lg border border-gray-200 text-[9px] font-bold uppercase tracking-wide bg-gray-50 text-gray-400 shrink-0">
                            Out
                          </div>
                        ) : getQuantity(product.id) === 0 ? (
                          <button
                            onClick={() => updateQuantity(product.id, 1)}
                            className="h-[28px] w-[64px] flex items-center justify-center rounded-lg border border-[#187D39]/30 text-[#187D39] bg-[#187D39]/5 hover:bg-[#187D39]/10 text-[12px] font-bold uppercase tracking-wide transition-colors active:scale-95 shrink-0"
                          >
                            ADD
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-[#187D39] text-white rounded-lg p-0.5 h-[28px] w-[64px] shadow-sm shrink-0">
                            <button
                              onClick={() => updateQuantity(product.id, -1)}
                              className="w-6 h-full flex items-center justify-center active:scale-90"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[13px] font-bold">{getQuantity(product.id)}</span>
                            <button
                              onClick={() => updateQuantity(product.id, 1)}
                              className="w-6 h-full flex items-center justify-center active:scale-90"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
              ))}
            </div>
          )}

          {crossSellSource && currentView !== "cart" && currentView !== "order" && (
          <RecommendationRow
            sourceProduct={crossSellSource}
            products={products}
            onClose={() => setCrossSellSource(null)}
            onAddToCart={updateQuantity}
          />
          )}

          {isSearching && displayedProducts.length === 0 && <FunnySearchSkeleton />}

          {!isSearching && displayedProducts.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No products found.</p>
            </div>
          )}

        </div>

        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
            <div className="max-w-md mx-auto flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">
                  Total ({cart.reduce((a, b) => a + b.quantity, 0)} items)
                </p>
                <p className="font-bold text-xl text-gray-900">
                  ₹{finalTotal} {deliveryFee === 0 && <span className="text-xs font-normal text-[#0e783a]">(Free Delivery)</span>}
                </p>
              </div>
              <button
                onClick={() => setCurrentView("cart")}
                className="flex-1 bg-[#0e783a] text-white px-6 py-3.5 rounded-full font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                View Cart <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            {hasMoreProducts && !isSearching && (
              <div className="mt-6 flex justify-center pb-8">
                <button
                  onClick={loadMoreProducts}
                  className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 active:bg-gray-100 shadow-sm transition-colors"
                >
                  Load More Products
                </button>
              </div>
            )}
          </div>
        )}
        {adminModals}
        {globalOverlays}
        
        {floatingCartFab}
      </div>
    );
  }

  if (currentView === "cart") {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={400} gravity={0.2} />}
        {renderHeader(
          "Order Summary", 
          () => setCurrentView("order"),
          cart.length > 0 ? (
            <button 
              onClick={() => setCart([])} 
              className="text-xs font-bold text-red-500 bg-white px-3 py-1.5 rounded-full shadow-sm hover:bg-red-50 active:scale-95 transition-all border border-red-100"
            >
              Empty Cart
            </button>
          ) : null
        )}
                {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
            <div className="w-20 h-20 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center mb-5 shadow-inner">
              <ShoppingCart className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Your cart is empty</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-[250px]">Looks like you haven't added any items to your order yet.</p>
            <button 
              onClick={() => setCurrentView("order")} 
              className="bg-[#0e783a] text-white px-8 py-3 rounded-full font-medium active:scale-95 transition-transform flex items-center gap-2 shadow-sm"
            >
              Start Shopping <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 max-w-md mx-auto space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 divide-y">
            {cart.map((item) => {
              const product = products.find((p) => p.id === item.id);
              if (!product) return null;
              return (
                <div
                  key={item.id}
                  className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {product.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      ₹{product.price}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-semibold text-gray-900">
                      ₹{product.price * item.quantity}
                    </p>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-[#0e783a] hover:bg-gray-50 active:scale-95"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-4 text-center font-medium text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-[#0e783a] hover:bg-gray-50 active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
    </div>
              );
            })}
            <div className="py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">₹{itemsTotal}</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Delivery Fee</span>
              <span className={`font-semibold ${deliveryFee === 0 ? 'text-[#0e783a]' : 'text-gray-900'}`}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </span>
            </div>
            {deliveryFee > 0 && (
              <div className="pb-3 text-xs text-[#0e783a] text-right">
                Add items worth ₹{250 - itemsTotal} more for free delivery
              </div>
            )}
            <div className="py-3 border-t-2 border-dashed mt-2 pt-4 flex items-center justify-between">
              <span className="font-medium text-gray-600">Grand Total</span>
              <span className="font-bold text-xl text-[#0e783a]">
                ₹{finalTotal}
              </span>
            </div>
          </div>

          {suggestedBundle && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-indigo-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{suggestedBundle.bundleEmojis}</span>
                <div>
                  <h3 className="font-bold text-indigo-900 leading-tight">{suggestedBundle.name}</h3>
                  <p className="text-xs text-indigo-700">{suggestedBundle.description}</p>
                </div>
                <div className="ml-auto bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                  Bundle
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
                {suggestedBundle.products.map(product => (
                  <div key={product.id} className="min-w-[130px] bg-white rounded-xl p-2 shadow-sm border border-indigo-50 snap-start flex flex-col justify-between">
                    <div>
                      <div className="aspect-square bg-gray-50 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                        {product.image ? (
                          <img src={product.image || undefined} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <span className="text-2xl font-bold text-gray-300">{product.name.charAt(0)}</span>
                        )}
                      </div>
                      <h4 className="text-[11px] font-bold text-gray-900 leading-tight line-clamp-2 min-h-[26px]">{product.name}</h4>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-extrabold text-[#0e783a] text-xs">₹{product.price}</span>
                      <button
                        onClick={() => updateQuantity(product.id, 1)}
                        className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white w-6 h-6 rounded flex items-center justify-center transition-all shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-yellow-600 mt-0.5" />
            <p>
              You will be redirected to WhatsApp to confirm and send this order.
              You can pay at the shop or on delivery.
            </p>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleSendOrder}
              className="w-full bg-[#25D366] text-white px-6 py-3.5 rounded-full font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
            >
              <Send className="w-5 h-5" /> Send Order on WhatsApp
            </button>
          </div>
        </div>
        </>)}
        {adminModals}
        {globalOverlays}
      </div>
    );
  }

  if (currentView === "library") {
    const renderSeat = (id: string, isOccupied: boolean) => {
      const isSelected = selectedSeat === id;

      return (
        <button
          key={id}
          disabled={isOccupied}
          onClick={() => setSelectedSeat(id)}
          className={`
            relative flex flex-col items-center justify-center aspect-square rounded-xl border-2 transition-all
            ${
              isOccupied
                ? "bg-red-50 border-red-300 text-red-400 cursor-not-allowed"
                : isSelected
                  ? "bg-[#1e40af] border-[#1e40af] text-white shadow-md transform scale-105"
                  : "bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100"
            }
          `}
        >
          {isOccupied ? (
            <span className="text-lg font-bold italic opacity-60">X</span>
          ) : (
            <span className={`text-lg ${isSelected ? 'grayscale brightness-200' : ''}`}>🪑</span>
          )}
          <span className="font-medium text-xs mt-0.5">{id}</span>
        </button>
      );
    };

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {renderHeader("Library Seats", () => setCurrentView("home"), undefined, "bg-[#1e40af]", "text-[#1e40af]", "border-[#1e40af]")}

        <div className="p-4 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-center gap-6 text-sm mb-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-50 border-2 border-blue-400 rounded-md"></div>
              <span className="text-gray-600">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[#1e40af] border-2 border-[#1e40af] rounded-md"></div>
              <span className="text-gray-600">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-50 border-2 border-red-300 rounded-md"></div>
              <span className="text-gray-600">Occupied</span>
            </div>
          </div>

          <div className="bg-white p-1 rounded-xl flex items-center shadow-sm border border-gray-100">
            <button
              onClick={() => setActiveLibrarySection("girls")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeLibrarySection === "girls" ? "bg-[#1e40af] text-white shadow" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
            >
              Girls Section (G1-G33)
            </button>
            <button
              onClick={() => setActiveLibrarySection("boys")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeLibrarySection === "boys" ? "bg-[#1e40af] text-white shadow" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
            >
              Boys Section (B34-B71)
            </button>
          </div>

          {activeLibrarySection === "girls" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {GIRLS_SEATS.map((seat) =>
                  renderSeat(seat, occupiedSeats.has(seat)),
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {BOYS_SEATS.map((seat) =>
                  renderSeat(seat, occupiedSeats.has(seat)),
                )}
              </div>
            </div>
          )}
        </div>

        {selectedSeat && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
            <div className="max-w-md mx-auto flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Selected Seat</p>
                <p className="font-bold text-2xl text-gray-900">
                  {selectedSeat}
                </p>
              </div>
              <button
                onClick={() => setCurrentView("library-summary")}
                className="flex-1 bg-[#1e40af] text-white px-6 py-3.5 rounded-full font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                Proceed <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        {adminModals}
        {globalOverlays}
      </div>
    );
  }

  if (currentView === "library-summary") {
    const isGirl = selectedSeat?.startsWith("G");

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={400} gravity={0.2} />}
        {renderHeader("Booking Summary", () => setCurrentView("library"), undefined, "bg-[#1e40af]", "text-[#1e40af]", "border-[#1e40af]")}
        <div className="p-4 max-w-md mx-auto space-y-4 mt-4">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center space-y-4">
            <div className="w-20 h-20 bg-[#1b4ed8]/10 text-[#1b4ed8] rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-gray-500 font-medium">Seat Selected</h2>
              <p className="text-4xl font-bold text-gray-900 mt-1">
                {selectedSeat}
              </p>
              <p className="text-gray-500 mt-1">
                {isGirl ? "Girls Section" : "Boys Section"}
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-yellow-600 mt-0.5" />
            <p>
              You will be redirected to WhatsApp to confirm this seat booking.
              Show the WhatsApp confirmation message at the library desk.
            </p>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleSendBooking}
              className="w-full bg-[#25D366] text-white px-6 py-3.5 rounded-full font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
            >
              <Send className="w-5 h-5" /> Confirm on WhatsApp
            </button>
          </div>
        </div>
        {adminModals}
        {globalOverlays}
    </div>
    );
  }

  if (currentView === "admin-login") {
    return (
      <AdminLogin
        onBack={() => setCurrentView("home")}
        onLoginSuccess={(role) => {
          setAdminRole(role);
          setCurrentView("admin-dashboard");
        }}
      />
    );
  }

  if (currentView === "admin-dashboard" && adminRole) {
    return (
      <AdminDashboard
        role={adminRole}
        onBack={() => setCurrentView("home")}
        onLogout={() => {
          setAdminRole(null);
          setCurrentView("home");
        }}
      />
    );
  }

  // --- HOME VIEW ---
  return (
    <div className="min-h-screen bg-white pb-20 overflow-x-hidden">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={400} gravity={0.2} style={{ zIndex: 9999 }} />}
      {renderHeader("BCN Store")}
      
      {/* Search Bar */}
      <div className="px-4 pt-3 pb-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for products..."
              className="w-full pl-11 pr-4 py-3 rounded-full border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e783a]/30 text-sm"
              onClick={() => setCurrentView("order")}
              readOnly
            />
          </div>
          <button
            onClick={() => setCurrentView("order")}
            className="w-12 h-12 bg-[#0e783a] rounded-full flex items-center justify-center text-white shrink-0 shadow-md"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="px-4 space-y-5 flex-1 flex flex-col pb-4">
        {/* Hero Banner */}
        <div 
          className="rounded-[20px] p-4 relative overflow-hidden text-white flex min-h-[120px] shadow-sm"
          style={{ 
            backgroundColor: '#114a2c',
            backgroundImage: `url('/hero-bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Subtle overlay to ensure the text remains legible over the background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#114a2c] via-[#114a2c]/80 to-transparent w-[75%]"></div>
          
          <div className="relative z-20 w-[60%] flex flex-col justify-center drop-shadow-sm">
            <p className="text-[10px] font-medium opacity-90 mb-0.5 tracking-wide text-white/90">आपका अपना</p>
            <h2 className="text-[28px] font-extrabold mb-1.5 leading-none tracking-tight">
              BCN <span className="text-[#fbd051]">Store</span>
            </h2>
            <p className="text-[9px] opacity-90 leading-[1.3] mb-2.5 max-w-[100%] font-medium">
              गाँव का अपना स्टोर,
              <br />
              15 मिनट में डिलीवरी आपके दरवाजे पर!
            </p>
            <div className="inline-flex items-center self-start gap-1 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[8px] font-semibold shadow-inner border border-white/10">
              <Zap className="w-3 h-3 text-[#fbd051]" fill="currentColor" /> Fast Delivery in 15 mins
            </div>
          </div>
        </div>

                {/* Categories */}
        <div className="relative z-10 bg-white/50 backdrop-blur-[2px] rounded-2xl">
          <div className="flex overflow-x-auto no-scrollbar gap-4 px-2 py-2">
            {dbCategories.map((cat, i) => (
              <div
                key={cat.id}
                className="flex flex-col items-center gap-2 cursor-pointer relative shrink-0 min-w-[56px]"
              >
                
                
                <div 
                  className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-2xl shadow-sm border border-gray-100"
                  onClick={() => {
                    setSelectedCategory(cat.nameEn);
                    setCurrentView("order");
                  }}
                >
                  {cat.imageUrl ? <img src={cat.imageUrl || undefined} className="w-full h-full object-cover rounded-full" /> : cat.emoji}
                </div>
                <div className="text-center" onClick={() => {
                  setSelectedCategory(cat.nameEn);
                  setCurrentView("order");
                }}>
                  <p className="text-[11px] font-bold text-gray-900 leading-tight">
                    {cat.nameHi || cat.nameEn}
                  </p>
                  {cat.nameHi && (
                    <p className="text-[9px] text-gray-500 leading-tight mt-0.5">
                      {cat.nameEn}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            

            <div
              className="flex flex-col items-center gap-2 cursor-pointer shrink-0 min-w-[56px]"
              onClick={() => {
                setSelectedCategory("All");
                setCurrentView("order");
              }}
            >
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-2xl shadow-sm border border-gray-100">
                <Grid className="w-6 h-6 text-gray-500" />
              </div>
              <div className="text-center">
                <p className="text-[11px] font-bold text-gray-900 leading-tight">
                  और देखें
                </p>
                <p className="text-[9px] text-gray-500 leading-tight mt-0.5">
                  More
                </p>
              </div>
            </div>
          </div>
        </div>



        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          {/* Shop Card */}
          <button
            onClick={() => setCurrentView("order")}
            className="rounded-3xl p-4 text-left relative overflow-hidden flex flex-col justify-end min-h-[230px] border border-green-100 shadow-sm transition-transform active:scale-[0.98]"
            style={{ 
              backgroundImage: "url('/shop-bg.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#e9f5ed'
            }}
          >
            {/* Button */}
            <div className="bg-[#10b981] hover:bg-[#059669] text-white w-full py-2.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors relative z-10">
              ऑर्डर करें <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Library Card (Compact Premium) */}
          <button
            onClick={() => setCurrentView("library")}
            className="bg-[#e8f1ff] rounded-3xl p-4 text-left relative overflow-hidden flex flex-col justify-between min-h-[230px] border border-blue-50 shadow-sm transition-transform active:scale-[0.98]"
          >
            {/* Background styling for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-[#dbeafe] z-0"></div>
            
            {/* Tiny price tag */}
            <div className="absolute top-0 right-4 bg-[#1b4ed8] text-white px-2 pt-1.5 pb-2.5 rounded-b-lg shadow-md z-20 flex flex-col items-center">
              <span className="text-[11px] font-bold leading-none">₹500</span>
              <span className="text-[8px] font-medium mt-0.5">/ month</span>
              <div className="absolute -bottom-1.5 w-full h-3 bg-[#1b4ed8] [clip-path:polygon(0_0,50%_100%,100%_0)]"></div>
            </div>

            <div className="flex justify-center mb-6 pt-3 relative z-10">
               <div className="text-[60px] drop-shadow-md relative">
                 📚
                 <div className="absolute -bottom-1 -right-3 text-[28px] drop-shadow-lg">💻</div>
               </div>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-[#1e3a8a] leading-tight mb-1">
                पुस्तकालय /<br/>Library
              </h3>
              <p className="text-[10px] text-[#1e40af] leading-tight mb-4 opacity-90 font-medium">
                Dedicated study space with Free Wi-Fi
              </p>
              <div className="bg-[#3b82f6] hover:bg-[#2563eb] text-white w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm">
                सीट बुक करें <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="bg-[#f5fbf7] rounded-xl py-2.5 px-3 border border-green-50 flex justify-between items-center">
          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-7 h-7 rounded-full bg-[#0e783a] flex items-center justify-center shadow-sm text-white">
              <Timer className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-900 leading-tight">15 Min</p>
              <p className="text-[8px] text-gray-500 leading-tight mt-0.5">फास्ट डिलीवरी</p>
            </div>
          </div>
          
          <div className="w-px h-8 bg-gray-200"></div>

          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-7 h-7 rounded-full bg-[#0e783a] flex items-center justify-center shadow-sm text-white">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-900 leading-tight">100%</p>
              <p className="text-[8px] text-gray-500 leading-tight mt-0.5">क्वालिटी</p>
            </div>
          </div>
          
          <div className="w-px h-8 bg-gray-200"></div>

          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-7 h-7 rounded-full bg-[#0e783a] flex items-center justify-center shadow-sm text-white">
              <span className="font-bold text-xs leading-none">₹</span>
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-900 leading-tight">बेस्ट प्राइस</p>
              <p className="text-[8px] text-gray-500 leading-tight mt-0.5">कम दाम</p>
            </div>
          </div>
          
          <div className="w-px h-8 bg-gray-200"></div>

          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-7 h-7 rounded-full bg-[#0e783a] flex items-center justify-center shadow-sm text-white">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-900 leading-tight">Secure</p>
              <p className="text-[8px] text-gray-500 leading-tight mt-0.5">सुरक्षित सेवा</p>
            </div>
          </div>
        </div>
        
        {/* Special Offer Banner */}
        <div className="bg-[#fdf8e1] border border-yellow-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-3xl drop-shadow-sm">🎁</div>
            <p className="text-[12px] font-bold text-gray-900 leading-tight">
              पहला ऑर्डर करें और पाएं खास ऑफर!
            </p>
          </div>
          <button 
            onClick={() => setCurrentView("order")}
            className="shrink-0 bg-green-50 text-[#0e783a] border border-green-200 px-4 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 hover:bg-green-100 transition-colors"
          >
            अभी देखें <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Footer */}
        <footer className="text-center pt-8 pb-10 text-xs text-gray-400 mt-auto flex flex-col items-center">
          <div className="bg-[#f0f9f3] w-full rounded-2xl py-6 px-4 mb-4 border border-[#0e783a]/10 flex flex-col items-center gap-2 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-[#0e783a]/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
             <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#0e783a]/5 rounded-full translate-y-1/3 -translate-x-1/3"></div>
             <img src="/logo.png" alt="BCN Store Logo" className="h-14 w-auto mb-2 object-contain drop-shadow-sm" loading="lazy" />
             <p className="text-[12px] font-bold text-[#0e783a] relative z-10">आपका भरोसा, हमारी पहचान</p>
             <p className="text-[10px] text-gray-500 max-w-[250px] relative z-10 leading-snug mb-2">
               We are committed to delivering the best quality products at your doorstep within 15 minutes.
             </p>
             <div className="flex flex-col items-center gap-0.5 bg-white/60 px-4 py-2 rounded-xl relative z-10 w-full mt-1 border border-green-50">
                <span className="text-[10px] font-semibold text-gray-800">🏪 Store Timings</span>
                <span className="text-[9px] text-gray-600 font-medium">Offline/Walk-in: <span className="font-bold text-gray-900">7:00 AM - 11:00 PM</span></span>
                <span className="text-[9px] text-gray-600 font-medium">Online Delivery: <span className="font-bold text-gray-900">Ends at 7:00 PM</span></span>
             </div>
          </div>

          <div className="w-full flex items-center gap-3 mb-6 px-1">
            <a 
              href={`tel:+${PHONE_NUMBER}`} 
              className="flex-1 bg-white text-[#0e783a] border border-green-100 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-[13px] shadow-sm active:scale-[0.98] transition-transform"
            >
              <PhoneCall className="w-4 h-4" /> कॉल करें (Call)
            </a>
            <a 
              href="https://maps.app.goo.gl/yDaE8g1NqZQkhehA7" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex-1 bg-white text-[#1e40af] border border-blue-100 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-[13px] shadow-sm active:scale-[0.98] transition-transform"
            >
              <MapPin className="w-4 h-4" /> लोकेशन (Map)
            </a>
          </div>

          <button
            onClick={() =>
              setCurrentView(adminRole ? "admin-dashboard" : "admin-login")
            }
            className="inline-flex items-center gap-1.5 text-[10px] font-medium text-gray-400 hover:text-[#0e783a] transition-colors bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100"
          >
            <Shield className="w-3 h-3" />
            {adminRole ? "Admin Portal" : "Staff Login"}
          </button>
        </footer>
      </main>
      {floatingCartFab}

      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-[#0e783a]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">ऐप इंस्टॉल करें</h2>
              <p className="text-sm text-gray-500 mb-6 font-medium">Install App for faster access</p>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-2">
                    <span>🤖</span> Android / अन्य ब्राउज़र
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    1. ब्राउज़र के ऊपर दाईं ओर <strong className="text-gray-900">Menu (⋮)</strong> पर क्लिक करें।<br/>
                    2. <strong className="text-gray-900">"Add to Home screen"</strong> या <strong className="text-gray-900">"Install App"</strong> पर क्लिक करें।
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-2">
                    <span>🍏</span> iPhone & iPad
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    1. नीचे दिए गए <strong className="text-gray-900">Share</strong> बटन पर टैप करें।<br/>
                    2. नीचे स्क्रॉल करें और <strong className="text-gray-900">Add to Home Screen</strong> चुनें।
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowInstallModal(false)}
                className="mt-6 w-full py-3 bg-[#0e783a] text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                ठीक है (Got it)
              </button>
            </div>
          </div>
        </div>
      )}

      {adminModals}
        {globalOverlays}
    </div>
  );
}


function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    // Only block briefly, let user get to content
    const timer = setTimeout(() => {
      onFinish();
    }, 2200); 
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[9999] bg-[#0e783a] flex flex-col items-center justify-center text-white overflow-hidden"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
        className="flex flex-col items-center gap-6 relative z-10"
      >
        <motion.div 
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="bg-white p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
        >
          <img src="/logo.png" alt="BCN Store Logo" className="h-24 w-auto object-contain" fetchPriority="high" loading="eager" />
        </motion.div>
        
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">BCN Store</h1>
          <div className="flex items-center gap-3 text-[#a5e0bc] font-bold tracking-[0.2em] text-xs uppercase">
            <span className="w-10 h-[2px] bg-[#a5e0bc]/50 rounded-full"></span>
            Singhwa Madanheri
            <span className="w-10 h-[2px] bg-[#a5e0bc]/50 rounded-full"></span>
          </div>
        </div>
      </motion.div>

      {/* Decorative background circles */}
      <motion.div 
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute top-1/4 -right-20 w-80 h-80 bg-white rounded-full blur-[80px] pointer-events-none"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
        className="absolute -bottom-10 -left-10 w-64 h-64 bg-white rounded-full blur-[60px] pointer-events-none"
      />
    </motion.div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      </AnimatePresence>
      <MainContent />
      <ScooterRider />
    </>
  );
}
