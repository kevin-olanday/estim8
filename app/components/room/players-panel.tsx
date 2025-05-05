"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Check, Crown } from "lucide-react"
import { usePusherContext } from "@/app/context/pusher-context"
import { useNotification } from "@/app/context/notification-context"
import type { Deck } from "@/types/card"

interface Player {
  id: string
  name: string
  emoji?: string
  vote: string | null
  isOnline: boolean
  isHost: boolean
}

interface PlayersPanelProps {
  players: Player[]
  hostId: string
  currentPlayerId: string
  votesRevealed: boolean
  deck: Deck
}

export default function PlayersPanel({ players, hostId, currentPlayerId, votesRevealed, deck }: PlayersPanelProps) {
  const { channel } = usePusherContext()
  const { showNotification } = useNotification()
  const [localPlayers, setLocalPlayers] = useState(players)

  useEffect(() => {
    setLocalPlayers(players)
  }, [players])

  useEffect(() => {
    if (!channel) return

    const handleVoteSubmitted = (data: any) => {
      setLocalPlayers((prev) =>
        prev.map((player) =>
          player.id === data.playerId
            ? { ...player, vote: data.value }
            : player
        )
      )
    }

    const handlePlayerJoined = (data: any) => {
      showNotification(`${data.playerName} joined the room`, "info")
    }

    const handlePlayerLeft = (data: any) => {
      showNotification(`${data.playerName} left the room`, "info")
    }

    // NEW: Reset votes when active story changes
    const handleActiveStoryChanged = () => {
      setLocalPlayers((prev) =>
        prev.map((player) => ({
          ...player,
          vote: null,
        }))
      )
    }

    channel.bind("vote-submitted", handleVoteSubmitted)
    channel.bind("player-joined", handlePlayerJoined)
    channel.bind("player-left", handlePlayerLeft)
    channel.bind("active-story-changed", handleActiveStoryChanged)

    return () => {
      channel.unbind("vote-submitted", handleVoteSubmitted)
      channel.unbind("player-joined", handlePlayerJoined)
      channel.unbind("player-left", handlePlayerLeft)
      channel.unbind("active-story-changed", handleActiveStoryChanged)
    }
  }, [channel, showNotification])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getCardColor = (value: string) => {
    const card = deck.find((card) => card.label === value)
    return card?.color || "#f5f5f5"
  }

  const getCardEmoji = (value: string) => {
    const card = deck.find((card) => card.label === value)
    return card?.emoji || ""
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Players ({localPlayers.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {localPlayers.map((player) => (
            <div key={player.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50">
              <div className="flex items-center space-x-3">
                <Avatar className={!player.isOnline ? "opacity-50" : ""}>
                  <AvatarFallback>{player.emoji || getInitials(player.name)}</AvatarFallback>
                </Avatar>
                <div className="text-sm font-medium flex items-center">
                  {player.name}
                  {player.id === currentPlayerId && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      You
                    </Badge>
                  )}
                  {player.isHost && <Crown className="h-3 w-3 ml-1 text-amber-500" />}
                </div>
                {!player.isOnline && <p className="text-xs text-muted-foreground">Offline</p>}
              </div>

              <div>
                {player.vote ? (
                  votesRevealed ? (
                    <Badge
                      style={{
                        backgroundColor: getCardColor(player.vote),
                        color:
                          getCardColor(player.vote) && getCardColor(player.vote) !== "#f5f5f5" ? "#fff" : undefined,
                      }}
                    >
                      {getCardEmoji(player.vote) && <span className="mr-1">{getCardEmoji(player.vote)}</span>}
                      {player.vote}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Check className="h-3 w-3" />
                    </Badge>
                  )
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Thinking...
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
