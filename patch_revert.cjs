const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add "Add New Item" button in Order Items view
const productListStartRegex = /(<div className="p-4 max-w-md mx-auto">\s*)({\s*displayedProducts\.length > 0 && \()/m;
code = code.replace(productListStartRegex, `$1{isAdmin && (
            <div className="mb-4">
              <button
                onClick={() => setEditingProduct("new")}
                className="w-full bg-green-50 text-[#0e783a] py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-green-200 border-dashed"
              >
                <Plus className="w-5 h-5" /> Add New Item
              </button>
            </div>
          )}
          $2`);

// 2. Add Edit2 button to Order Items product cards
const productCardRegex = /(<div\s*key={product\.id}\s*className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-full relative"\s*>)/m;
code = code.replace(productCardRegex, `$1
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
                    )}`);

// 3. Add Edit2 button to Home category bubbles
const homeCategoryRegex = /(<div\s*key={cat\.id}\s*className="flex flex-col items-center gap-2 cursor-pointer relative shrink-0 min-w-\[56px\]"\s*>)/m;
code = code.replace(homeCategoryRegex, `$1
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCategory(cat);
                    }}
                    className="absolute -top-1 -right-1 z-10 p-1 bg-white border border-gray-200 rounded-full shadow-sm text-gray-500 hover:text-[#0e783a]"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}`);

// 4. Add "Add New" category button
const homeCategoryLoopEndRegex = /({\s*cat\.nameEn\s*}\s*<\/p>\s*)}\s*<\/div>\s*<\/div>\s*\)\)}\s*)(<div)/m;
code = code.replace(homeCategoryLoopEndRegex, `$1{isAdmin && (
              <div 
                className="flex flex-col items-center gap-2 cursor-pointer relative shrink-0 min-w-[56px]"
                onClick={() => setEditingCategory("new")}
              >
                <div className="w-14 h-14 bg-green-50 border border-green-200 border-dashed rounded-full flex items-center justify-center text-[#0e783a] shadow-sm">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-center leading-tight whitespace-nowrap text-gray-400">Add New</span>
              </div>
            )}
            $2`);

// 5. Re-add modals at the end
const modalsRegex = /({\/\* Floating WhatsApp Action Button \*\/})/m;
code = code.replace(modalsRegex, `{/* Admin Modals */}
      {editingCategory && (
        <AdminCategoryModal 
          category={editingCategory === "new" ? null : editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={() => { setEditingCategory(null); fetchData(); }}
        />
      )}
      {editingProduct && (
        <AdminProductModal 
          product={editingProduct === "new" ? null : editingProduct}
          categories={dbCategories}
          onClose={() => setEditingProduct(null)}
          onSaved={() => { setEditingProduct(null); fetchData(); }}
        />
      )}
      
      $1`);

fs.writeFileSync('src/App.tsx', code);
console.log("Reverted UI successfully");
