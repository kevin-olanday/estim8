"use client"

import { Copy, Share2, Pencil, X, Check, LogOut, Keyboard } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { copyToClipboard } from "@/lib/copy-to-clipboard"
import { KeyboardShortcutsContent } from "@/app/components/room/keyboard-shortcuts-content"
import { useRouter } from "next/navigation"
import { updateRoomName as updateRoomNameAction } from "@/app/actions/room-actions"
import { usePusherContext } from "@/app/context/pusher-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface RoomHeaderProps {
  roomCode: string
  roomName?: string
  isHost: boolean
  hostName?: string
  players: { id: string, name: string, isHost: boolean }[]
  currentPlayerId: string
  roomId: string
}

export default function RoomHeader({ roomCode, roomName, isHost, hostName, players, currentPlayerId, roomId }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const { toast } = useToast()
  const [darkMode, setDarkMode] = useState(true)
  const logoRef = useRef<HTMLSpanElement>(null)
  const router = useRouter()
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(roomName || "")
  const [saving, setSaving] = useState(false)
  const [hovered, setHovered] = useState(false)
  const fallbackRoomName = hostName ? `${hostName}'s Room` : "Room"
  const [currentRoomName, setCurrentRoomName] = useState(roomName || fallbackRoomName)
  const { pusher, channel } = usePusherContext?.() || {}
  const [selectedNewHost, setSelectedNewHost] = useState<string>("")
  const [otherParticipants, setOtherParticipants] = useState<{id: string, name: string}[]>([])
  const [leaveError, setLeaveError] = useState<string>("")
  const [canShare, setCanShare] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

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

  useEffect(() => {
    // Use real participant list, excluding self
    setOtherParticipants(players.filter(p => p.id !== currentPlayerId).map(p => ({ id: p.id, name: p.name })));
  }, [players, currentPlayerId]);

  useEffect(() => {
    setCanShare(typeof window !== 'undefined' && !!navigator.share);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && e.shiftKey) {
        setShowShortcuts(true);
      }
      // Alt+C to copy room code (avoid if in input/textarea)
      if (
        (e.key === "c" || e.key === "C") &&
        e.altKey &&
        !(document.activeElement instanceof HTMLInputElement) &&
        !(document.activeElement instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        copyRoomCode();
      }
      // Alt+A to open Add Story (for hosts only)
      if (
        (e.key === "a" || e.key === "A") &&
        e.altKey &&
        isHost &&
        !(document.activeElement instanceof HTMLInputElement) &&
        !(document.activeElement instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("open-add-story-dialog"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHost]);

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
    const shareText = `Join my EstiM8 planning poker session: ${roomName ? ` for \"${roomName}\"` : ''}`;
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: roomUrl,
      }).then(() => {
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }).catch((error) => {
        console.error('Error sharing:', error);
      });
    }
  }

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLeaveModal(true);
  };

  const confirmLeave = () => {
    setShowLeaveModal(false);
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

  async function handleLeaveRoom() {
    setLeaveError("")
    const payload: any = { roomId, userId: currentPlayerId };
    if (isHost && otherParticipants.length > 0) payload.newHostId = selectedNewHost;
    console.log("[LEAVE ROOM PAYLOAD]", payload);
    try {
      const res = await fetch("/api/room/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowLeaveModal(false);
        window.location.href = "/";
      } else {
        const data = await res.json();
        setLeaveError(data.error || "Failed to leave room");
      }
    } catch {
      setLeaveError("Failed to leave room");
    }
  }

  return (
    <>
      {/* Neon/gradient bar for distinction */}
      <div className="w-full " />
      <header
        className="w-full shadow-xl border-b border-border bg-background px-6 py-2 md:py-4 transition-all"
        style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
      >
        <div className="mx-auto flex flex-row items-center justify-between gap-2 w-full">
          {/* Left: Logo and Slogan stacked */}
          <div className="flex flex-row items-center gap-3 min-w-0">
            <img
              src="/images/placeholder-logo.png"
              alt="EstiM8 logo"
              className="h-8 md:h-12 mb-1 mx-auto filter invert cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
              tabIndex={0}
              onClick={handleLogoClick}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleLogoClick(e as any); }}
              aria-label="Go to home screen"
            />
            <span className="mx-2 h-7 w-1 bg-white/60 rounded-full inline-block align-middle shadow"></span>
            {currentRoomName && (
              editing ? (
                <form
                  className="flex items-center gap-1"
                  onSubmit={async e => {
                    e.preventDefault();
                    if (!editValue.trim()) return;
                    await updateRoomName(editValue.trim());
                  }}
                >
                  <input
                    className="font-bold text-sm md:text-xl text-white tracking-tight truncate max-w-[30vw] md:max-w-xs bg-transparent border-b border-accent/40 focus:outline-none focus:border-accent px-1"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={async e => {
                      e.preventDefault();
                      if (!editValue.trim()) return;
                      await updateRoomName(editValue.trim());
                    }}
                    autoFocus
                    maxLength={40}
                  />
                </form>
              ) : (
                <span
                  className="ml-1 font-bold text-sm md:text-xl text-white tracking-tight truncate max-w-[30vw] md:max-w-xs flex items-center group drop-shadow"
                  title={currentRoomName}
                  style={{lineHeight: 1.1, cursor: isHost ? 'pointer' : 'default'}}
                  onClick={isHost ? () => setEditing(true) : undefined}
                >
                  {currentRoomName}
                  {isHost && (
                    <Pencil className="ml-1 w-4 h-4 text-accent/80 opacity-80 group-hover:opacity-100 transition-opacity duration-150" />
                  )}
                </span>
              )
            )}
          </div>
          {/* Right: Controls */}
          <div className="flex flex-row items-center gap-2 flex-nowrap justify-center sm:justify-end mt-2 sm:mt-0">
            {/* Room Code Badge (no label, smaller font on mobile) */}
            <button
              type="button"
              onClick={async () => {
                await copyToClipboard(roomCode)
                setCopied(true)
                toast({ title: "Copied!", description: "Room code copied to clipboard." })
                setTimeout(() => setCopied(false), 700)
              }}
              className={`ml-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-bold text-base md:text-sm flex items-center gap-2 shadow-lg transition-transform duration-200 focus:outline-none active:scale-95 ${copied ? 'scale-110 ring-2 ring-pink-400/60' : ''}`}
              aria-label="Copy room code"
            >
              <span className="hidden sm:inline">Room ID:&nbsp;</span>
              <span className="tracking-widest font-mono text-sm md:text-base select-all">{roomCode}</span>
            </button>
            {/* Share Button (hidden on mobile) */}
            <div className="flex gap-3 items-center ml-2">
              {/* Copy Button (desktop/tablet only, or mobile if no Web Share API) */}
              {(!canShare || typeof window === 'undefined') && (
                <button
                  className={`header-action-btn header-action-btn-accent hidden sm:inline-flex ${copied ? 'text-green-500 border-green-500' : ''}`}
                  onClick={copyRoomCode}
                  aria-label="Copy room code"
                  type="button"
                >
                  <Copy className="w-6 h-6" />
                </button>
              )}
              {/* Share Button (only if Web Share API is available) */}
              {canShare && (
                <button
                  className="header-action-btn header-action-btn-accent"
                  onClick={shareRoom}
                  aria-label="Share room link"
                  type="button"
                >
                  <Share2 className="w-6 h-6" />
                </button>
              )}
              {/* Keyboard Shortcuts Button */}
              <button
                className="header-action-btn header-action-btn-accent hidden sm:inline-flex"
                aria-label="Keyboard Shortcuts"
                type="button"
                tabIndex={0}
                onClick={() => setShowShortcuts(true)}
              >
                <Keyboard className="w-6 h-6" />
              </button>
              {/* Leave Room Button */}
              <button
                className="header-action-btn header-action-btn-destructive"
                onClick={() => setShowLeaveModal(true)}
                aria-label="Leave Room"
                type="button"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Leave Room Modal */}
      <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <DialogContent className="max-w-md rounded-2xl border-2 border-accent shadow-xl">
          <DialogHeader>
            <DialogTitle>
              {isHost && otherParticipants.length > 0
                ? "Transfer Host & Leave Room"
                : isHost && otherParticipants.length === 0
                ? "Delete Room?"
                : "Leave Room?"}
            </DialogTitle>
          </DialogHeader>
          {isHost && otherParticipants.length > 0 ? (
            <>
              <DialogDescription className="mb-4">Select a new host before leaving:</DialogDescription>
              <select
                className="w-full border rounded p-2 mb-4"
                value={selectedNewHost}
                onChange={e => setSelectedNewHost(e.target.value)}
              >
                <option value="">Select new host</option>
                {otherParticipants.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {leaveError && <div className="text-red-500 text-sm mb-2">{leaveError}</div>}
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>Cancel</Button>
                <Button
                  variant="destructive"
                  disabled={!selectedNewHost}
                  onClick={handleLeaveRoom}
                >
                  Transfer & Leave
                </Button>
              </div>
            </>
          ) : isHost && otherParticipants.length === 0 ? (
            <>
              <DialogDescription className="mb-4">You are the last participant. Leaving will delete the room. Continue?</DialogDescription>
              {leaveError && <div className="text-red-500 text-sm mb-2">{leaveError}</div>}
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleLeaveRoom}>Delete & Leave</Button>
              </div>
            </>
          ) : (
            <>
              <DialogDescription className="mb-4">Are you sure you want to leave the room?</DialogDescription>
              {leaveError && <div className="text-red-500 text-sm mb-2">{leaveError}</div>}
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleLeaveRoom}>Leave</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Keyboard Shortcuts Modal */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="sm:max-w-md">
          <KeyboardShortcutsContent isHost={isHost} />
        </DialogContent>
      </Dialog>
    </>
  )
}
