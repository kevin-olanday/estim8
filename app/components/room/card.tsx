"use client"

import { cn } from "@/lib/utils"

interface DeckCardProps {
  label: string
  selected: boolean
  disabled?: boolean
  onClick: () => void
  tabIndex?: number
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void
  className?: string
  deckTheme?: string
  gradientPresets?: any[]
  getContrastYIQ?: (hex: string) => 'text-black' | 'text-white'
}

export function DeckCard({ 
  label, 
  selected, 
  disabled = false, 
  onClick, 
  tabIndex, 
  onKeyDown, 
  className,
  deckTheme,
  gradientPresets,
  getContrastYIQ
}: DeckCardProps) {
  const themeClass = deckTheme && getContrastYIQ && gradientPresets
    ? `${deckTheme} ${getContrastYIQ((gradientPresets.find(g => g.value === deckTheme)?.from || '#fff'))}`
    : '';
  const contrastColor = deckTheme && getContrastYIQ && gradientPresets 
    ? getContrastYIQ((gradientPresets.find(g => g.value === deckTheme)?.from || '#fff')) === 'text-black' ? '#222' : '#fff'
    : '#fff';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      aria-pressed={selected}
      className={cn(
        "w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 lg:w-28 lg:h-36 aspect-[2/3] min-w-0 rounded-xl text-base sm:text-lg md:text-xl font-bold tracking-wide border flex items-center justify-center transition-all duration-150 ease-in-out outline-none",
        themeClass,
        selected
          ? "animate-gradient scale-110 -translate-y-4 ring-4 ring-offset-2 ring-white shadow-lg text-4xl md:text-5xl font-extrabold"
          : "border-border hover:border-accent-hover hover:shadow hover:-translate-y-[2px]",
        disabled && "opacity-50 cursor-not-allowed",
        "focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <span className="relative inline-block">
        {selected && (
          <span
            className="absolute left-1/2 top-1/2 z-10 pointer-events-none"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <svg
              width="60" height="60" viewBox="0 0 60 60"
              className="block w-14 h-14 md:w-20 md:h-20"
            >
              <circle
                cx="30" cy="30" r="24"
                fill="none"
                stroke={contrastColor}
                strokeWidth="4"
                strokeDasharray="150.72"
                strokeDashoffset="150.72"
                className="encircle-anim"
                style={{
                  filter: `drop-shadow(0 0 6px ${contrastColor}88)`,
                }}
              />
            </svg>
          </span>
        )}
        <span className="relative z-20" style={deckTheme ? { color: contrastColor } : {}}>{label}</span>
      </span>
    </button>
  )
}

// Animated border keyframes (inject once)
if (typeof window !== 'undefined' && !document.getElementById('encircle-anim-style')) {
  const style = document.createElement('style');
  style.id = 'encircle-anim-style';
  style.innerHTML = `
    @keyframes encircle-draw {
      from { stroke-dashoffset: 150.72; }
      to { stroke-dashoffset: 0; }
    }
    .encircle-anim {
      animation: encircle-draw 0.5s cubic-bezier(.4,0,.2,1) forwards;
    }
  `;
  document.head.appendChild(style);
}
