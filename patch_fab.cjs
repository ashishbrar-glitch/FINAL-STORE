const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Create the FAB component
const fabCode = `
  const floatingCartFab = cart.length > 0 && (
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
  );
`;

// Insert it before `if (currentView === "order") {`
code = code.replace('if (currentView === "order") {', fabCode + '\n  if (currentView === "order") {');

// 2. Replace the bottom bar in `order` view
const orderBarTarget = `{cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
            <div className="max-w-md mx-auto flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">{cart.reduce((a, b) => a + b.quantity, 0)} items</p>
                <p className="text-lg font-bold text-gray-900 leading-none">
                  ₹{finalTotal} {deliveryFee === 0 && <span className="text-xs font-normal text-[#0e783a]">(Free Delivery)</span>}
                </p>
              </div>
              <button
                onClick={() => setCurrentView("cart")}
                className="flex-1 bg-[#0e783a] text-white px-6 py-3.5 rounded-full font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                View Cart <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}`;

code = code.replace(orderBarTarget, '{floatingCartFab}');

// 3. Replace the bottom bar in `home` view
const homeBarTarget = `{cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-0.5">{cart.reduce((a, b) => a + b.quantity, 0)} items</p>
              <p className="text-lg font-bold text-gray-900 leading-none">
                ₹{finalTotal} {deliveryFee === 0 && <span className="text-xs font-normal text-[#0e783a]">(Free Delivery)</span>}
              </p>
            </div>
            <button
              onClick={() => setCurrentView("cart")}
              className="flex-1 bg-[#0e783a] text-white px-6 py-3.5 rounded-full font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              View Cart <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}`;
      
code = code.replace(homeBarTarget, '{floatingCartFab}');

// 4. Update Cart View Header (Empty Cart Option)
const cartHeaderTarget = `{renderHeader("Order Summary", () => setCurrentView("order"))}`;
const cartHeaderNew = `{renderHeader(
          "Order Summary", 
          () => setCurrentView("order"),
          cart.length > 0 ? (
            <button 
              onClick={() => setCart([])} 
              className="text-xs font-bold text-red-500 bg-white px-3 py-1.5 rounded-full shadow-sm hover:bg-red-50 active:scale-95 transition-all border border-red-100"
            >
              Empty Cart
            </button>
          ) : null
        )}`;
code = code.replace(cartHeaderTarget, cartHeaderNew);

// 5. Add Empty State for Cart View
const emptyStateNew = `        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
            <div className="w-20 h-20 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center mb-5 shadow-inner">
              <ShoppingCart className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Your cart is empty</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-[250px]">Looks like you haven't added any items to your order yet.</p>
            <button 
              onClick={() => setCurrentView("order")} 
              className="bg-[#0e783a] text-white px-8 py-3 rounded-full font-medium active:scale-95 transition-transform flex items-center gap-2 shadow-sm"
            >
              Start Shopping <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-4 max-w-md mx-auto space-y-4">
`;

// we need to wrap the whole cart content.
// Current structure:
//         {renderHeader(...)}
//         <div className="p-4 max-w-md mx-auto space-y-4">
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 divide-y">
// ...
//         </div>
//         <div className="fixed bottom-0 ..."> ... </div>

// We can just replace the opening of the content with a condition, and at the end of the cart view before {adminModals}, close it.

fs.writeFileSync('src/App.tsx', code);
