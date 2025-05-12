"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LogOut, Loader, CheckCircle, Circle, Crown, Users, User } from "lucide-react"
import { usePusherContext } from "@/app/context/pusher-context"
import { useNotification } from "@/app/context/notification-context"
import { kickPlayer } from "@/app/actions/room-actions"
import { useCurrentStory } from "@/app/context/current-story-context"
import type { Deck } from "@/types/card"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

interface Player {
  id: string
  name: string
  emoji?: string
  vote: string | null
  isOnline: boolean
  isHost: boolean
  hasVoted?: boolean
}

interface PlayersPanelProps {
  players: Player[]
  hostId: string
  currentPlayerId: string
  votesRevealed: boolean
  deck: Deck
}

function StatusIcon({ status, title }: { status: "thinking" | "voted" | "offline"; title: string }) {
  if (status === "thinking") {
    return (
      <span title={title}>
        <Loader
          className="w-4 h-4 animate-spin text-secondary"
          aria-label={title}
        />
      </span>
    )
  }
  if (status === "voted") {
    return (
      <span title={title}>
        <CheckCircle
          className="w-4 h-4 text-accent"
          aria-label={title}
        />
      </span>
    )
  }
  // offline
  return (
    <span title={title}>
      <Circle
        className="w-3 h-3 text-muted-foreground opacity-50"
        aria-label={title}
      />
    </span>
  )
}

