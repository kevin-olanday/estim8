import React, { useEffect, useState } from "react";
import { motion, easeOut } from "framer-motion";
import { cn } from "@/lib/utils";

interface Card {
  label: string;
  [key: string]: any;
}

interface GradientPreset {
  name: string;
  value: string;
  from: string;
  to: string;
}

interface CardFanProps {
  deck: Card[];
  selectedCard: string | null;
  setSelectedCard: (card: string | null) => void;
  isVoting: boolean;
  storyId?: string;
  handleVote: (label: string) => void;
  handleCardKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => void;
  hovered: number | null;
  setHovered: (idx: number | null) => void;
  keyboardHovered: number | null;
  deckTheme: string;
  gradientPresets: GradientPreset[];
  getContrastYIQ: (hex: string) => 'text-black' | 'text-white';
  dealAnimKey?: number;
  disabled?: boolean;
}

const CardFan: React.FC<CardFanProps> = ({
  deck,
  selectedCard,
  setSelectedCard,
  isVoting,
  storyId,
  handleVote,
  handleCardKeyDown,
  hovered,
  setHovered,
  keyboardHovered,
  deckTheme,
  gradientPresets,
  getContrastYIQ,
  dealAnimKey,
  disabled = false,
}) => {
  // --- Fly-in animation state ---
  const [dealAnimKeyState, setDealAnimKeyState] = useState(0);
  const [dealingIndex, setDealingIndex] = useState(-1);
  const [dealt, setDealt] = useState<Set<number>>(new Set());

  useEffect(() => {
    setDealingIndex(-1);
    setDealt(new Set());
    if (!deck || deck.length === 0) return;
    let cancelled = false;
    // Start dealing the first card after a short delay
    setTimeout(() => {
      if (!cancelled) setDealingIndex(0);
    }, 80);
    return () => { cancelled = true; };
  }, [storyId, dealAnimKey]);

  if (!deck || deck.length === 0) return null;
  const center = Math.floor(deck.length / 2);
  const cardsWithMeta = deck.map((card, i) => {
    const angle = (i - center) * 12;
    const xOffset = (i - center) * 72;
    return { card, angle, xOffset, index: i };
  });
  // Sort by xOffset so cards further right render last (on top)
  const sorted = cardsWithMeta.sort((a, b) => a.xOffset - b.xOffset);
  return (
    <div className={cn("overflow-x-auto w-full max-w-full relative pb-2 hidden sm:block", disabled && "pointer-events-none opacity-60") }>
      <div className={cn("sm:relative sm:flex sm:items-center sm:justify-center sm:h-[28rem] w-full min-w-[600px] sm:min-w-0 overflow-visible", (isVoting || disabled) && "opacity-60 pointer-events-none") }>
        {isVoting && (
          <div className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-blue-300 font-medium text-sm">Voting...</span>
          </div>
        )}
        {sorted.map(({ card, angle, xOffset, index: i }) => {
          if (i > dealingIndex) return null;
          const isSelected = selectedCard === card.label;
          const isHovered = hovered === i || keyboardHovered === i;
          // Only trigger onAnimationComplete for the card currently being dealt
          const isLastDealt = i === dealingIndex && dealingIndex < deck.length - 1;
          const isBeingDealt = i === dealingIndex && !dealt.has(i);
          if (isBeingDealt && !dealt.has(i)) {
            setTimeout(() => setDealt(prev => new Set(prev).add(i)), 0);
          }
          return (
            <motion.button
              key={card.label + dealAnimKey}
              initial={isBeingDealt ? {
                opacity: 0,
                x: -300,
                y: -200,
                scale: 0.7,
              } : false}
              animate={{
                opacity: 1,
                x: 0,
                y: (isHovered || isSelected) ? -100 : 0,
                scale: 1,
                zIndex: isSelected ? 30 : isHovered ? 40 : 10 + i,
              }}
              transition={{
                x: { type: "tween", duration: 0.08, ease: easeOut },
                y: { type: "tween", duration: 0.08, ease: easeOut },
                opacity: { type: "tween", duration: 0.08, ease: easeOut },
                scale: { type: "tween", duration: 0.08, ease: easeOut },
              }}
              onAnimationComplete={() => {
                if (isLastDealt) setTimeout(() => setDealingIndex((idx) => idx + 1), 5);
              }}
              style={{
                position: 'absolute',
                left: `calc(50% + ${xOffset}px)` ,
                transform: `rotate(${angle}deg)` ,
                transformOrigin: 'bottom center',
              }}
              className={cn(
                "w-24 h-36 sm:w-28 sm:h-40 md:w-32 md:h-48 lg:w-36 lg:h-56 aspect-[2/3] min-w-0 rounded-xl text-lg sm:text-xl md:text-2xl font-bold tracking-wide border-2 border-white/10 flex items-center justify-center transition-all duration-150 ease-in-out outline-none shadow-sm hover:shadow-lg hover:border-blue-400 hover:z-40",
                deckTheme && !isSelected ? deckTheme + " " + getContrastYIQ((gradientPresets.find(g => g.value === deckTheme)?.from || '#fff')) : "",
                isSelected
                  ? deckTheme + " " + getContrastYIQ((gradientPresets.find(g => g.value === deckTheme)?.from || '#fff')) + " animate-gradient scale-110 -translate-y-4 ring-4 ring-offset-2 ring-white shadow-lg z-30"
                  : "bg-muted border-transparent text-foreground",
                keyboardHovered === i && !isSelected && "ring-2 ring-blue-300",
                "focus-visible:ring focus-visible:ring-blue-400 focus-visible:ring-offset-2"
              )}
              type="button"
              disabled={isVoting || !storyId || disabled}
              tabIndex={0}
              onClick={() => {
                handleVote(card.label);
              }}
              onKeyDown={(e) => handleCardKeyDown(e, i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              aria-pressed={isSelected}
            >
              <div className="relative w-full h-full">
                {/* Optional gradient overlay for depth (for non-selected) */}
                {!isSelected && (
                  <div className="absolute inset-0 rounded-xl pointer-events-none bg-gradient-to-br from-white/5 to-transparent" />
                )}
                {/* Label in corner by default, center and enlarge on hover/active */}
                <span
                  className={cn(
                    "absolute left-2 top-2 text-xs pointer-events-none z-20",
                    (isHovered || isSelected) &&
                      "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ",
                    isSelected
                      ? `text-5xl font-extrabold tracking-wide font-[Lexend]`
                      : (isHovered && !isSelected)
                        ? "text-2xl font-bold"
                        : getContrastYIQ((gradientPresets.find(g => g.value === deckTheme)?.from || '#fff'))
                  )}
                >
                  <span className="relative inline-block">
                    {isSelected && (() => {
                      const contrastColor = getContrastYIQ((gradientPresets.find(g => g.value === deckTheme)?.from || '#fff')) === 'text-black' ? '#222' : '#fff';
                      return (
                        <span
                          className="absolute left-1/2 top-1/2 z-10 pointer-events-none"
                          style={{ transform: 'translate(-50%, -50%)' }}
                        >
                          <svg
                            width="80" height="80" viewBox="0 0 80 80"
                            className="block w-20 h-20"
                          >
                            <circle
                              cx="40" cy="40" r="32"
                              fill="none"
                              stroke={contrastColor}
                              strokeWidth="5"
                              strokeDasharray="201.06"
                              strokeDashoffset="201.06"
                              className="encircle-anim"
                              style={{
                                filter: `drop-shadow(0 0 8px ${contrastColor}88)`,
                              }}
                            />
                          </svg>
                        </span>
                      );
                    })()}
                    <span className="relative z-20" style={isSelected ? { color: getContrastYIQ((gradientPresets.find(g => g.value === deckTheme)?.from || '#fff')) === 'text-black' ? '#222' : '#fff' } : {}}>{card.label}</span>
                  </span>
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default CardFan; 