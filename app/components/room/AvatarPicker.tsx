import React, { useState } from "react";

const DICEBEAR_STYLES = [
  { label: "Big Smile", value: "big-smile" },
  { label: "Notionists", value: "notionists" },
  { label: "Pixel", value: "pixel-art" },
  { label: "Human", value: "adventurer" },
  { label: "Bottts", value: "bottts" },
  { label: "Fun Emoji", value: "fun-emoji" },
  { label: "Avataaars", value: "avataaars" },
  { label: "Croodles", value: "croodles" },
  { label: "Miniavs", value: "miniavs" },
];

function randomSeed() {
  return Math.random().toString(36).substring(2, 10);
}

export default function AvatarPicker({ value, onChange }: {
  value: { style: string; seed: string };
  onChange: (v: { style: string; seed: string }) => void;
}) {
  const [seed, setSeed] = useState(value.seed);
  const [style, setStyle] = useState(value.style || DICEBEAR_STYLES[0].value);
  const [animating, setAnimating] = useState(false);
  // Stable variant seeds per style
  const [variantSeeds, setVariantSeeds] = useState<{ [style: string]: string[] }>({});

  // Ensure we have a seed value
  React.useEffect(() => {
    if (!seed) {
      const newSeed = randomSeed();
      setSeed(newSeed);
      onChange({ style, seed: newSeed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setSeed(value.seed);
  }, [value.seed]);

  React.useEffect(() => {
    setStyle(value.style);
  }, [value.style]);

  // Generate stable variant seeds for each style only once per style change
  React.useEffect(() => {
    setVariantSeeds((prev) => {
      if (prev[style]) return prev;
      const variants = Array.from({ length: 5 }, () => randomSeed());
      return { ...prev, [style]: variants };
    });
  }, [style]);

  const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;

  // Get the stable variants for the current style
  const stableVariants = React.useMemo(() => {
    const variants = variantSeeds[style] || [];
    // Always show the current seed as the first variant, then the rest
    const rest = variants.filter((s) => s !== seed);
    return [seed, ...rest.slice(0, 4)];
  }, [variantSeeds, style, seed]);

  const handleRandomize = () => {
    const newSeed = randomSeed();
    setSeed(newSeed);
    onChange({ style, seed: newSeed });
    setAnimating(true);
    setTimeout(() => setAnimating(false), 250);
  };

  const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeed(e.target.value);
    onChange({ style, seed: e.target.value });
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStyle(e.target.value);
    onChange({ style: e.target.value, seed });
  };

  const handleVariantClick = (variantSeed: string) => {
    setSeed(variantSeed);
    onChange({ style, seed: variantSeed });
    setAnimating(true);
    setTimeout(() => setAnimating(false), 250);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-28 h-28 flex flex-col items-center">
        <div
          className={`transition-transform duration-200 rounded-2xl shadow-lg border-2 border-accent bg-white flex items-center justify-center p-2 ${animating ? 'scale-110' : ''}`}
        >
          <img src={avatarUrl} alt="Avatar preview" className="w-24 h-24 object-contain" />
          <button
            type="button"
            className="absolute right-2 bottom-2 bg-accent text-white rounded-full p-1 shadow hover:scale-110 transition"
            onClick={handleRandomize}
            title="Shuffle avatar"
            aria-label="Shuffle avatar"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="7" cy="7" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="17" cy="17" r="1.5"/></svg>
          </button>
        </div>
      </div>
      {/* Style selector */}
      <div className="flex flex-col gap-2 w-full">
        <label className="text-sm font-medium text-muted-foreground">Avatar Style</label>
        <select
          className="input-base rounded-md border border-border bg-surface text-foreground px-3 py-2"
          value={style}
          onChange={handleStyleChange}
        >
          {DICEBEAR_STYLES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
} 