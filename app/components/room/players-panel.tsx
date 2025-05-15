"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Loader, CheckCircle, Circle, Users, Pencil, X, Check } from "lucide-react"
import { usePusherContext } from "@/app/context/pusher-context"
import { useToast } from "@/hooks/use-toast"
import { useCurrentStory } from "@/app/context/current-story-context"
import type { Deck } from "@/types/card"
import { kickPlayer } from "@/app/actions/room-actions"
import { updatePlayer } from "@/app/actions/player-actions"
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog"
import { PlayerAvatar } from "./player-avatar"

interface Player {
  id: string
  name: string
  emoji?: string
  vote: string | null
  isOnline: boolean
  isHost: boolean
  hasVoted?: boolean
  avatarStyle?: string | null
  avatarSeed?: string | null
}

interface PlayersPanelProps {
  players: Player[]
  hostId: string
  currentPlayerId: string
  votesRevealed: boolean
  deck: Deck
}

function StatusIcon({ status, title }: { status: "thinking" | "voted" | "offline" | "no-vote"; title: string }) {
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
  if (status === "no-vote") {
    return (
      <span title={title}>
        {/* Muted circle-slash (ban) icon for no vote */}
        <svg className="w-4 h-4 text-muted-foreground opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-label={title}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <line x1="5" y1="19" x2="19" y2="5" stroke="currentColor" strokeWidth="2" />
        </svg>
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
  const { toast } = useToast()
  const { currentStory } = useCurrentStory()
  const storyId = currentStory?.id
  const lastStoryId = useRef<string | undefined>(storyId)

  const [localPlayers, setLocalPlayers] = useState<Player[]>(players)
  const [presenceReady, setPresenceReady] = useState(false)
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

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

    const handleVotesRevealed = (data: any) => {
      if (!data || !Array.isArray(data.votes)) return;
      setLocalPlayers((prev) =>
        prev.map((player) => {
          const revealed = data.votes.find((v: any) => v.playerId === player.id);
          return {
            ...player,
            vote: revealed ? revealed.value : null,
            hasVoted: !!revealed,
          };
        })
      );
    };

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

    const handleVoteRemoved = (data: any) => {
      setLocalPlayers((prev) =>
        prev.map((player) =>
          player.id === data.playerId
            ? { ...player, hasVoted: false, vote: null }
            : player
        )
      );
    };

    channel.bind("votes-revealed", handleVotesRevealed)
    channel.bind("vote-submitted", handleVoteSubmitted)
    channel.bind("votes-reset", handleVotesReset)
    channel.bind("vote-removed", handleVoteRemoved)

    return () => {
      channel.unbind("votes-revealed", handleVotesRevealed)
      channel.unbind("vote-submitted", handleVoteSubmitted)
      channel.unbind("votes-reset", handleVotesReset)
      channel.unbind("vote-removed", handleVoteRemoved)
    }
  }, [channel, votesRevealed])

  // Real-time handlers
  useEffect(() => {
    if (!channel) return

    const handlePlayerJoined = (data: any) => {
      toast({ description: `${data.playerName} joined the room` })
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
            avatarStyle: data.avatarStyle || null,
            avatarSeed: data.avatarSeed || null,
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
      toast({ description: `${member.info?.name || "A user"} left the room` })
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
  }, [channel, toast])

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
            avatarStyle: member.info?.avatarStyle || null,
            avatarSeed: member.info?.avatarSeed || null,
          },
        ]
      })
      if (member.id !== channel.members.me.id) {
        toast({ description: `${member.info?.name || "A user"} joined the room` })
      }
    }

    channel.bind("pusher:member_added", handleMemberAdded)

    return () => {
      channel.unbind("pusher:member_added", handleMemberAdded)
    }
  }, [channel, toast])

  useEffect(() => {
    if (!channel) return

    const handlePlayerKicked = (data: { playerId: string; playerName?: string }) => {
      if (data.playerId === currentPlayerId) {
        toast({ description: "You were removed from the room by the host." })
        setTimeout(() => {
          window.location.href = "/"
        }, 2000)
      } else {
        setLocalPlayers((prev) => prev.filter((p) => p.id !== data.playerId))
        toast({ description: `${data.playerName || "A player"} was removed from the room.` })
      }
    }

    channel.bind("player-kicked", handlePlayerKicked)
    return () => channel.unbind("player-kicked", handlePlayerKicked)
  }, [channel, currentPlayerId, toast])

  // Listen for player-updated events
  useEffect(() => {
    if (!channel) return
    const handlePlayerUpdated = (data: any) => {
      setLocalPlayers((prev) =>
        prev.map((p) =>
          p.id === data.id
            ? { ...p, name: data.name, avatarStyle: data.avatarStyle, avatarSeed: data.avatarSeed }
            : p
        )
      )
    }
    channel.bind("player-updated", handlePlayerUpdated)
    return () => channel.unbind("player-updated", handlePlayerUpdated)
  }, [channel])

  const handleKick = async (playerId: string, playerName: string) => {
    try {
      await kickPlayer(playerId)
    } catch (err) {
      toast({ description: `Failed to kick ${playerName}` })
    }
  }

  if (!presenceReady) {
    return (
      <Card className="section-card">
        <div className="panel-header">
          <Users className="h-5 w-5 text-accent/80" />
          <h2 className="panel-title">Players</h2>
        </div>
        <div className="mb-3" />
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
      <div className="panel-header">
        <Users className="h-5 w-5 text-accent/80" />
        <h2 className="panel-title">Players <span className="text-xs font-normal text-muted-foreground/70">({localPlayers.length})</span></h2>
      </div>
      <div className="mb-3" />
      <CardContent className="space-y-6">
        <div className="space-y-1">
          {sortedPlayers.map((player) => {
            const isCurrent = player.id === currentPlayerId
            const isHost = player.isHost
            const isOnline = player.isOnline
            const hasVoted = player.hasVoted

            let finalStatus: "thinking" | "voted" | "offline" | "no-vote";
            let statusTitle = "";

            if (votesRevealed) {
              if (player.vote) {
                // Don't use StatusIcon here, directly render the vote
              } else {
                finalStatus = "no-vote";
                statusTitle = "Did not vote";
              }
            } else {
              if (!isOnline) {
                finalStatus = "offline";
                statusTitle = "Offline";
              } else if (hasVoted) {
                finalStatus = "voted";
                statusTitle = "Voted";
              } else {
                finalStatus = "thinking";
                statusTitle = "Estimating";
              }
            }

            return (
              <div
                key={player.id}
                className={`section-card flex items-center gap-3 min-w-0 group transition ${isCurrent ? "border-2 border-accent shadow" : ""} ${!isOnline ? "opacity-50" : ""} hover:bg-accent/10`}
                tabIndex={0}
                aria-label={`${player.name}${isHost ? " (Host)" : ""}${isCurrent ? " (You)" : ""}${!isOnline ? " (Offline)" : ""}`}
              >
                {/* Left: Avatar, Name, Badges, Kick */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <PlayerAvatar
                    name={player.name}
                    avatarStyle={player.avatarStyle || undefined}
                    avatarSeed={player.avatarSeed || undefined}
                    size="md"
                  />
                  <div className="flex-1 min-w-0 flex items-center gap-2 h-9 relative group/name-edit">
                    {editingPlayerId === player.id ? (
                      <form
                        className="flex items-center gap-1 w-full"
                        onSubmit={async (e) => {
                          e.preventDefault()
                          if (!editName.trim() || isSaving) return
                          setIsSaving(true)
                          try {
                            await updatePlayer(player.id, { name: editName.trim() })
                            if (player.id === currentPlayerId) {
                              document.cookie = `playerName=${encodeURIComponent(editName.trim())}; path=/;`;
                            }
                            setEditingPlayerId(null)
                          } catch (err) {
                            // Optionally show error
                          } finally {
                            setIsSaving(false)
                          }
                        }}
                      >
                        <input
                          className="px-2 py-1 rounded-lg border border-accent/40 bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent w-28"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          disabled={isSaving}
                          autoFocus
                        />
                        <button type="submit" className="text-accent" disabled={isSaving} title="Save">
                          <Check className="w-4 h-4" />
                        </button>
                        <button type="button" className="text-muted-foreground" onClick={() => setEditingPlayerId(null)} title="Cancel" disabled={isSaving}>
                          <X className="w-4 h-4" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className="text-sm font-semibold truncate">
                          {player.name}
                        </span>
                        {/* Edit icon for current user */}
                        {isCurrent && (
                          <button
                            type="button"
                            className="ml-1 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
                            style={{ background: 'transparent', lineHeight: 0 }}
                            onClick={() => {
                              setEditingPlayerId(player.id)
                              setEditName(player.name)
                            }}
                            title="Edit your name"
                          >
                            <Pencil className="w-4 h-4 text-accent" />
                          </button>
                        )}
                        {isCurrent && (
                          <span className="ml-1 px-1.5 py-0 rounded-full bg-accent/20 text-accent text-[10px] font-semibold normal-case flex-shrink-0">You</span>
                        )}
                        {isHost && (
                          <span className="ml-1 px-1.5 py-0 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-semibold normal-case flex-shrink-0">Host</span>
                        )}
                      </>
                    )}
                  </div>
                  {/* Kick button (if present) */}
                  {hostId === currentPlayerId && player.id !== currentPlayerId && (
                    <ConfirmDialog
                      title={<span className="flex items-center gap-2 text-red-600"><LogOut className="w-5 h-5" /> Kick Player</span>}
                      description={<span>Are you sure you want to remove <b>{player.name}</b> from the room? This action cannot be undone.</span>}
                      actionText={<span className="flex items-center gap-1"><LogOut className="w-4 h-4" /> Kick</span>}
                      cancelText="Cancel"
                      onConfirm={async () => { await handleKick(player.id, player.name) }}
                    >
                      <button
                        className="btn btn-ghost text-red-500 hover:text-red-700 p-1 text-sm flex-shrink-0 flex items-center justify-center"
                        title="Kick player"
                        type="button"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </ConfirmDialog>
                  )}
                </div>
                {/* Right: Status Icon */}
                <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
                  {votesRevealed ? (
                    player.vote ? (
                      <span className="btn-utility text-xs px-2 py-0.5 flex items-center" title={`Voted: ${player.vote}`}>{player.vote}</span>
                    ) : (
                      <StatusIcon status="no-vote" title="Did not vote" />
                    )
                  ) : (
                    <StatusIcon status={finalStatus!} title={statusTitle} />
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
