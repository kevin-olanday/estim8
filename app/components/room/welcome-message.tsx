"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface WelcomeMessageProps {
  isHost: boolean
  roomCode: string
}

export function WelcomeMessage({ isHost, roomCode }: WelcomeMessageProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Check if this is the first time the user has visited
    const hasSeenWelcome = localStorage.getItem("estim8_has_seen_welcome")

    if (!hasSeenWelcome) {
      setOpen(true)
      localStorage.setItem("estim8_has_seen_welcome", "true")
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to EstiM8!</DialogTitle>
          <DialogDescription>Your real-time Planning Poker tool for agile teams</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p>
            {isHost
              ? "You are the host of this room. You can add stories, reveal votes, and control the timer."
              : "You have joined this room as a participant. You can vote on stories and participate in discussions."}
          </p>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Quick Tips:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Use the number keys (1-8) to quickly vote</li>
              <li>Press Shift+? to see all keyboard shortcuts</li>
              <li>Share the room code ({roomCode}) with your team</li>
              {isHost && <li>Only you can reveal votes and move to the next story</li>}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
