"use client"

import { useState, useEffect } from "react"
import { usePusherContext } from "@/app/context/pusher-context"
import RoomHeader from "@/app/components/room/room-header"
import VotingPanel from "@/app/components/room/voting-panel"
import CurrentStory from "@/app/components/room/current-story"
import PlayersPanel from "@/app/components/room/players-panel"
import HostControls from "@/app/components/room/host-controls"
import StoriesPanel from "@/app/components/room/stories-panel"
import { Separator } from "@/components/ui/separator"
import { WelcomeMessage } from "@/app/components/room/welcome-message"
import DeckSettings from "@/app/components/room/deck-settings"
import { CurrentStoryProvider } from "@/app/context/current-story-context"
import { PusherProvider } from "@/app/context/pusher-context"
import { HistoryPanel } from "@/app/components/room/history-panel"
import { useCurrentStory } from "@/app/context/current-story-context"

export default function RoomClient({ roomData }: { roomData: any }) {
  // Use initial story from roomData
  return (
    <CurrentStoryProvider initialStory={roomData.currentStory}>
      <RoomClientInner roomData={roomData} />
    </CurrentStoryProvider>
  )
}

// New inner component that uses the context
function RoomClientInner({ roomData }: { roomData: any }) {
  const { channel } = usePusherContext()
  const { currentStory, setCurrentStory } = useCurrentStory()
  const [localVotes, setLocalVotes] = useState(roomData.currentVotes)
  const [votesRevealed, setVotesRevealed] = useState(roomData.currentStory?.votesRevealed ?? false)

  // Keep localVotes in sync with initial data if roomData changes (e.g. on navigation)
  useEffect(() => {
    setLocalVotes(roomData.currentVotes)
  }, [roomData.currentVotes])

  // Listen for real-time vote submissions
  useEffect(() => {
    if (!channel) return
    const handleVoteSubmitted = (data: any) => {
      setLocalVotes((prev: { playerId: string; value: string }[]) => {
        const existing = prev.find((v: { playerId: string; value: string }) => v.playerId === data.playerId)
        if (existing) {
          return prev.map((v: { playerId: string; value: string }) =>
            v.playerId === data.playerId ? { ...v, value: data.value ?? "Voted" } : v
          )
        } else {
          return [...prev, { playerId: data.playerId, value: data.value ?? "Voted" }]
        }
      })
    }
    channel.bind("vote-submitted", handleVoteSubmitted)
    return () => channel.unbind("vote-submitted", handleVoteSubmitted)
  }, [channel])

  // Listen for real-time story changes and votes revealed
  useEffect(() => {
    if (!channel) return

    const handleActiveStoryChanged = (data: any) => {
      setCurrentStory({
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        votesRevealed: false,
      })
      setLocalVotes([])
      setVotesRevealed(false)
    }

    channel.bind("active-story-changed", handleActiveStoryChanged)
    return () => channel.unbind("active-story-changed", handleActiveStoryChanged)
  }, [channel, setCurrentStory])

  useEffect(() => {
    if (!channel) return

    const handleVotesRevealed = (data: any) => {
      setVotesRevealed(true)
      if (Array.isArray(data.votes)) {
        setLocalVotes(data.votes)
      }
    }

    channel.bind("votes-revealed", handleVotesRevealed)
    return () => channel.unbind("votes-revealed", handleVotesRevealed)
  }, [channel])

  // Calculate allPlayersVoted from real-time localVotes and players
  const allPlayersVoted =
    roomData.players.length > 0 &&
    roomData.players.every((player: { id: string }) =>
      localVotes.some((vote: { playerId: string }) => vote.playerId === player.id)
    )

  // 1. Filter completed stories from roomData.stories
  const completedStories = roomData.stories.filter(
    (story: any) => story.status === "completed" || story.completed
  )

  console.log("DEBUG HostControls", {
    allPlayersVoted,
    localVotes,
    players: roomData.players,
    storyStatus: currentStory?.status,
    votesRevealed,
    canRevealVotes:
      currentStory?.status === "active" && allPlayersVoted && !votesRevealed,
  })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <WelcomeMessage isHost={roomData.isHost} roomCode={roomData.code} />
      <RoomHeader roomCode={roomData.code} isHost={roomData.isHost} />

      <PusherProvider roomId={roomData.id}>
        <div className="flex-1 container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CurrentStory story={currentStory} isHost={roomData.isHost} />
            <Separator />
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <VotingPanel
                  deck={roomData.deck}
                  currentVote={roomData.currentUserVote}
                  votesRevealed={votesRevealed}
                  isHost={roomData.isHost}
                  storyId={currentStory?.id}
                  votes={localVotes}
                  players={roomData.players}
                  roomData={roomData}
                />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <StoriesPanel stories={roomData.stories} isHost={roomData.isHost} />
            <PlayersPanel
              players={roomData.players}
              hostId={roomData.hostId}
              currentPlayerId={roomData.currentPlayerId}
              votesRevealed={votesRevealed}
              deck={roomData.deck}
            />
            {roomData.isHost && (
              <>
                <HostControls
                  currentStoryId={currentStory?.id || null}
                  votesRevealed={votesRevealed}
                  hasVotes={localVotes.length > 0}
                  autoRevealVotes={roomData.autoRevealVotes}
                  allPlayersVoted={allPlayersVoted}
                  storyStatus={currentStory?.status}
                />
                <DeckSettings currentDeckType={roomData.deckType} currentDeck={roomData.deck} />
              </>
            )}
            <HistoryPanel completedStories={completedStories} />
          </div>
        </div>
      </PusherProvider>
    </div>
  )
}