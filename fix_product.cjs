const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldProduct = `                      <div className="mt-2 flex items-end justify-between">
                        <div className="flex flex-col">
                          {(prod.mrp || 0) > prod.price && (
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
                      </div>`;

const newProduct = `                      <div className="mt-auto pt-2 flex items-center justify-between gap-1">
                        <div className="flex flex-col shrink-0">
                          {(prod.mrp || 0) > prod.price && (
                            <span className="text-[10px] text-gray-400 line-through leading-none mb-0.5">₹{prod.mrp}</span>
                          )}
                          <span className={\`\${isRec ? 'text-purple-700' : 'text-gray-900'} font-bold text-[13px] leading-none\`}>
                            ₹{prod.price}
                          </span>
                        </div>
                        
                        {prod.isAvailable === false ? (
                          <div className="h-[28px] px-2 flex items-center justify-center rounded-lg border border-gray-200 text-[9px] font-bold uppercase tracking-wide bg-gray-50 text-gray-400 shrink-0">
                            Out
                          </div>
                        ) : qty === 0 ? (
                          <button
                            onClick={() => updateQuantity(prod.id, 1)}
                            className={\`h-[28px] w-[64px] flex items-center justify-center rounded-lg border \${isRec ? 'border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100' : 'border-[#187D39]/30 text-[#187D39] bg-[#187D39]/5 hover:bg-[#187D39]/10'} text-[12px] font-bold uppercase tracking-wide transition-colors active:scale-95 shrink-0\`}
                          >
                            ADD
                          </button>
                        ) : (
                          <div className={\`flex items-center justify-between \${isRec ? 'bg-purple-600' : 'bg-[#187D39]'} text-white rounded-lg p-0.5 h-[28px] w-[64px] shadow-sm shrink-0\`}>
                            <button
                              onClick={() => updateQuantity(prod.id, -1)}
                              className="w-6 h-full flex items-center justify-center active:scale-90"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[13px] font-bold">{qty}</span>
                            <button
                              onClick={() => updateQuantity(prod.id, 1)}
                              className="w-6 h-full flex items-center justify-center active:scale-90"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>`;

if(code.includes(oldProduct)) {
  code = code.replaceAll(oldProduct, newProduct);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Replaced product layout");
} else {
  console.log("Could not find product block");
}
