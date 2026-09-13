const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `{cart.length > 0 && (
                <span className={\`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 \${iconBorderColor}\`}>
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}`;

const replacementStr = `{cart.length > 0 && (
                <motion.span 
                  key={cart.reduce((a, b) => a + b.quantity, 0)}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [1.5, 1] }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className={\`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 \${iconBorderColor}\`}
                >
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </motion.span>
              )}`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched badge successfully");
} else {
  console.log("Target block not found");
}
