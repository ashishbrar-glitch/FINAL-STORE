const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldFabRegex = /const floatingCartFab = cart\.length > 0 && \([\s\S]*?\n  \);/;

const newFab = `const floatingCartFab = cart.length > 0 && (
    <div className="fixed bottom-4 left-4 right-4 z-40 md:max-w-md md:mx-auto">
      <button
        onClick={() => setCurrentView("cart")}
        className="w-full bg-[#0c831f] text-white p-3 rounded-2xl shadow-[0_4px_12px_rgba(12,131,31,0.4)] active:scale-[0.98] transition-transform flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col items-start text-left justify-center">
            <span className="text-[13px] font-medium text-white/90 leading-tight">
              {cart.reduce((a, b) => a + b.quantity, 0)} item{cart.reduce((a, b) => a + b.quantity, 0) > 1 ? 's' : ''}
            </span>
            <span className="font-bold text-[17px] leading-tight mt-0.5 flex items-center">
              <motion.div
                key={finalTotal}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                ₹ {finalTotal}
              </motion.div>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 font-bold text-[16px] mr-2">
          View Cart <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </button>
    </div>
  );`;

code = code.replace(oldFabRegex, newFab);
fs.writeFileSync('src/App.tsx', code);
