const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /const floatingCartFab = cart\.length > 0 && \([\s\S]*?\n  \);/g;

const newCart = `const floatingCartFab = cart.length > 0 && (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-3 py-3 pointer-events-none">
      <div className="max-w-md mx-auto relative pointer-events-auto">
        <button
          onClick={() => setCurrentView("cart")}
          className="w-full bg-[#0c831f] text-white rounded-[16px] px-4 py-3 flex items-center justify-between shadow-[0_8px_20px_rgba(12,131,31,0.25)] active:scale-[0.98] transition-transform overflow-hidden relative"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-[100%] animate-[shimmer_2s_infinite]"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-black/10 rounded-[10px] flex items-center justify-center border border-white/10 backdrop-blur-sm shadow-inner">
               <svg className="w-5 h-5 text-white fill-current drop-shadow-sm" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
               </svg>
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="font-bold text-[14px] leading-[1.1] flex items-center gap-1.5">
                {cart.reduce((a, b) => a + b.quantity, 0)} ITEM{cart.reduce((a, b) => a + b.quantity, 0) > 1 ? 'S' : ''}
              </span>
              <motion.div
                key={finalTotal}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="text-[12px] font-medium text-green-100 flex items-center gap-1"
              >
                ₹{finalTotal} <span className="w-1 h-1 bg-green-200/50 rounded-full inline-block mx-0.5"></span> plus taxes
              </motion.div>
            </div>
          </div>

          <div className="flex items-center gap-1 relative z-10">
            <span className="font-bold text-[14px]">View cart</span>
            <ChevronRight className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>
    </div>
  );`;

code = code.replace(regex, newCart);
fs.writeFileSync('src/App.tsx', code);
