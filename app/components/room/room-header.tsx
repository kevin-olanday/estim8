"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Share2 } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { copyToClipboard } from "@/lib/copy-to-clipboard"
import { KeyboardShortcuts } from "@/app/components/room/keyboard-shortcuts"

interface RoomHeaderProps {
  roomCode: string
  roomName?: string
  isHost: boolean
}

export default function RoomHeader({ roomCode, roomName, isHost }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const copyRoomCode = async () => {
    const success = await copyToClipboard(roomCode)
    if (success) {
      setCopied(true)
      toast({
        title: "Room code copied",
        description: "Share this code with your team members",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareRoom = () => {
    if (navigator.share) {
      navigator.share({
        title: `Join my EstiM8 room: ${roomName || roomCode}`,
        text: `Join my Planning Poker session with code: ${roomCode}`,
        url: window.location.href,
      })
    } else {
      copyRoomCode()
    }
  }

  return (
    <header className="bg-background border-b border-border py-4">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-primary">EstiM8</h1>
          {roomName && <span className="text-muted-foreground">| {roomName}</span>}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground mr-2">Room:</span>
            <Input value={roomCode} readOnly className="w-28 text-center font-mono" />
          </div>
          <Button variant="outline" size="icon" onClick={copyRoomCode} title="Copy room code">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={shareRoom} title="Share room">
            <Share2 className="h-4 w-4" />
          </Button>
          <KeyboardShortcuts isHost={isHost} />
        </div>
      </div>
    </header>
  )
}
