import React from "react";
import { cn } from "@/lib/utils";

interface GradientPreset {
  name: string;
  value: string;
  from: string;
  to: string;
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl shadow-xl p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-lg" onClick={onClose}>&times;</button>
        <h3 className="text-lg font-semibold mb-4">Choose Card Theme</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {gradientPresets.map((g) => (
            <label
              key={g.value}
              className={cn(
                "flex items-center space-x-3 p-2 rounded-md cursor-pointer transition hover:ring-2 hover:scale-[1.02]",
                deckTheme === g.value && "ring-2 ring-blue-400 scale-[1.02]"
              )}
            >
              <input
                type="radio"
                name="deckTheme"
                checked={deckTheme === g.value}
                onChange={() => { setDeckTheme(g.value); onClose(); }}
                className="accent-blue-500"
              />
              <span className={cn("inline-block w-8 h-8 rounded-lg flex items-center justify-center", g.value)}>
                <span className={cn("font-bold text-xs", getContrastYIQ(g.from))}>A</span>
              </span>
              <span className="text-sm font-medium">{g.name}</span>
            </label>
          ))}
        </div>
        <button
          type="button"
          className="w-full mb-2 px-3 py-2 rounded-lg border-0 bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white text-sm font-semibold shadow hover:brightness-110 transition"
          onClick={handleSurpriseMe}
        >
          🎲 Surprise Me
        </button>
        <button
          type="button"
          className="w-full px-3 py-2 rounded-lg border border-blue-400 text-blue-500 text-sm font-semibold mt-1 hover:bg-blue-500/10 transition"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ThemeSelectorModal; 