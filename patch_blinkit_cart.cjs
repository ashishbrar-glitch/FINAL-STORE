const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldFab = `  const floatingCartFab = cart.length > 0 && (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <button
        onClick={() => setCurrentView("cart")}
        className="bg-[#0e783a] text-white p-4 rounded-full shadow-[0_8px_30px_rgba(14,120,58,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center relative"
      >
        <ShoppingCart className="w-6 h-6" />
        <motion.span 
          key={cart.reduce((a, b) => a + b.quantity, 0)}
          initial={{ scale: 0.5 }}
          animate={{ scale: [1.5, 1] }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] font-bold w-[22px] h-[22px] flex items-center justify-center rounded-full border-2 border-white shadow-sm"
        >
          {cart.reduce((a, b) => a + b.quantity, 0)}
        </motion.span>
      </button>
    </div>
  );`;

const newFab = `  const floatingCartFab = cart.length > 0 && (
    <div className="fixed bottom-4 left-4 right-4 z-40 md:max-w-md md:mx-auto">
      <button
        onClick={() => setCurrentView("cart")}
        className="w-full bg-[#0e783a] text-white px-4 py-3.5 rounded-xl shadow-[0_8px_30px_rgba(14,120,58,0.3)] active:scale-[0.98] transition-transform flex items-center justify-between"
      >
        <div className="flex flex-col items-start text-left">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 opacity-80" />
            <span className="text-xs font-semibold text-green-50 tracking-wide">
              {cart.reduce((a, b) => a + b.quantity, 0)} ITEM{cart.reduce((a, b) => a + b.quantity, 0) > 1 ? 'S' : ''}
            </span>
          </div>
          <span className="font-bold text-lg leading-none mt-1">
            <motion.div
              key={finalTotal}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              ₹{finalTotal}
            </motion.div>
          </span>
        </div>
        <div className="flex items-center gap-1 font-bold text-sm bg-white/10 px-3 py-1.5 rounded-lg">
          View Cart <ChevronRight className="w-4 h-4" />
        </div>
      </button>
    </div>
  );`;

if (code.includes(oldFab)) {
  code = code.replace(oldFab, newFab);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched to blinkit style");
} else {
  console.log("oldFab not found");
}
