const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const importTarget = `import { AdminProductModal } from "./components/admin/AdminProductModal";`;
const importNew = `import { AdminProductModal } from "./components/admin/AdminProductModal";

const FunnySearchSkeleton = () => {
  const loadingMessages = [
    "AI is running down the aisles... 🏃💨",
    "Asking the store manager... 👨‍💼",
    "Looking behind the counter... 🔍",
    "Checking the godown... 📦",
    "Scanning the shelves... 🧐",
  ];
  const [msgIdx, React_useState] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      React_useState(i => (i + 1) % loadingMessages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex flex-col items-center pb-24 pt-4">
      <div className="py-4 px-4 text-center mb-4">
        <div className="inline-flex items-center gap-2 bg-[#0e783a]/10 px-4 py-2 rounded-full text-[#0e783a] font-bold text-xs tracking-wide">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span className="min-w-[200px]">{loadingMessages[msgIdx]}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full px-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col gap-2 relative">
            <div className="w-full aspect-square bg-gray-200 rounded-xl animate-pulse flex flex-col items-center justify-center overflow-hidden">
               <span className="text-4xl opacity-20 animate-bounce" style={{ animationDelay: \`\${i * 150}ms\` }}>
                 {['🛒', '🤔', '📦', '🔍', '🏃', '💡'][i-1]}
               </span>
            </div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mt-1"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
            <div className="absolute top-2 right-2 w-6 h-6 bg-gray-300 rounded-full animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
};`;

code = code.replace(importTarget, importNew);

const searchLoaderTarget = `{isSearching && displayedProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 px-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[2px] border-dashed border-[#0e783a]/30 animate-[spin_4s_linear_infinite]"></div>
                <div className="absolute inset-1.5 rounded-full border-[1.5px] border-[#0e783a]/20 border-t-[#0e783a] border-l-[#0e783a] animate-[spin_1.5s_cubic-bezier(0.68,-0.55,0.26,1.55)_infinite]"></div>
                <div className="absolute inset-3 rounded-full border-[1.5px] border-green-200 border-b-[#0e783a] border-r-[#0e783a] animate-[spin_2.5s_linear_infinite_reverse]"></div>
                <div className="w-3 h-3 bg-[#0e783a] rounded-full animate-pulse shadow-[0_0_15px_5px_rgba(14,120,58,0.4)]"></div>
              </div>
              <div className="mt-4 flex flex-col items-center">
                <div className="flex gap-1 mb-1.5">
                  <div className="w-1 h-1 bg-[#0e783a] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-1 h-1 bg-[#0e783a] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-1 h-1 bg-[#0e783a] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
                <h3 className="text-[#0e783a] font-bold text-[10px] tracking-[0.2em] uppercase">AI Deep Search</h3>
              </div>
            </div>
          )}`;

const searchLoaderNew = `{isSearching && displayedProducts.length === 0 && <FunnySearchSkeleton />}`;

code = code.replace(searchLoaderTarget, searchLoaderNew);
fs.writeFileSync('src/App.tsx', code);
