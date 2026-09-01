const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-24 px-4">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[3px] border-dashed border-[#0e783a]/30 animate-[spin_4s_linear_infinite]"></div>
                <div className="absolute inset-2 rounded-full border-2 border-[#0e783a]/20 border-t-[#0e783a] border-l-[#0e783a] animate-[spin_1.5s_cubic-bezier(0.68,-0.55,0.26,1.55)_infinite]"></div>
                <div className="absolute inset-5 rounded-full border-2 border-green-200 border-b-[#0e783a] border-r-[#0e783a] animate-[spin_2.5s_linear_infinite_reverse]"></div>
                <div className="w-5 h-5 bg-[#0e783a] rounded-full animate-pulse shadow-[0_0_20px_8px_rgba(14,120,58,0.4)]"></div>
              </div>
              <div className="mt-8 flex flex-col items-center">
                <div className="flex gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 bg-[#0e783a] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-1.5 h-1.5 bg-[#0e783a] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-1.5 h-1.5 bg-[#0e783a] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
                <h3 className="text-[#0e783a] font-bold text-sm tracking-[0.2em] uppercase mb-1">AI Deep Search</h3>
                <p className="text-gray-400 text-xs text-center max-w-[220px]">Scanning catalog for semantic matches...</p>
              </div>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">`;

const replaceStr = `          {displayedProducts.length > 0 && (
            <div className="grid grid-cols-3 gap-3">`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched grid start successfully");
} else {
  console.log("Could not find grid target string.");
}
