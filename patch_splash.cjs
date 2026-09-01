const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add motion import if not present
if (!code.includes("from 'motion/react'") && !code.includes('from "motion/react"')) {
  code = code.replace(
    /import React, \{ useState, useMemo, useEffect \} from "react";/,
    'import React, { useState, useMemo, useEffect } from "react";\nimport { motion, AnimatePresence } from "motion/react";'
  );
}

// Add SplashScreen component
const splashScreenComponent = `
function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    // Only block briefly, let user get to content
    const timer = setTimeout(() => {
      onFinish();
    }, 2200); 
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[9999] bg-[#0e783a] flex flex-col items-center justify-center text-white overflow-hidden"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
        className="flex flex-col items-center gap-6 relative z-10"
      >
        <motion.div 
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="bg-white p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
        >
          <img src="/logo.png" alt="BCN Store Logo" className="h-24 w-auto object-contain" />
        </motion.div>
        
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">BCN Store</h1>
          <div className="flex items-center gap-3 text-[#a5e0bc] font-bold tracking-[0.2em] text-xs uppercase">
            <span className="w-10 h-[2px] bg-[#a5e0bc]/50 rounded-full"></span>
            Singhwa Madanheri
            <span className="w-10 h-[2px] bg-[#a5e0bc]/50 rounded-full"></span>
          </div>
        </div>
      </motion.div>

      {/* Decorative background circles */}
      <motion.div 
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute top-1/4 -right-20 w-80 h-80 bg-white rounded-full blur-[80px] pointer-events-none"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
        className="absolute -bottom-10 -left-10 w-64 h-64 bg-white rounded-full blur-[60px] pointer-events-none"
      />
    </motion.div>
  );
}
`;

// Insert the component before export default function App()
code = code.replace(/export default function App\(\) \{/, splashScreenComponent + '\nexport default function App() {');

// Wrap App content with AnimatePresence and add state
const appRegex = /export default function App\(\) \{\s*return \(\s*<>\s*<MainContent \/>\s*<ScooterRider \/>\s*<\/>\s*\);\s*\}/;

const newAppCode = `export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      </AnimatePresence>
      <MainContent />
      <ScooterRider />
    </>
  );
}`;

code = code.replace(appRegex, newAppCode);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched splash screen");
