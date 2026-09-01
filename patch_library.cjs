const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetLibHeader = `        {renderHeader("Library Seats", () => setCurrentView("home"))}`;
const replaceLibHeader = `        {renderHeader("Library Seats", () => setCurrentView("home"), undefined, "bg-[#1e40af]", "text-[#1e40af]")}`;

const targetRenderSeat = `                  ? "bg-[#0e783a] border-[#0e783a] text-white shadow-md transform scale-105"`;
const replaceRenderSeat = `                  ? "bg-[#1e40af] border-[#1e40af] text-white shadow-md transform scale-105"`;

const targetSelectedLegend = `              <div className="w-5 h-5 bg-[#0e783a] border-2 border-[#0e783a] rounded-md"></div>`;
const replaceSelectedLegend = `              <div className="w-5 h-5 bg-[#1e40af] border-2 border-[#1e40af] rounded-md"></div>`;

const targetGirlsTab = `              className={\`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors \${activeLibrarySection === "girls" ? "bg-[#0e783a] text-white shadow" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}\`}`;
const replaceGirlsTab = `              className={\`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors \${activeLibrarySection === "girls" ? "bg-[#1e40af] text-white shadow" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}\`}`;

const targetBoysTab = `              className={\`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors \${activeLibrarySection === "boys" ? "bg-[#0e783a] text-white shadow" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}\`}`;
const replaceBoysTab = `              className={\`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors \${activeLibrarySection === "boys" ? "bg-[#1e40af] text-white shadow" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}\`}`;

let patched = false;

if (code.includes(targetLibHeader)) {
  code = code.replace(targetLibHeader, replaceLibHeader);
  patched = true;
}
if (code.includes(targetRenderSeat)) {
  code = code.replace(targetRenderSeat, replaceRenderSeat);
  patched = true;
}
if (code.includes(targetSelectedLegend)) {
  code = code.replace(targetSelectedLegend, replaceSelectedLegend);
  patched = true;
}
if (code.includes(targetGirlsTab)) {
  code = code.replace(targetGirlsTab, replaceGirlsTab);
  patched = true;
}
if (code.includes(targetBoysTab)) {
  code = code.replace(targetBoysTab, replaceBoysTab);
  patched = true;
}

if (patched) {
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched Library Seats");
} else {
  console.log("Could not find library targets.");
}
