import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function ConsensusBanner({ show, onComplete }: { show: boolean; onComplete?: () => void }) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onComplete) onComplete();
      }, 3200); // total animation duration
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, scale: 0.8, opacity: 0 }}
          animate={{ y: 0, scale: 1.08, opacity: 1 }}
          exit={{ opacity: 0, scale: 0.7, y: -30 }}
          transition={{ type: "spring", stiffness: 300, damping: 22, duration: 0.7, ease: "easeInOut" }}
          className="fixed top-20 left-0 w-full flex justify-center z-50"
        >
          <div className="relative flex items-center justify-center">
            {/* Sparkle */}
            <motion.span
              initial={{ opacity: 0, scale: 0.7, rotate: 0 }}
              animate={{ opacity: 1, scale: 1.2, rotate: 20 }}
              exit={{ opacity: 0, scale: 0.7, rotate: 0 }}
              transition={{ duration: 0.7, ease: "easeIn" }}
              className="absolute -top-4 right-0 z-10"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
                <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.42 1.42M6.34 17.66l-1.42 1.42M17.66 17.66l-1.42-1.42M6.34 6.34L4.92 4.92" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </motion.span>
            {/* Banner */}
            <motion.div
              initial={{ boxShadow: "0 0 0 0 var(--accent-color, #6366f1)" }}
              animate={{
                boxShadow: [
                  "0 0 0 0 var(--accent-color, #6366f1)",
                  "0 0 16px 8px var(--accent-color, #6366f1aa)",
                  "0 0 0 0 var(--accent-color, #6366f1)"
                ]
              }}
              transition={{ duration: 1.2, times: [0, 0.5, 1] }}
              className="px-6 py-2 rounded-2xl text-white font-extrabold text-xl shadow-lg border-2 border-accent animate-pulse-slow animate-gradient-consensus"
              style={{ filter: "drop-shadow(0 0 8px var(--accent-color, #6366f1))", background: "linear-gradient(270deg, var(--accent-from, #6366f1), var(--accent-to, #a21caf), var(--accent-from, #6366f1))", backgroundSize: "400% 400%" }}
            >
              🎉 Consensus Achieved!
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Add slow pulse and animated gradient if not present
if (typeof window !== 'undefined') {
  if (!document.getElementById('pulse-slow-style-consensus')) {
    const style = document.createElement('style');
    style.id = 'pulse-slow-style-consensus';
    style.innerHTML = `
      @keyframes pulseSlowConsensus {
        0%, 100% { opacity: 1; }
        50% { opacity: .7; }
      }
      .animate-pulse-slow {
        animation: pulseSlowConsensus 2.5s cubic-bezier(0.4,0,0.6,1) infinite;
      }
    `;
    document.head.appendChild(style);
  }
  if (!document.getElementById('gradient-anim-style-consensus')) {
    const style = document.createElement('style');
    style.id = 'gradient-anim-style-consensus';
    style.innerHTML = `
      @keyframes gradientShiftConsensus {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      .animate-gradient-consensus {
        background-size: 400% 400%;
        animation: gradientShiftConsensus 1.2s linear infinite;
      }
    `;
    document.head.appendChild(style);
  }
} 