const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const newFnBody = `((prod, isRec = false) => {
                  const qty = getQuantity(prod.id);
                  return (
                    <motion.div
                      layout
                      initial={isRec ? { opacity: 0, scale: 0.8 } : false}
                      animate={isRec ? { opacity: 1, scale: 1 } : false}
                      key={isRec ? \`rec-\${prod.id}\` : prod.id}
                      className={\`group \${isRec ? "bg-purple-50 border-purple-200 ring-1 ring-purple-100" : "bg-white border-gray-100"} p-2 rounded-[16px] shadow-sm hover:shadow-md border flex flex-col justify-between h-full relative transition-all duration-300\`}
                    >
                      {isRec && <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full z-20 shadow-sm whitespace-nowrap">Pairs nicely!</div>}
                      {isAdmin && !isRec && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProduct(prod);
                          }}
                          className="absolute -top-1.5 -right-1.5 z-20 p-1.5 bg-white border border-gray-200 rounded-full shadow-md text-gray-400 hover:text-[#0c831f] transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      
                      <div className="flex flex-col">
                        <div className={\`w-full aspect-square \${isRec ? 'bg-white' : 'bg-[#F4F6F8]'} rounded-[12px] mb-2 flex items-center justify-center text-4xl overflow-hidden relative \${prod.isAvailable === false ? "grayscale opacity-50" : ""}\`}>
                          {prod.isBestseller && !isRec && (
                            <div className="absolute top-0 left-0 bg-gradient-to-r from-[#FF7A00] to-[#FF9900] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br-[10px] z-10 shadow-sm">
                              Bestseller
                            </div>
                          )}
                          {prod.image?.startsWith("http") ||
                          prod.image?.startsWith("data:") ? (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-[85%] h-[85%] object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">{prod.image}</div>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-800 text-[12px] leading-[1.3] line-clamp-2 min-h-[31px]">
                          {prod.name}
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-1 truncate">
                          {prod.unit ? prod.unit : prod.category}
                        </p>
                      </div>
                      <div className="mt-2 flex items-end justify-between">
                        <div className="flex flex-col">
                          {prod.mrp && prod.mrp > prod.price && (
                            <span className="text-[10px] text-gray-400 line-through leading-none mb-0.5">₹{prod.mrp}</span>
                          )}
                          <span className={\`\${isRec ? 'text-purple-700' : 'text-gray-900'} font-bold text-[14px] leading-none\`}>
                            ₹{prod.price}
                          </span>
                        </div>
                        
                        {prod.isAvailable === false ? (
                          <div className="px-2 py-1 rounded-lg border border-gray-200 text-[9px] font-bold uppercase tracking-wide bg-gray-50 text-gray-400">
                            Out
                          </div>
                        ) : qty === 0 ? (
                          <button
                            onClick={() => updateQuantity(prod.id, 1)}
                            className={\`px-3 py-1 rounded-lg border \${isRec ? 'border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100' : 'border-[#187D39]/30 text-[#187D39] bg-[#187D39]/5 hover:bg-[#187D39]/10'} text-[12px] font-bold uppercase tracking-wide transition-colors active:scale-95\`}
                          >
                            ADD
                          </button>
                        ) : (
                          <div className={\`flex items-center justify-between \${isRec ? 'bg-purple-600' : 'bg-[#187D39]'} text-white rounded-lg px-1 py-1 h-[28px] min-w-[68px] shadow-sm\`}>
                            <button
                              onClick={() => updateQuantity(prod.id, -1)}
                              className="w-6 h-6 flex items-center justify-center active:scale-90"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[13px] font-bold px-1">{qty}</span>
                            <button
                              onClick={() => updateQuantity(prod.id, 1)}
                              className="w-6 h-6 flex items-center justify-center active:scale-90"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                }`;

const correctMiddle = `)(product, false);

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
                
                const recElements = topRecommendations.map(recProd => `;

const correctReplacement = "const productElement = " + newFnBody + correctMiddle + newFnBody + ")(recProd, true));";

const regexToReplace = /const productElement = \(\(prod, isRec = false\) => \{[\s\S]*?return \[productElement, \.\.\.recElements\];/g;
code = code.replace(regexToReplace, correctReplacement + "\n                return [productElement, ...recElements];");

fs.writeFileSync('src/App.tsx', code);
console.log("Fixed mess!");
