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
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Overlay for dim/blur effect, consistent with Dialog */}
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-0" />
          {/* Mobile swatch grid */}
          <div className="sm:hidden w-full max-w-xs mx-auto z-10">
            <div className="section-card p-4 flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-4">
                <span className="font-semibold text-lg flex items-center gap-2"><Palette className="h-5 w-5 text-accent/80" /> Theme</span>
                <button className="text-2xl text-muted-foreground hover:text-foreground" onClick={onClose}>&times;</button>
              </div>
              <div className="grid grid-cols-4 gap-3 w-full">
                {[...brightThemes, ...darkThemes].map((g) => (
                  <button
                    key={g.value}
                    className={cn(
                      "w-10 h-10 rounded-md flex items-center justify-center border-2 transition-all duration-150 relative",
                      g.value,
                      deckTheme === g.value ? "ring-2 ring-accent border-accent" : "border-transparent opacity-90 hover:opacity-100"
                    )}
                    aria-label={g.name}
                    onClick={() => { setDeckTheme(g.value); onClose(); }}
                  >
                    {deckTheme === g.value && (
                      <span className="absolute right-1 top-1 text-white text-xs bg-accent rounded-full w-4 h-4 flex items-center justify-center shadow">✓</span>
                    )}
                  </button>
                ))}
              </div>
              <button
                className="btn btn-primary w-full mt-6"
                onClick={handleSurpriseMe}
                type="button"
              >
                🎲 Surprise Me
              </button>
            </div>
          </div>
          {/* Desktop modal (unchanged) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              type: "spring",
              duration: 0.3,
              bounce: 0.2
            }}
            className="section-card p-6 w-full max-w-md relative z-10 hidden sm:block"
          >
            <button 
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              onClick={onClose}
            >
              ×
            </button>
            <div className="panel-header">
              <Palette className="h-4 w-4 text-accent/80" />
              <h2 className="panel-title">Choose Card Theme</h2>
            </div>
            <div className="mb-3" />
            {/* Bright Themes Section */}
            <div className="panel-divider" />
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
            <div className="panel-divider" />
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
              className="btn btn-primary w-full mt-6 mb-3"
              onClick={handleSurpriseMe}
              type="button"
            >
              🎲 Surprise Me
            </motion.button>
            {/* Close Button */}
            <button
              type="button"
              className="btn btn-secondary w-full"
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