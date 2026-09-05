const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Remove the "Buy Again" block from Home view
const startMarker = `{buyAgainProducts.length > 0 && selectedCategory === "All" && !searchQuery && (`;
const endMarker = `        {/* Categories */}`;

const startIndex = code.indexOf(startMarker);
if (startIndex !== -1) {
  const endIndex = code.indexOf(endMarker, startIndex);
  if (endIndex !== -1) {
    code = code.substring(0, startIndex) + code.substring(endIndex);
  }
}

// 2. Insert into Order Items view, right after Categories in the sticky header
// Or maybe below the sticky header, before the product grid
const orderInsertionPoint = `        <div className="p-4 max-w-md mx-auto">
          
          {isAdmin && (`;
const replacementStr = `        <div className="p-4 max-w-md mx-auto">
          
          {buyAgainProducts.length > 0 && selectedCategory === "All" && !searchQuery && (
            <div className="pb-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-[15px] font-extrabold text-gray-900 flex items-center gap-2"><Star className="w-4 h-4 text-orange-400 fill-current" /> Buy Again</h2>
              </div>
              <div className="flex overflow-x-auto gap-4 pb-2 snap-x hide-scrollbar -mx-4 px-4">
                {buyAgainProducts.map(product => {
                  const cartItem = cart.find((item) => item.id === product.id);
                  const quantity = cartItem ? cartItem.quantity : 0;
                  return (
                    <div key={product.id} className="min-w-[140px] w-[140px] snap-start">
                      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-full relative">
                        <div>
                          <div className="aspect-square bg-gray-50 rounded-xl mb-2 overflow-hidden flex items-center justify-center relative">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <span className="text-3xl font-bold text-gray-400">{product.name.charAt(0)}</span>
                            )}
                          </div>
                          <h3 className="font-bold text-gray-900 text-[13px] leading-tight line-clamp-2 min-h-[30px]">{product.name}</h3>
                          {product.nameHi && <p className="text-[10px] text-gray-500 truncate mt-0.5">{product.nameHi}</p>}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <p className="font-extrabold text-[#0e783a] text-sm">₹{product.price}</p>
                          {quantity === 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(product.id, 1);
                              }}
                              className="w-7 h-7 flex items-center justify-center bg-[#0e783a] text-white rounded-lg shadow-sm hover:bg-[#0c6631] active:scale-95 transition-transform"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                              <button onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, -1); }} className="w-6 h-6 flex items-center justify-center text-[#0e783a] bg-white rounded shadow-sm hover:bg-gray-50 active:scale-95"><Minus className="w-3 h-3" /></button>
                              <span className="w-5 text-center text-xs font-bold text-gray-900">{quantity}</span>
                              <button onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, 1); }} className="w-6 h-6 flex items-center justify-center text-[#0e783a] bg-white rounded shadow-sm hover:bg-gray-50 active:scale-95"><Plus className="w-3 h-3" /></button>
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

          {isAdmin && (`;

code = code.replace(orderInsertionPoint, replacementStr);
fs.writeFileSync('src/App.tsx', code);
