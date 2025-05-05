"use client"

import type { Card as CardType } from "@/types/card"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface CardProps {
  card: CardType
  selected: boolean
  disabled?: boolean
  onClick: () => void
}

export function Card({ card, selected, disabled = false, onClick }: CardProps) {
  const [isHovering, setIsHovering] = useState(false)

  // Default color if none provided
  const color = card.color || "#f5f5f5"

  // Calculate text color based on background color brightness
  const isLightColor = (color: string): boolean => {
    // Convert hex to RGB
    const hex = color.replace("#", "")
    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)

    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128
  }

  const textColor = isLightColor(color) ? "text-gray-900" : "text-white"

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn(
        "aspect-[2/3] rounded-lg flex flex-col items-center justify-center transition-all",
        "border-2 hover:shadow-md",
        selected ? "shadow-lg ring-2 ring-primary" : "shadow-sm",
        disabled && "opacity-50 cursor-not-allowed",
        textColor,
      )}
      style={{
        backgroundColor: color,
        borderColor: selected ? "var(--primary)" : isHovering ? "var(--primary-50)" : color,
        transform: selected ? "translateY(-4px)" : isHovering ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {card.emoji && <div className="text-2xl mb-1">{card.emoji}</div>}
      <div className="text-xl font-bold">{card.label}</div>
    </button>
  )
}
