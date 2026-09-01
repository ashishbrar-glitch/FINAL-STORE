const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetProceedBtn = `                className="flex-1 bg-[#0e783a] text-white px-6 py-3.5 rounded-full font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                Proceed <ChevronRight className="w-5 h-5" />`;

const replaceProceedBtn = `                className="flex-1 bg-[#1e40af] text-white px-6 py-3.5 rounded-full font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                Proceed <ChevronRight className="w-5 h-5" />`;

const targetLibSummary = `        {renderHeader("Booking Summary", () => setCurrentView("library"))}`;
const replaceLibSummary = `        {renderHeader("Booking Summary", () => setCurrentView("library"), undefined, "bg-[#1e40af]", "text-[#1e40af]")}`;

let patched = false;
if (code.includes(targetProceedBtn)) {
  code = code.replace(targetProceedBtn, replaceProceedBtn);
  patched = true;
}
if (code.includes(targetLibSummary)) {
  code = code.replace(targetLibSummary, replaceLibSummary);
  patched = true;
}

if (patched) {
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched Library Rest");
} else {
  console.log("Could not find library rest targets.");
}
