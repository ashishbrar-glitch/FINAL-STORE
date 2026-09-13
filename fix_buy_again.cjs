const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldBuyAgain = `                        <div className="mt-2 flex items-end justify-between">
                          <div className="flex flex-col">
                            {(product.mrp || 0) > product.price && (
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
                        </div>`;

const newBuyAgain = `                        <div className="mt-auto pt-2 flex items-center justify-between gap-1">
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
                        </div>`;

if(code.includes(oldBuyAgain)) {
  code = code.replace(oldBuyAgain, newBuyAgain);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Replaced buy again layout");
} else {
  console.log("Could not find buy again block");
}
