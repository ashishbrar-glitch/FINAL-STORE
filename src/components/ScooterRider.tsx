import { useState, useEffect } from "react";
import { motion } from "motion/react";

export default function ScooterRider() {
  const [isResting, setIsResting] = useState(false);
  const [pos, setPos] = useState({ x: -100, y: -100, scaleX: 1 });
  const [windowSize, setWindowSize] = useState({ w: 1000, h: 800 });

  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    handleResize(); // get initial size
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isResting) {
      const timer = setTimeout(() => {
        setIsResting(false);
      }, 5000);
      return () => clearTimeout(timer);
    }

    // Set a random position when resuming or mounting
    setPos(prev => {
      const nextX = Math.random() * (windowSize.w - 100) + 50;
      const nextY = Math.random() * (windowSize.h - 150) + 75;
      return { x: nextX, y: nextY, scaleX: nextX < prev.x ? -1 : 1 };
    });

    const interval = setInterval(() => {
      setPos((prev) => {
        const nextX = Math.random() * (windowSize.w - 80) + 40;
        const nextY = Math.random() * (windowSize.h - 120) + 60;
        const isMovingLeft = nextX < prev.x;
        return { x: nextX, y: nextY, scaleX: isMovingLeft ? -1 : 1 };
      });
    }, 8000); // Change direction every 8 seconds

    return () => clearInterval(interval);
  }, [isResting, windowSize]);

  // When resting, move it to the top right beside the cart button
  // Header height is roughly 64px, cart is on the right padding px-4
  const targetX = isResting ? windowSize.w - 75 : pos.x;
  const targetY = isResting ? 32 : pos.y;
  const targetScaleX = isResting ? 1 : pos.scaleX;

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      <motion.div
        className="absolute pointer-events-auto cursor-pointer flex flex-col items-center justify-center"
        animate={{ 
          x: targetX, 
          y: targetY 
        }}
        transition={{
          x: { type: isResting ? "spring" : "tween", duration: isResting ? 1 : 8, ease: "linear" },
          y: { type: isResting ? "spring" : "tween", duration: isResting ? 1 : 8, ease: "linear" }
        }}
        onClick={() => setIsResting(true)}
        style={{ translateX: "-50%", translateY: "-50%" }}
      >
        {isResting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute top-12 md:top-14 bg-white px-3 py-2 rounded-xl shadow-xl border border-orange-100 text-[10px] md:text-xs font-bold text-orange-600 whitespace-nowrap z-10"
          >
            Rider is on the way! 🛵
            <div className="absolute -top-1.5 right-6 w-3 h-3 bg-white rotate-45 border-t border-l border-orange-100" />
          </motion.div>
        )}
        <motion.img
          animate={{ scaleX: targetScaleX }}
          transition={{ duration: 0.3 }}
          src="/scooter.png"
          alt="Delivery Rider"
          className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-full shadow-md border-2 border-yellow-400 select-none bg-white"
          draggable="false"
        />
      </motion.div>
    </div>
  );
}
