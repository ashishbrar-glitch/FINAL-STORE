const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetOpen = `<div className="p-4 max-w-md mx-auto space-y-4">`;
const newOpen = `        {cart.length === 0 ? (
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
          <>
            <div className="p-4 max-w-md mx-auto space-y-4">`;

code = code.replace(targetOpen, newOpen);

const targetClose = `          </div>
        </div>
        {adminModals}`;

const newClose = `          </div>
        </div>
        </>)}
        {adminModals}`;

code = code.replace(targetClose, newClose);

fs.writeFileSync('src/App.tsx', code);
