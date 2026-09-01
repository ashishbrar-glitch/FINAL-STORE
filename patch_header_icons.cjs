const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetHeaderTop = `  const renderHeader = (
    title: string,
    onBack?: () => void,
    rightElement?: React.ReactNode,
    headerColor: string = "bg-[#0e783a]",
    iconTextColor: string = "text-[#0e783a]"
  ) => (`;

const replaceHeaderTop = `  const renderHeader = (
    title: string,
    onBack?: () => void,
    rightElement?: React.ReactNode,
    headerColor: string = "bg-[#0e783a]",
    iconTextColor: string = "text-[#0e783a]",
    iconBorderColor: string = "border-[#0e783a]"
  ) => (`;

const targetHeaderBottom = `      {rightElement || (
        currentView !== "cart" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="p-2 text-[#0e783a] bg-white rounded-full hover:bg-green-50 shadow-sm transition-colors"
              title="Install App"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentView("cart")}
              className="relative p-2 text-[#0e783a] bg-white rounded-full hover:bg-green-50 shadow-sm transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-[#0e783a]">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        )
      )}`;

const replaceHeaderBottom = `      {rightElement || (
        currentView !== "cart" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className={\`p-2 \${iconTextColor} bg-white rounded-full hover:bg-gray-50 shadow-sm transition-colors\`}
              title="Install App"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentView("cart")}
              className={\`relative p-2 \${iconTextColor} bg-white rounded-full hover:bg-gray-50 shadow-sm transition-colors\`}
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className={\`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 \${iconBorderColor}\`}>
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        )
      )}`;

const targetLibHeader = '        {renderHeader("Library Seats", () => setCurrentView("home"), undefined, "bg-[#1e40af]", "text-[#1e40af]")}';
const replaceLibHeader = '        {renderHeader("Library Seats", () => setCurrentView("home"), undefined, "bg-[#1e40af]", "text-[#1e40af]", "border-[#1e40af]")}';

const targetLibSummary = '        {renderHeader("Booking Summary", () => setCurrentView("library"), undefined, "bg-[#1e40af]", "text-[#1e40af]")}';
const replaceLibSummary = '        {renderHeader("Booking Summary", () => setCurrentView("library"), undefined, "bg-[#1e40af]", "text-[#1e40af]", "border-[#1e40af]")}';

let patched = false;

if (code.includes(targetHeaderTop) && code.includes(targetHeaderBottom)) {
  code = code.replace(targetHeaderTop, replaceHeaderTop);
  code = code.replace(targetHeaderBottom, replaceHeaderBottom);
  patched = true;
} else {
  console.log("Header missing.");
}

if (code.includes(targetLibHeader)) {
  code = code.replace(targetLibHeader, replaceLibHeader);
}

if (code.includes(targetLibSummary)) {
  code = code.replace(targetLibSummary, replaceLibSummary);
}

if (patched) {
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched Header Icons");
}
