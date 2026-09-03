const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetHeader = `{title === "BCN Store" ? (
          <div className="bg-white rounded-xl px-2 py-1 shadow-sm">
            <img src="/logo.png" alt="BCN Store Logo" className="h-10 object-contain" />
          </div>
        ) : (`;

const replaceHeader = `{title === "BCN Store" ? (
          <div className="flex items-center gap-2.5">
            <div className="bg-white rounded-xl px-2 py-1 shadow-sm shrink-0">
              <img src="/logo.png" alt="BCN Store Logo" className="h-8 sm:h-9 object-contain" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[9px] font-extrabold text-[#EFC04E] uppercase tracking-widest leading-tight">Available in</span>
              <span className="text-[12px] font-semibold text-white leading-tight flex items-center gap-1">Singhwa Khas & Madanheri <span className="text-[10px]">📍</span></span>
            </div>
          </div>
        ) : (`;

if (content.includes(targetHeader)) {
  content = content.replace(targetHeader, replaceHeader);
  fs.writeFileSync(file, content);
  console.log("Patched App.tsx with location text");
} else {
  console.log("Could not find target header to replace");
}
