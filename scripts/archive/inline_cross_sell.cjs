const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Remove CrossSellToast from globalOverlays
const toastCallStr = `{crossSellSource && currentView !== "cart" && currentView !== "admin-dashboard" && (
          <CrossSellToast
            sourceProduct={crossSellSource}
            recommendations={recommendations}
            products={products}
            onClose={() => setCrossSellSource(null)}
            onAddToCart={updateQuantity}
          />
        )}`;
code = code.replace(toastCallStr, "");

// 2. We need a ProductCardRenderer function inside App scope, or we can just duplicate the JSX inside flatMap.
const oldMapping = `              {displayedProducts.map((product) => {
                const qty = getQuantity(product.id);
                return (
                  <div
                    key={product.id}
                    className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-full relative"
                  >
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduct(product);
                        }}
                        className="absolute -top-1 -right-1 z-20 p-1.5 bg-white border border-gray-200 rounded-full shadow-md text-gray-500 hover:text-[#0e783a]"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    
                    <div>
                      <div className={\`w-full aspect-square bg-gray-50 rounded-xl mb-2 flex items-center justify-center text-4xl overflow-hidden border border-gray-100 relative \${product.isAvailable === false ? "grayscale opacity-60" : ""}\`}>
                        {product.isBestseller && (
                          <div className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 z-10 shadow-sm shadow-red-500/20">
                            <Flame className="w-2.5 h-2.5" /> Bestseller
                          </div>
                        )}
                        {product.image?.startsWith("http") ||
                        product.image?.startsWith("data:") ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover" loading="lazy" decoding="async"
                          />
                        ) : (
                          product.image
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 text-xs leading-tight mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-[10px] text-gray-400">
                        {product.category}
                      </p>
                    </div>
                    <div className="mt-2">
                      <p className="text-[#0e783a] font-semibold text-sm mb-2">
                        ₹{product.price}
                      </p>
                      {product.isAvailable === false ? (
                        <div className="w-full text-center py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-gray-100 text-gray-400">
                          Out of Stock
                        </div>
                      ) : qty === 0 ? (
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="w-full border border-[#0e783a] text-[#0e783a] bg-[#0e783a]/5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-[#0e783a]/10 transition-colors"
                        >
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-[#0e783a] text-white rounded-lg px-1 py-1 h-[30px]">
                          <button
                            onClick={() => updateQuantity(product.id, -1)}
                            className="w-6 h-6 flex items-center justify-center active:scale-90"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold">{qty}</span>
                          <button
                            onClick={() => updateQuantity(product.id, 1)}
                            className="w-6 h-6 flex items-center justify-center active:scale-90"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}`;

const renderProductCard = `(prod, isRec = false) => {
                  const qty = getQuantity(prod.id);
                  return (
                    <motion.div
                      layout
                      initial={isRec ? { opacity: 0, scale: 0.8 } : false}
                      animate={isRec ? { opacity: 1, scale: 1 } : false}
                      key={isRec ? \`rec-\${prod.id}\` : prod.id}
                      className={isRec ? "bg-purple-50 p-2 rounded-2xl shadow-sm border border-purple-200 flex flex-col justify-between h-full relative ring-2 ring-purple-100" : "bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-full relative"}
                    >
                      {isRec && <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-20 shadow-sm whitespace-nowrap">Goes great with!</div>}
                      {isAdmin && !isRec && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProduct(prod);
                          }}
                          className="absolute -top-1 -right-1 z-20 p-1.5 bg-white border border-gray-200 rounded-full shadow-md text-gray-500 hover:text-[#0e783a]"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      
                      <div>
                        <div className={\`w-full aspect-square \${isRec ? 'bg-white' : 'bg-gray-50'} rounded-xl mb-2 flex items-center justify-center text-4xl overflow-hidden border border-gray-100 relative \${prod.isAvailable === false ? "grayscale opacity-60" : ""}\`}>
                          {prod.isBestseller && !isRec && (
                            <div className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 z-10 shadow-sm shadow-red-500/20">
                              <Flame className="w-2.5 h-2.5" /> Bestseller
                            </div>
                          )}
                          {prod.image?.startsWith("http") ||
                          prod.image?.startsWith("data:") ? (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover" loading="lazy" decoding="async"
                            />
                          ) : (
                            prod.image
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 text-xs leading-tight mb-1 line-clamp-2">
                          {prod.name}
                        </h3>
                        <p className="text-[10px] text-gray-400">
                          {prod.category}
                        </p>
                      </div>
                      <div className="mt-2">
                        <p className={\`\${isRec ? 'text-purple-700' : 'text-[#0e783a]'} font-semibold text-sm mb-2\`}>
                          ₹{prod.price}
                        </p>
                        {prod.isAvailable === false ? (
                          <div className="w-full text-center py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-gray-100 text-gray-400">
                            Out of Stock
                          </div>
                        ) : qty === 0 ? (
                          <button
                            onClick={() => updateQuantity(prod.id, 1)}
                            className={\`w-full border \${isRec ? 'border-purple-600 text-purple-700 bg-purple-100/50 hover:bg-purple-100' : 'border-[#0e783a] text-[#0e783a] bg-[#0e783a]/5 hover:bg-[#0e783a]/10'} py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors\`}
                          >
                            Add
                          </button>
                        ) : (
                          <div className={\`flex items-center justify-between \${isRec ? 'bg-purple-600' : 'bg-[#0e783a]'} text-white rounded-lg px-1 py-1 h-[30px]\`}>
                            <button
                              onClick={() => updateQuantity(prod.id, -1)}
                              className="w-6 h-6 flex items-center justify-center active:scale-90"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold">{qty}</span>
                            <button
                              onClick={() => updateQuantity(prod.id, 1)}
                              className="w-6 h-6 flex items-center justify-center active:scale-90"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                }`;

const newMapping = `              {displayedProducts.flatMap((product) => {
                const productElement = ${renderProductCard}(product, false);

                const isCrossSellTarget = crossSellSource?.id === product.id;
                if (!isCrossSellTarget) return [productElement];

                const recommendedIds = recommendations[product.id] || [];
                let recommendedProducts = recommendedIds
                  .map(id => products.find(p => p.id === id))
                  .filter(Boolean);

                if (recommendedProducts.length === 0) {
                  recommendedProducts = products.filter(p => p.isBestseller && p.id !== product.id).slice(0, 2);
                }
                if (recommendedProducts.length === 0) {
                  recommendedProducts = products.filter(p => p.id !== product.id).slice(0, 2);
                }

                const topRecommendations = recommendedProducts.slice(0, 2);
                
                const recElements = topRecommendations.map(recProd => ${renderProductCard}(recProd, true));

                return [productElement, ...recElements];
              })}`;

code = code.replace(oldMapping, newMapping);
fs.writeFileSync('src/App.tsx', code);
