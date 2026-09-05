const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `{buyAgainProducts.length > 0 && selectedCategory === "All" && !searchQuery && (
            <div className="pb-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-[15px] font-extrabold text-gray-900 flex items-center gap-2"><Star className="w-4 h-4 text-orange-400 fill-current" /> Buy Again</h2>
              </div>`;

const replaceStr = `{showBuyAgain && buyAgainProducts.length > 0 && selectedCategory === "All" && !searchQuery && (
            <div className="pb-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-[15px] font-extrabold text-gray-900 flex items-center gap-2"><Star className="w-4 h-4 text-orange-400 fill-current" /> Buy Again</h2>
                <button onClick={() => setShowBuyAgain(false)} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
