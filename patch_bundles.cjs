const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const bundlesDefinition = `
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

function MainContent() {`;

code = code.replace('function MainContent() {', bundlesDefinition);

const bundleHook = `  // Db Categories
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
  }, [cart, products]);`;

code = code.replace(`  // Db Categories
  const [dbCategories, setDbCategories] = useState<Category[]>([]);`, bundleHook);


const bundleUI = `            <div className="py-3 border-t-2 border-dashed mt-2 pt-4 flex items-center justify-between">
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
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
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

          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm flex items-start gap-3">`;

code = code.replace(`            <div className="py-3 border-t-2 border-dashed mt-2 pt-4 flex items-center justify-between">
              <span className="font-medium text-gray-600">Grand Total</span>
              <span className="font-bold text-xl text-[#0e783a]">
                ₹{finalTotal}
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm flex items-start gap-3">`, bundleUI);

fs.writeFileSync('src/App.tsx', code);
