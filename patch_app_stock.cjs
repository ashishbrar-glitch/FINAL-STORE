const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the Add to cart / quantity controls section
const controlsRegex = /\{qty === 0 \? \([\s\S]*?\}<\/button>\s*<\/div>\s*\)\}/;

const outOfStockControls = `{product.isAvailable === false ? (
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
                      )}`;

code = code.replace(controlsRegex, outOfStockControls);

// Add grayscale to the image if out of stock
code = code.replace(/className="w-full aspect-square bg-gray-50 rounded-xl mb-2 flex items-center justify-center text-4xl overflow-hidden border border-gray-100 relative"/, 'className={`w-full aspect-square bg-gray-50 rounded-xl mb-2 flex items-center justify-center text-4xl overflow-hidden border border-gray-100 relative ${product.isAvailable === false ? "grayscale opacity-60" : ""}`}');

// Also in the Search overlay view!
// Let's check where else `product.name` is rendered.
fs.writeFileSync('src/App.tsx', code);
console.log("Patched App stock successfully");
