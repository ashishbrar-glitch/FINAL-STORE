const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /<div key=\{product\.id\} className="min-w-\[140px\] w-\[140px\] snap-start">[\s\S]*?<\/div>\s*<\/div>\s*\);/g;

const newBuyAgainCard = `<div key={product.id} className="min-w-[130px] w-[130px] snap-start">
                      <div className="bg-white p-2 rounded-[16px] shadow-sm hover:shadow-md border border-gray-100 flex flex-col justify-between h-full relative transition-all duration-300">
                        <div className="flex flex-col">
                          <div className={\`w-full aspect-square bg-[#F4F6F8] rounded-[12px] mb-2 flex items-center justify-center text-4xl overflow-hidden relative \${product.isAvailable === false ? "grayscale opacity-50" : ""}\`}>
                            {product.isBestseller && (
                              <div className="absolute top-0 left-0 bg-gradient-to-r from-[#FF7A00] to-[#FF9900] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br-[10px] z-10 shadow-sm">
                                Bestseller
                              </div>
                            )}
                            {product.image?.startsWith("http") ||
                            product.image?.startsWith("data:") ? (
                              <img
                                src={product.image}
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
                          <p className="text-[10px] text-gray-500 mt-1 truncate">
                            {product.unit ? product.unit : product.category}
                          </p>
                        </div>
                        <div className="mt-2 flex items-end justify-between">
                          <div className="flex flex-col">
                            {product.mrp && product.mrp > product.price && (
                              <span className="text-[10px] text-gray-400 line-through leading-none mb-0.5">₹{product.mrp}</span>
                            )}
                            <span className="text-gray-900 font-bold text-[14px] leading-none">
                              ₹{product.price}
                            </span>
                          </div>
                          
                          {product.isAvailable === false ? (
                            <div className="px-2 py-1 rounded-lg border border-gray-200 text-[9px] font-bold uppercase tracking-wide bg-gray-50 text-gray-400">
                              Out
                            </div>
                          ) : quantity === 0 ? (
                            <button
                              onClick={() => updateQuantity(product.id, 1)}
                              className="px-3 py-1 rounded-lg border border-[#187D39]/30 text-[#187D39] bg-[#187D39]/5 hover:bg-[#187D39]/10 text-[12px] font-bold uppercase tracking-wide transition-colors active:scale-95"
                            >
                              ADD
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-[#187D39] text-white rounded-lg px-1 py-1 h-[28px] min-w-[68px] shadow-sm">
                              <button
                                onClick={() => updateQuantity(product.id, -1)}
                                className="w-6 h-6 flex items-center justify-center active:scale-90"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-[13px] font-bold px-1">{quantity}</span>
                              <button
                                onClick={() => updateQuantity(product.id, 1)}
                                className="w-6 h-6 flex items-center justify-center active:scale-90"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );`;

code = code.replace(regex, newBuyAgainCard);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched buyAgain");
