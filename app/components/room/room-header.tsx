"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Share2, Moon, Sun } from "lucide-react"
import { useState, useEffect, useRef } from "react"
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
  const [darkMode, setDarkMode] = useState(true)
  const logoRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (logoRef.current) {
      logoRef.current.animate([
        { opacity: 0, transform: 'translateY(-12px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], {
        duration: 600,
        easing: 'cubic-bezier(.4,0,.2,1)',
        fill: 'forwards'
      })
    }
  }, [])

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

  const toggleTheme = () => setDarkMode((d) => !d)

  return (
    <>
      {/* Neon/gradient bar for distinction */}
      <div className="w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-accent shadow-[0_0_16px_2px_theme('colors.accent')]" />
      <header
        className="w-full shadow-xl backdrop-blur-md border-b border-border bg-gradient-to-r from-surface/80 to-muted/80 px-6 py-4 transition-all"
        style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
      >
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Left: Logo, App Name, Slogan */}
          <div className="flex flex-col sm:flex-row sm:items-center min-w-0 w-full sm:w-auto">
            <span
              ref={logoRef}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-accent/90 shadow text-3xl mr-0 sm:mr-3 transition-transform duration-300"
              aria-label="EstiM8 logo"
            >
              🃏
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-2xl md:text-3xl font-bold text-accent tracking-tight whitespace-nowrap" style={{ fontFamily: 'inherit' }}>
                EstiM8
              </span>
              <span className="text-xs md:text-sm text-muted-foreground tracking-wide leading-tight mt-0.5">
                Make Estimates Great Again
              </span>
            </div>
            {roomName && <span className="ml-2 text-muted-foreground truncate max-w-xs hidden sm:inline">| {roomName}</span>}
          </div>
          {/* Right: Controls */}
          <div className="flex items-center gap-1 flex-shrink-0 mt-2 sm:mt-0">
            {roomCode && (
              <span className="font-mono text-sm font-semibold mr-2 select-all px-4 py-1 rounded-full bg-[linear-gradient(90deg,_#4654F0_0%,_#C25278_100%)] text-white shadow-sm flex items-center gap-1">
                <span className="text-white/70 text-xs font-normal">Room ID :</span>
                <span>{roomCode}</span>
              </span>
            )}
            <button className="btn-utility" style={{padding: '0.375rem 0.5rem'}} onClick={copyRoomCode} title="Copy room code">
              <Copy className="h-4 w-4" />
            </button>
            <button className="btn-utility" style={{padding: '0.375rem 0.5rem'}} onClick={shareRoom} title="Share room">
              <Share2 className="h-4 w-4" />
            </button>
            <button className="btn-utility ml-1" style={{padding: '0.375rem 0.5rem'}} onClick={toggleTheme} title="Toggle theme">
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <KeyboardShortcuts isHost={isHost} />
          </div>
        </div>
      </header>
    </>
  )
}
