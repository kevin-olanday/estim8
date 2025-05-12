"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Share2, Moon, Sun } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { copyToClipboard } from "@/lib/copy-to-clipboard"
import { KeyboardShortcuts } from "@/app/components/room/keyboard-shortcuts"
import { useRouter } from "next/navigation"

interface RoomHeaderProps {
  roomCode: string
  roomName?: string
  isHost: boolean
}

export default function RoomHeader({ roomCode, roomName, isHost }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const { toast } = useToast()
  const [darkMode, setDarkMode] = useState(true)
  const logoRef = useRef<HTMLSpanElement>(null)
  const router = useRouter()
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)

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

  useEffect(() => {
    // Create style for tooltip animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(5px) translateX(-50%); }
        15% { opacity: 1; transform: translateY(0) translateX(-50%); }
        85% { opacity: 1; transform: translateY(0) translateX(-50%); }
        100% { opacity: 0; transform: translateY(-5px) translateX(-50%); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
    const roomUrl = window.location.href;
    const shareTitle = `EstiM8 Planning Poker Session`;
    const shareText = `Join my EstiM8 planning poker session: ${roomName ? ` for "${roomName}"` : ''}`;
    
    if (navigator.share) {
      try {
        navigator.share({
          title: shareTitle,
          text: shareText,
          url: roomUrl,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to copying the URL
        copyRoomUrl(roomUrl, shareText, shareTitle);
      }
    } else {
      // Fallback for browsers without Web Share API
      copyRoomUrl(roomUrl, shareText, shareTitle);
    }
  }
  
  const copyRoomUrl = async (url: string, shareText: string, shareTitle: string) => {
    const textToShare = `${shareText}\n\n${url}`;
    const success = await copyToClipboard(textToShare);
    if (success) {
      setShared(true);
      toast({
        title: "Room link copied",
        description: "Share the invite with your team members",
      });
      setTimeout(() => setShared(false), 2000);
    }
  };

  const toggleTheme = () => setDarkMode((d) => !d)

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLeaveDialog(true);
  };

  const confirmLeave = () => {
    setShowLeaveDialog(false);
    router.push("/");
  };

  return (
    <>
      {/* Neon/gradient bar for distinction */}
      <div className="w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-accent shadow-[0_0_16px_2px_theme('colors.accent')]" />
      <header
        className="w-full shadow-xl border-b border-border bg-background px-6 py-4 transition-all"
        style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
      >
        <div className="mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          {/* Left: Logo, App Name, Slogan */}
          
          <div className="flex flex-row items-center min-w-0 w-full sm:w-auto">
       
            <div className="flex flex-row items-center gap-3 min-w-0">
            <img src="/images/placeholder-logo.png" alt="EstiM8 logo" className="h-12 md:h-12 mb-2 mx-auto filter invert" />             
              <span className="text-xs md:text-sm text-muted-foreground tracking-wide leading-tight hidden sm:inline-block">
                | Real-Time Planning Poker for Agile Teams
              </span>
            </div>
            {roomName && <span className="ml-2 text-muted-foreground truncate max-w-xs hidden sm:inline">{roomName}</span>}
          </div>
          {/* Right: Controls */}
          <div className="flex items-center gap-1 flex-shrink-0 mt-4 sm:mt-0 self-center sm:self-auto">
            {roomCode && (
              <span className="font-mono text-sm font-semibold mr-2 select-all px-4 py-1 rounded-full bg-[linear-gradient(90deg,_#4654F0_0%,_#C25278_100%)] text-white shadow-sm flex items-center gap-1">
                <span className="text-white/70 text-xs font-normal">Room ID :</span>
                <span>{roomCode}</span>
              </span>
            )}
            <div className="relative">
              <button 
                className={`btn-utility ${copied ? 'text-green-500 border-green-500' : ''} transition-all`}
                style={{
                  padding: '0.375rem 0.5rem',
                  transform: copied ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.15s ease, color 0.2s ease, border-color 0.2s ease'
                }} 
                onClick={copyRoomCode}
              >
                <Copy className="h-4 w-4" />
              </button>
              {copied && (
                <div 
                  className="absolute left-1/2 -translate-x-1/2 -bottom-6 text-xs font-medium bg-background px-2 py-0.5 rounded-sm border border-border whitespace-nowrap z-10"
                  style={{ 
                    animation: 'fadeInOut 1.5s ease-in-out forwards'
                  }}
                >
                  Copied!
                </div>
              )}
            </div>
            <div className="relative">
              <button 
                className={`btn-utility ${shared ? 'text-blue-500 border-blue-500' : ''} transition-all`}
                style={{
                  padding: '0.375rem 0.5rem',
                  transform: shared ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.15s ease, color 0.2s ease, border-color 0.2s ease'
                }} 
                onClick={shareRoom}
              >
                <Share2 className="h-4 w-4" />
              </button>
              {shared && (
                <div 
                  className="absolute left-1/2 -translate-x-1/2 -bottom-6 text-xs font-medium bg-background px-2 py-0.5 rounded-sm border border-border whitespace-nowrap z-10"
                  style={{ 
                    animation: 'fadeInOut 1.5s ease-in-out forwards'
                  }}
                >
                  {typeof navigator.share === 'function' ? 'Shared!' : 'Link copied!'}
                </div>
              )}
            </div>
            <button className="btn-utility ml-1" style={{padding: '0.375rem 0.5rem'}} onClick={toggleTheme} title="Toggle theme">
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <KeyboardShortcuts isHost={isHost} />
          </div>
        </div>
      </header>
      {/* Confirmation Dialog */}
      {showLeaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background border border-border rounded-xl shadow-xl p-6 max-w-xs w-full flex flex-col items-center">
            <div className="text-lg font-semibold mb-2">Leave Room?</div>
            <div className="text-muted-foreground mb-4 text-center">You are about to leave the room. Are you sure?</div>
            <div className="flex gap-3 w-full justify-center">
              <button
                className="btn-utility px-4 py-1 text-base"
                onClick={() => setShowLeaveDialog(false)}
              >
                Cancel
              </button>
              <button
                className="btn-utility bg-accent text-white border-accent px-4 py-1 text-base hover:bg-accent/90"
                onClick={confirmLeave}
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
