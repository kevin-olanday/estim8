"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { EmojiPanel } from "./emoji-panel"
import { usePusherContext } from "@/app/context/pusher-context"

interface PlayerAvatarProps {
  name: string
  avatarStyle?: string
  avatarSeed?: string
  size?: "sm" | "md" | "lg"
  className?: string
  playerId?: string
  currentPlayerId?: string
  disabled?: boolean
  emojiPanelDisabled?: boolean
}

export function PlayerAvatar({ 
  name, 
  avatarStyle, 
  avatarSeed, 
  size = "md", 
  className,
  playerId,
  currentPlayerId,
  disabled = false,
  emojiPanelDisabled = false
}: PlayerAvatarProps) {
  const [showEmojiPanel, setShowEmojiPanel] = useState(false)
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 })
  const avatarRef = useRef<HTMLDivElement>(null)
  const { channel } = usePusherContext()

  console.log("PlayerAvatar render:", { name, playerId, currentPlayerId, disabled, hasChannel: !!channel })

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

  const handleClick = (e: React.MouseEvent) => {
    console.log("Avatar clicked:", { playerId, currentPlayerId, disabled })
    
    if (disabled || !playerId || !currentPlayerId || playerId === currentPlayerId) {
      console.log("Click ignored:", { disabled, hasPlayerId: !!playerId, hasCurrentPlayerId: !!currentPlayerId, isSelf: playerId === currentPlayerId })
      return
    }

    const rect = avatarRef.current?.getBoundingClientRect()
    if (!rect) {
      console.log("No rect found for avatar")
      return
    }

    console.log("Opening emoji panel at position:", { x: rect.left, y: rect.bottom + 8 })
    setPanelPosition({
      x: rect.left,
      y: rect.bottom + 8
    })
    setShowEmojiPanel(true)
  }

  const handleEmojiSelect = async (emoji: string) => {
    console.log("Emoji selected:", { emoji, playerId, currentPlayerId, hasChannel: !!channel })
    
    if (!channel || !playerId || !currentPlayerId) {
      console.log("Cannot trigger reaction:", { hasChannel: !!channel, hasPlayerId: !!playerId, hasCurrentPlayerId: !!currentPlayerId })
      return
    }

    const eventData = {
      fromPlayerId: currentPlayerId,
      toPlayerId: playerId,
      emoji,
      roomId: channel.name.replace('presence-room-', '')
    }
    console.log("Sending reaction:", eventData)

    try {
      const response = await fetch('/api/room/reaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      })

      if (!response.ok) {
        throw new Error('Failed to send reaction')
      }

      console.log("Reaction sent successfully")
    } catch (error) {
      console.error("Error sending reaction:", error)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div
        ref={avatarRef}
        onClick={handleClick}
        className={cn(
          "relative",
          !disabled && playerId && currentPlayerId && playerId !== currentPlayerId
            ? "cursor-pointer hover:ring-2 hover:ring-accent/50 transition-all"
            : ""
        )}
      >
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

      <EmojiPanel
        isOpen={showEmojiPanel}
        onClose={() => setShowEmojiPanel(false)}
        onSelectEmoji={handleEmojiSelect}
        position={panelPosition}
        disabled={emojiPanelDisabled}
      />
    </div>
  )
} 