export default function PlayersPanel({ players, hostId, currentPlayerId, votesRevealed, deck }: PlayersPanelProps) {
  const { channel } = usePusherContext()
  const { showNotification } = useNotification()
  const { currentStory } = useCurrentStory()
  const storyId = currentStory?.id
  const lastStoryId = useRef<string | undefined>(storyId)

  const [localPlayers, setLocalPlayers] = useState<Player[]>(players)
  const [presenceReady, setPresenceReady] = useState(false)

  // Only reset votes when story changes
  useEffect(() => {
    if (storyId !== lastStoryId.current) {
      setLocalPlayers(
        players.map((p) => ({
          ...p,
          vote: null,
          hasVoted: false,
        }))
      )
      lastStoryId.current = storyId
    }
  }, [players, storyId])

  useEffect(() => {
    if (!channel) return

    const handleSubscriptionSucceeded = () => {
      const onlineIds = Object.keys(channel.members.members || {})
      setLocalPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          isOnline: onlineIds.includes(p.id),
        }))
      )
      setPresenceReady(true)
    }

    channel.bind("pusher:subscription_succeeded", handleSubscriptionSucceeded)

    return () => {
      channel.unbind("pusher:subscription_succeeded", handleSubscriptionSucceeded)
    }
  }, [channel])

  // Handle vote updates
  useEffect(() => {
    if (!channel) return

    const handleVoteSubmitted = (data: any) => {
      setLocalPlayers((prev) =>
        prev.map((player) =>
          player.id === data.playerId
            ? {
                ...player,
                hasVoted: true,
                vote: votesRevealed ? data.value : null,
              }
            : player
        )
      )
    }

    const handleVotesReset = () => {
      setLocalPlayers((prev) =>
        prev.map((player) => ({
          ...player,
          vote: null,
          hasVoted: false,
        }))
      )
    }

    channel.bind("vote-submitted", handleVoteSubmitted)
    channel.bind("votes-reset", handleVotesReset)

    return () => {
      channel.unbind("vote-submitted", handleVoteSubmitted)
      channel.unbind("votes-reset", handleVotesReset)
    }
  }, [channel, votesRevealed])

  // Real-time handlers
  useEffect(() => {
    if (!channel) return

    const handlePlayerJoined = (data: any) => {
      showNotification(`${data.playerName} joined the room`, "info")
      setLocalPlayers((prev) => {
        if (prev.some((p) => p.id === data.playerId)) {
          return prev.map((p) =>
            p.id === data.playerId ? { ...p, isOnline: true } : p
          )
        }
        return [
          ...prev,
          {
            id: data.playerId,
            name: data.playerName,
            emoji: "👤",
            vote: null,
            isOnline: true,
            isHost: false,
          },
        ]
      })
    }

    const handlePlayerLeft = (member: any) => {
      setLocalPlayers((prev) =>
        prev.map((p) =>
          p.id === member.id ? { ...p, isOnline: false } : p
        )
      )
      showNotification(`${member.info?.name || "A user"} left the room`, "info")
    }

    const handleActiveStoryChanged = () => {
      setLocalPlayers((prev) =>
        prev.map((player) => ({
          ...player,
          vote: null,
          hasVoted: false,
        }))
      )
    }

    channel.bind("active-story-changed", handleActiveStoryChanged)
    channel.bind("pusher:member_removed", handlePlayerLeft)

    return () => {
      channel.unbind("active-story-changed", handleActiveStoryChanged)
      channel.unbind("pusher:member_removed", handlePlayerLeft)
    }
  }, [channel, showNotification])

  useEffect(() => {
    if (!channel) return

    const handleMemberAdded = (member: any) => {
      setLocalPlayers((prev) => {
        if (prev.some((p) => p.id === member.id)) {
          return prev.map((p) =>
            p.id === member.id ? { ...p, isOnline: true } : p
          )
        }
        return [
          ...prev,
          {
            id: member.id,
            name: member.info?.name || "Anonymous",
            emoji: member.info?.emoji || "👤",
            vote: null,
            isOnline: true,
            isHost: false,
          },
        ]
      })
      if (member.id !== channel.members.me.id) {
        showNotification(`${member.info?.name || "A user"} joined the room`, "info")
      }
    }

    channel.bind("pusher:member_added", handleMemberAdded)

    return () => {
      channel.unbind("pusher:member_added", handleMemberAdded)
    }
  }, [channel, showNotification])

  useEffect(() => {
    if (!channel) return

    const handlePlayerKicked = (data: { playerId: string; playerName?: string }) => {
      if (data.playerId === currentPlayerId) {
        showNotification("You were removed from the room by the host.", "error")
        setTimeout(() => {
          window.location.href = "/"
        }, 2000)
      } else {
        setLocalPlayers((prev) => prev.filter((p) => p.id !== data.playerId))
        showNotification(`${data.playerName || "A player"} was removed from the room.`, "info")
      }
    }

    channel.bind("player-kicked", handlePlayerKicked)
    return () => channel.unbind("player-kicked", handlePlayerKicked)
  }, [channel, currentPlayerId, showNotification])

  const handleKick = async (playerId: string, playerName: string) => {
    if (!window.confirm(`Kick ${playerName} from the room?`)) return
    try {
      await kickPlayer(playerId)
    } catch (err) {
      showNotification(`Failed to kick ${playerName}`, "error")
    }
  }

  if (!presenceReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">Loading players...</div>
        </CardContent>
      </Card>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Sort: You/Host → online → offline
  const sortedPlayers = [...localPlayers].sort((a, b) => {
    if (a.id === currentPlayerId) return -1
    if (b.id === currentPlayerId) return 1
    if (a.isHost && !b.isHost) return -1
    if (!a.isHost && b.isHost) return 1
    if (a.isOnline && !b.isOnline) return -1
    if (!a.isOnline && b.isOnline) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <Card className="section-card">
      <div className="flex items-center gap-2 py-3 px-4 border-b border-border bg-muted/40 rounded-t-2xl">
        <Users className="h-5 w-5 text-accent/80" />
        <h2 className="text-lg font-bold text-muted-foreground tracking-tight">Players <span className="text-xs font-normal text-muted-foreground/70">({localPlayers.length})</span></h2>
      </div>
      <div className="mb-3" />
      <CardContent className="space-y-6">
        <div className="space-y-1">
          {sortedPlayers.map((player) => {
            const isCurrent = player.id === currentPlayerId
            const isHost = player.isHost
            const isOnline = player.isOnline
            const hasVoted = player.hasVoted

            let status: "thinking" | "voted" | "offline"
            let statusTitle = ""
            if (!isOnline) {
              status = "offline"
              statusTitle = "Offline"
            } else if (!hasVoted) {
              status = "thinking"
              statusTitle = "Estimating"
            } else {
              status = "voted"
              statusTitle = "Voted"
            }

            return (
              <div
                key={player.id}
                className={`section-card px-2 py-1 rounded-xl border border-border bg-muted/60 flex items-center gap-3 min-w-0 group transition ${isCurrent ? "border-2 border-accent shadow" : ""} ${!isOnline ? "opacity-50" : ""} hover:bg-accent/10`}
                tabIndex={0}
                aria-label={`${player.name}${isHost ? " (Host)" : ""}${isCurrent ? " (You)" : ""}${!isOnline ? " (Offline)" : ""}`}
              >
                {/* Left: Avatar, Name, Badges, Kick */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarFallback>{player.emoji || getInitials(player.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 flex items-center gap-2 h-9">
                    <span className="text-sm font-semibold truncate">{player.name}</span>
                    {isCurrent && (
                      <span className="ml-1 px-1.5 py-0 rounded-full bg-accent/20 text-accent text-[10px] font-semibold normal-case flex-shrink-0">You</span>
                    )}
                    {isHost && (
                      <span className="ml-1 px-1.5 py-0 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-semibold normal-case flex-shrink-0">Host</span>
                    )}
                  </div>
                  {/* Kick button (if present) */}
                  {hostId === currentPlayerId && player.id !== currentPlayerId && (
                    <button
                      className="btn btn-ghost text-red-500 hover:text-red-700 p-1 text-sm flex-shrink-0 flex items-center justify-center"
                      title="Kick player"
                      onClick={() => handleKick(player.id, player.name)}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {/* Right: Status Icon */}
                <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
                  {votesRevealed ? (
                    player.vote ? (
                      <span className="btn-utility text-xs px-2 py-0.5 flex items-center" title={`Voted: ${player.vote}`}>{player.vote}</span>
                    ) : (
                      <StatusIcon status="thinking" title="No vote" />
                    )
                  ) : (
                    <StatusIcon status={hasVoted ? "voted" : "thinking"} title={hasVoted ? "Voted" : "Estimating"} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
