const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Update handleSendOrder to clear cart and change view
const oldHandleSendOrder = `    const url = \`https://wa.me/\${PHONE_NUMBER}?text=\${encodeURIComponent(message)}\`;
    window.open(url, "_blank");
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 8000);`;

const newHandleSendOrder = `    const url = \`https://wa.me/\${PHONE_NUMBER}?text=\${encodeURIComponent(message)}\`;
    window.open(url, "_blank");
    setCart([]);
    setCurrentView("home");
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 8000);`;

code = code.replace(oldHandleSendOrder, newHandleSendOrder);

// 2. Add confetti to home view
const oldHomeView = `  // --- HOME VIEW ---
  return (
    <div className="min-h-screen bg-white pb-20 overflow-x-hidden">
      {renderHeader("BCN Store")}`;

const newHomeView = `  // --- HOME VIEW ---
  return (
    <div className="min-h-screen bg-white pb-20 overflow-x-hidden">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={400} gravity={0.2} style={{ zIndex: 9999 }} />}
      {renderHeader("BCN Store")}`;

code = code.replace(oldHomeView, newHomeView);

fs.writeFileSync('src/App.tsx', code);
