import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Palette } from "lucide-react";

interface GradientPreset {
  name: string;
  value: string;
  from: string;
  to: string;
  category: "bright" | "dark";
}

interface ThemeSelectorModalProps {
  show: boolean;
  onClose: () => void;
  gradientPresets: GradientPreset[];
  deckTheme: string;
  setDeckTheme: (theme: string) => void;
  handleSurpriseMe: () => void;
}

function getContrastYIQ(hex: string): 'text-black' | 'text-white' {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  const yiq = (r*299 + g*587 + b*114) / 1000
  return yiq >= 128 ? 'text-black' : 'text-white'
}

const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  show,
  onClose,
  gradientPresets,
  deckTheme,
  setDeckTheme,
  handleSurpriseMe,
}) => {
  if (!show) return null;

  const brightThemes = gradientPresets.filter(t => t.category === "bright");
  const darkThemes = gradientPresets.filter(t => t.category === "dark");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              type: "spring",
              duration: 0.3,
              bounce: 0.2
            }}
            className="bg-muted rounded-xl shadow-xl p-6 w-full max-w-md relative border border-border/50"
          >
            <button 
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              onClick={onClose}
            >
              ×
            </button>
            <div className="flex items-center justify-between py-3 px-4 border-b border-border bg-muted/40 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-accent/80" />
                <h3 className="text-base font-semibold text-muted-foreground tracking-tight">Choose Card Theme</h3>
              </div>
            </div>
            <div className="mb-3" />
            
            {/* Bright Themes Section */}
            <div className="border-t border-border/40 my-4" />
            <h4 className="font-semibold tracking-wider text-muted-foreground text-sm uppercase mb-3">
              Bright Themes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {brightThemes.map((g) => (
                <motion.label
                  key={g.value}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all duration-200",
                    "hover:bg-surface/50 hover:ring-2 hover:ring-accent/30",
                    deckTheme === g.value && "ring-2 ring-accent/60 shadow-md bg-surface/50"
                  )}
                >
                  <input
                    type="radio"
                    name="deckTheme"
                    checked={deckTheme === g.value}
                    onChange={() => { setDeckTheme(g.value); onClose(); }}
                    className="accent-accent"
                  />
                  <span className={cn("inline-block w-8 h-8 rounded-lg flex items-center justify-center", g.value)}>
                    <span className={cn("font-bold text-xs", getContrastYIQ(g.from))}>A</span>
                  </span>
                  <span className="text-sm font-medium text-foreground">{g.name}</span>
                </motion.label>
              ))}
            </div>

            {/* Dark Themes Section */}
            <div className="border-t border-border/40 my-4" />
            <h4 className="font-semibold tracking-wider text-muted-foreground text-sm uppercase mb-3">
              Dark Themes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {darkThemes.map((g) => (
                <motion.label
                  key={g.value}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all duration-200",
                    "hover:bg-surface/50 hover:ring-2 hover:ring-accent/30",
                    deckTheme === g.value && "ring-2 ring-accent/60 shadow-md bg-surface/50"
                  )}
                >
                  <input
                    type="radio"
                    name="deckTheme"
                    checked={deckTheme === g.value}
                    onChange={() => { setDeckTheme(g.value); onClose(); }}
                    className="accent-accent"
                  />
                  <span className={cn("inline-block w-8 h-8 rounded-lg flex items-center justify-center", g.value)}>
                    <span className={cn("font-bold text-xs", getContrastYIQ(g.from))}>A</span>
                  </span>
                  <span className="text-sm font-medium text-foreground">{g.name}</span>
                </motion.label>
              ))}
            </div>

            {/* Surprise Me Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-6 mb-3 px-4 py-2.5 rounded-lg bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
              onClick={handleSurpriseMe}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              🎲 Surprise Me
            </motion.button>

            {/* Close Button */}
            <button
              type="button"
              className="w-full px-4 py-2.5 rounded-lg border border-border text-muted-foreground text-sm font-medium hover:bg-surface/50 hover:text-foreground transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ThemeSelectorModal; 