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

  let avatarUrl = ''
  let showFallback = false
  try {
    if (avatarStyle === "big-smile" && avatarSeed) {
      const options = typeof avatarSeed === 'string' ? JSON.parse(avatarSeed) : avatarSeed
      // Build v9.x URL with query params
      const accessoriesParam = options.accessories && options.accessories.length > 0
        ? options.accessories.map((a: string) => `&accessories[]=${encodeURIComponent(a)}`).join("")
        : ""
      avatarUrl = `https://api.dicebear.com/9.x/big-smile/svg?hair=${options.hair}&mouth=${options.mouth}&eyes=${options.eyes}&hairColor[]=${options.hairColor}&skinColor[]=${options.skinColor}${accessoriesParam}&accessoriesProbability=30`
    } else {
      // fallback to initials
      avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    }
  } catch {
    showFallback = true
  }

  return (
    <div className={cn("relative", className)}>
      {!showFallback ? (
        <img
          src={avatarUrl}
          alt={name}
          className={cn(
            "rounded-full",
            sizeClasses[size]
          )}
        />
      ) : (
        <div className={cn("rounded-full bg-muted flex items-center justify-center text-lg font-bold", sizeClasses[size])}>
          {name?.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  )
} 