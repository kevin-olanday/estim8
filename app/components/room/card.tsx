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
}

export function DeckCard({ label, selected, disabled = false, onClick, tabIndex, onKeyDown, className }: DeckCardProps) {
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
        selected
          ? "bg-accent text-white border-accent shadow-lg scale-105"
          : "bg-muted border-border text-foreground hover:border-accent-hover hover:shadow hover:-translate-y-[2px]",
        disabled && "opacity-50 cursor-not-allowed",
        "focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {label}
    </button>
  )
}
