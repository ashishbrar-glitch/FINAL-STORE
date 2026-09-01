const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                );
              })}
            </div>
          )}
        </div>`;

const replaceStr = `                );
              })}
            </div>
          )}

          {isSearching && (
            <div className={\`flex flex-col items-center justify-center \${displayedProducts.length > 0 ? 'py-8' : 'py-24'} px-4\`}>
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
          )}

          {!isSearching && displayedProducts.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No products found.</p>
            </div>
          )}

        </div>`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched grid end successfully");
} else {
  console.log("Could not find grid end target string.");
}
