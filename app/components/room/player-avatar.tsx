"use client"

import { cn } from "@/lib/utils"

interface PlayerAvatarProps {
  name: string
  avatarStyle?: string
  avatarSeed?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function PlayerAvatar({ name, avatarStyle, avatarSeed, size = "md", className }: PlayerAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  }

  // Parse avatar options from seed
  const avatarOptions = avatarSeed ? JSON.parse(avatarSeed) : {}
  
  // Build avatar URL with options
  const avatarUrl = avatarStyle === "big-smile" && avatarOptions
    ? `https://api.dicebear.com/7.x/big-smile/svg?${new URLSearchParams(avatarOptions).toString()}`
    : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`

  return (
    <div className={cn("relative", className)}>
      <img
        src={avatarUrl}
        alt={name}
        className={cn(
          "rounded-full border-2 border-border",
          sizeClasses[size]
        )}
      />
    </div>
  )
} 