const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldFallback = `        {rightElement || (
          currentView !== "order" && (
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
                <motion.span 
                  key={cart.reduce((a, b) => a + b.quantity, 0)}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [1.5, 1] }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className={\`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 \${iconBorderColor}\`}
                >
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </motion.span>
              )}
            </button>
          </div>
        )
      )}`;

const newFallback = `        {rightElement !== undefined ? rightElement : (
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
                <motion.span 
                  key={cart.reduce((a, b) => a + b.quantity, 0)}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [1.5, 1] }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className={\`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 \${iconBorderColor}\`}
                >
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </motion.span>
              )}
            </button>
          </div>
      )}`;

if (code.includes(oldFallback)) {
  code = code.replace(oldFallback, newFallback);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched fallback successfully");
} else {
  console.log("Old fallback not found");
}
