"use client"

import { Copy, Share2, Pencil, X, Check } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { copyToClipboard } from "@/lib/copy-to-clipboard"
import { KeyboardShortcuts } from "@/app/components/room/keyboard-shortcuts"
import { useRouter } from "next/navigation"
import { updateRoomName as updateRoomNameAction } from "@/app/actions/room-actions"
import { usePusherContext } from "@/app/context/pusher-context"

interface RoomHeaderProps {
  roomCode: string
  roomName?: string
  isHost: boolean
  hostName?: string
}

export default function RoomHeader({ roomCode, roomName, isHost, hostName }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const { toast } = useToast()
  const [darkMode, setDarkMode] = useState(true)
  const logoRef = useRef<HTMLSpanElement>(null)
  const router = useRouter()
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(roomName || "")
  const [saving, setSaving] = useState(false)
  const [hovered, setHovered] = useState(false)
  const fallbackRoomName = hostName ? `${hostName}'s Room` : "Room"
  const [currentRoomName, setCurrentRoomName] = useState(roomName || fallbackRoomName)
  const { pusher, channel } = usePusherContext?.() || {}

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

  useEffect(() => {
    setEditValue(roomName || fallbackRoomName)
    setCurrentRoomName(roomName || fallbackRoomName)
  }, [roomName, hostName])

  // Listen for real-time room name updates
  useEffect(() => {
    if (!channel) return
    const handler = (data: { name: string }) => {
      setCurrentRoomName(data.name)
      setEditValue(data.name)
    }
    channel.bind("room-name-updated", handler)
    return () => {
      channel.unbind("room-name-updated", handler)
    }
  }, [channel])

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

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLeaveDialog(true);
  };

  const confirmLeave = () => {
    setShowLeaveDialog(false);
    router.push("/");
  };

  // Dummy updateRoomName function (replace with real API call)
  async function updateRoomName(newName: string) {
    setSaving(true)
    try {
      setCurrentRoomName(newName) // Optimistic UI
      await updateRoomNameAction(newName)
      setEditing(false)
    } catch (e) {
      // Optionally show error
      setCurrentRoomName(roomName || "")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Neon/gradient bar for distinction */}
      <div className="w-full " />
      <header
        className="w-full shadow-xl border-b border-border bg-background px-6 py-4 transition-all"
        style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
      >
        <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 w-full">
          {/* Left: Logo and Slogan stacked */}
          <div className="flex flex-col items-start min-w-0 w-full sm:w-auto">
            <div className="flex flex-row items-center gap-3 min-w-0">
              <img
                src="/images/placeholder-logo.png"
                alt="EstiM8 logo"
                className="h-12 md:h-12 mb-2 mx-auto filter invert cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
                tabIndex={0}
                onClick={handleLogoClick}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleLogoClick(e as any); }}
                aria-label="Go to home screen"
              />
              <span className="text-xs md:text-sm text-muted-foreground tracking-wide leading-tight ml-2 hidden lg:inline">
                | Real-Time Planning Poker for Agile Teams
              </span>
            </div>
          </div>
          {/* Center: Room Name */}
          {currentRoomName && (
            <div className="hidden sm:flex flex-1 justify-center items-center mt-2 sm:mt-0">
              <div
                className="relative group flex items-center"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
              >
                {editing ? (
                  <form
                    className="flex items-center gap-2"
                    onSubmit={async e => {
                      e.preventDefault()
                      if (!editValue.trim()) return
                      await updateRoomName(editValue.trim())
                    }}
                  >
                    <input
                      className="px-2 py-1 rounded-lg border border-accent/40 bg-background text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      disabled={saving}
                      style={{ minWidth: 120, maxWidth: 240 }}
                      autoFocus
                      maxLength={30}
                    />
                    <button type="submit" className="text-accent" disabled={saving} title="Save">
                      <Check className="w-5 h-5" />
                    </button>
                    <button type="button" className="text-muted-foreground" onClick={() => { setEditing(false); setEditValue(currentRoomName) }} title="Cancel" disabled={saving}>
                      <X className="w-5 h-5" />
                    </button>
                  </form>
                ) : (
                  <div className="flex flex-row items-center group/badge" style={{gap: 6}}>
                    <span
                      className="px-4 py-1 rounded-xl font-extrabold tracking-tight text-accent shadow-sm bg-accent/10 border border-accent/30 transition-colors text-base sm:text-2xl"
                      style={{
                        textShadow: '0 2px 8px rgba(0,0,0,0.10)',
                        letterSpacing: '0.01em',
                        maxWidth: '90vw',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        cursor: isHost ? 'pointer' : 'default',
                      }}
                      title={currentRoomName}
                    >
                      {currentRoomName}
                    </span>
                    {/* Edit icon: only for host, only when not editing */}
                    {isHost && !editing && (
                      <button
                        type="button"
                        className="ml-1 opacity-0 group-hover/badge:opacity-100 transition-opacity p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
                        style={{ background: 'transparent', lineHeight: 0 }}
                        onClick={() => setEditing(true)}
                        title="Edit room name"
                      >
                        <Pencil className="w-4 h-4 text-accent group-hover/badge:bg-accent/10 rounded-full p-0.5 transition-colors" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Right: Controls */}
          <div className="flex flex-row items-center gap-2 flex-nowrap justify-center sm:justify-end mt-2 sm:mt-0">
            {roomCode && (
              <span
                className="min-w-0 font-mono text-sm font-semibold select-all px-2 py-1 rounded-full bg-[linear-gradient(90deg,_#4654F0_0%,_#C25278_100%)] text-white shadow-sm flex items-center gap-1 cursor-pointer"
                onClick={copyRoomCode}
                title="Tap to copy Room ID"
              >
                <span className="text-white/70 text-xs font-normal">Room ID :</span>
                <span>{roomCode}</span>
              </span>
            )}
            {/* Share button always visible */}
            <div className="relative flex-shrink-0 min-w-0">
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
            {/* Copy and Keyboard buttons only on sm+ */}
            <div className="relative hidden sm:inline-flex">
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
            <div className="hidden sm:inline-flex">
              <KeyboardShortcuts isHost={isHost} />
            </div>
          </div>
        </div>
      </header>
      {/* Leave Room Confirmation Dialog */}
      {showLeaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background border border-border rounded-xl shadow-xl p-6 max-w-xs w-full flex flex-col items-center">
            <div className="text-lg font-semibold mb-2 text-center">Leave Room?</div>
            <div className="text-sm text-muted-foreground mb-4 text-center">Are you sure you want to leave the room? You will be redirected to the home screen.</div>
            <div className="flex gap-3 w-full justify-center">
              <button className="btn btn-secondary w-1/2" onClick={() => setShowLeaveDialog(false)}>Cancel</button>
              <button className="btn btn-primary w-1/2" onClick={confirmLeave}>Leave</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
