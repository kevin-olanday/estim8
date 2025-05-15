import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { PlayerAvatar } from "./player-avatar";
import { Confetti } from "../ui/confetti";

const avatarAnimations = [
  {
    key: 'jump',
    initial: { y: 0 },
    animate: { y: [-10, -32, 0, -16, 0] },
    transition: { duration: 1.2, times: [0, 0.3, 0.6, 0.8, 1], repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" },
  },
  {
    key: 'spin',
    initial: { rotate: 0 },
    animate: { rotate: [0, 360, 0] },
    transition: { duration: 1.4, times: [0, 0.5, 1], repeat: Infinity, repeatDelay: 0.7, ease: "linear" },
  },
  {
    key: 'wobble',
    initial: { rotate: 0 },
    animate: { rotate: [0, 10, -10, 10, 0] },
    transition: { duration: 1.1, times: [0, 0.2, 0.5, 0.8, 1], repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" },
  },
  {
    key: 'double-jump',
    initial: { y: 0 },
    animate: { y: [-10, -32, 0, -24, 0] },
    transition: { duration: 1.5, times: [0, 0.2, 0.5, 0.7, 1], repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" },
  },
  {
    key: 'flip-horizontal',
    initial: { scaleX: 1 },
    animate: { scaleX: [1, -1, 1] },
    transition: { duration: 1.2, times: [0, 0.5, 1], repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" },
  },
  {
    key: 'spin-reverse',
    initial: { rotate: 0 },
    animate: { rotate: [0, -360, 0] },
    transition: { duration: 1.4, times: [0, 0.5, 1], repeat: Infinity, repeatDelay: 0.7, ease: "linear" },
  },
];

export default function ConsensusBanner({ show, players = [], onComplete }: { show: boolean; players: any[]; onComplete?: () => void }) {
  const [visible, setVisible] = useState(show);

  // Assign a random animation to each avatar (memoized per render)
  const avatarAnimIndexes = useMemo(() =>
    players.map(() => Math.floor(Math.random() * avatarAnimations.length)),
    [players.length, show]
  );

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onComplete) onComplete();
      }, 5000); // total animation duration
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <>
          <Confetti duration={5000} />
          <motion.div
            initial={{ y: "-50%", scale: 0.9, opacity: 0 }}
            animate={{ y: "-50%", scale: 1, opacity: 1 }}
            exit={{ y: "-50%", scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, duration: 0.7 }}
            className="fixed left-0 top-1/2 z-[100] w-screen flex flex-col items-center pointer-events-none"
            style={{ transform: "translateY(-50%)" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1.08, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="w-screen h-48 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white font-extrabold text-3xl md:text-4xl shadow-2xl border-2 border-accent flex flex-col items-center justify-center"
              style={{ boxShadow: "0 0 32px 0 #a5b4fc55", borderRadius: 0, padding: 0 }}
            >
              <span className="text-6xl md:text-7xl font-extrabold w-full text-center leading-tight">Consensus Achieved!</span>
              <div className="flex flex-row items-center justify-center mt-8">
                {players.map((player, i) => {
                  const anim = avatarAnimations[avatarAnimIndexes[i] % avatarAnimations.length];
                  return (
                    <motion.div
                      key={player.id}
                      initial={anim.initial}
                      animate={anim.animate}
                      transition={anim.transition}
                      style={{ marginLeft: i === 0 ? 0 : -12, marginRight: 0 }}
                    >
                      <PlayerAvatar
                        name={player.name}
                        avatarStyle={player.avatarStyle}
                        avatarSeed={player.avatarSeed}
                        size="lg"
                        className="w-16 h-16"
                      />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </>
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