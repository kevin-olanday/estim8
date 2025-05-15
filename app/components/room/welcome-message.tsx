"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info, Hand } from "lucide-react"
import { PlayerAvatar } from "./player-avatar"

interface WelcomeMessageProps {
  isHost: boolean
  roomCode: string
  name?: string
  avatarStyle?: string | null
  avatarSeed?: string | null
}

export function WelcomeMessage({ isHost, roomCode, name = "", avatarStyle, avatarSeed }: WelcomeMessageProps) {
  const [open, setOpen] = useState(true)

  // Truncate name if too long
  const displayName = name.length > 20 ? name.slice(0, 17) + '…' : name;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md rounded-2xl border-2 border-accent shadow-xl">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2 text-accent">
              <Hand className="w-5 h-5" />
              {`Welcome to EstiM8, `}
              <span className="font-bold text-foreground">{displayName}</span>
              <PlayerAvatar name={name} avatarStyle={avatarStyle || undefined} avatarSeed={avatarSeed || undefined} size="md" className="ml-1" />
              !
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 text-base text-muted-foreground">
          Your real-time Planning Poker tool for agile teams.<br /><br />
          <b>{isHost ? "You are the host of this room." : "You have joined as a participant."}</b><br />
            {isHost
            ? "You can add stories, reveal votes, and control the timer."
            : "You can vote on stories and participate in discussions."}
        </div>
        <div className="space-y-2 mt-2">
            <h3 className="text-sm font-medium">Quick Tips:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Use the number keys (1-8) to quickly vote</li>
              <li>Press Shift+? to see all keyboard shortcuts</li>
            <li>Share the room code <b>{roomCode}</b> with your team</li>
              {isHost && <li>Only you can reveal votes and move to the next story</li>}
            </ul>
          </div>
        <div className="space-y-3 mt-4">
          <button
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold text-base bg-accent text-white shadow transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent"
            onClick={() => setOpen(false)}
            type="button"
          >
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
