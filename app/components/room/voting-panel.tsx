"use client"

import { useState, useEffect, useCallback } from "react"
import { Card as CardUI } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { submitVote } from "@/app/actions/vote-actions"
import { usePusherContext } from "@/app/context/pusher-context"
import { VoteStatistics } from "@/app/components/room/vote-statistics"
import { Confetti } from "@/app/components/ui/confetti"
import { Card } from "@/app/components/room/card"
import { useCurrentStory } from "@/app/context/current-story-context"
import type { Deck } from "@/types/card"

interface Vote {
  playerId: string
  value: string
}

interface VotingPanelProps {
  deck: Deck
  currentVote: string | null
  votesRevealed: boolean
  isHost: boolean
  votes: {
    playerId: string
    playerName: string
    value: string
  }[]
  players: {
    id: string
    name: string
  }[]
  roomData: {
    currentVotes: Vote[]
    players: {
      id: string
      name: string
    }[]
  }
  storyId?: string // <-- Add this line
}

export default function VotingPanel({
  deck = [],
  currentVote,
  votesRevealed,
  isHost = false,
  votes = [],
  players = [],
  roomData,
}: VotingPanelProps) {
  const { currentStory } = useCurrentStory()
  const storyId = currentStory?.id

  const [selectedCard, setSelectedCard] = useState<string | null>(currentVote)
  const [isVoting, setIsVoting] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const { channel } = usePusherContext()

  // Reset selectedCard when the active story changes
  useEffect(() => {
    setSelectedCard(null)
  }, [storyId])

  useEffect(() => {
    setSelectedCard(currentVote)
  }, [currentVote])

  useEffect(() => {
    if (!channel) return

    const handleVotesRevealed = () => {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }

    const handleVotesReset = () => {
      setSelectedCard(null)
      setShowConfetti(false)
    }

    channel.bind("votes-revealed", handleVotesRevealed)
    channel.bind("votes-reset", handleVotesReset)

    return () => {
      channel.unbind("votes-revealed", handleVotesRevealed)
      channel.unbind("votes-reset", handleVotesReset)
    }
  }, [channel])

  const handleVote = useCallback(
    async (value: string) => {
      if (isVoting || !storyId) return

      setIsVoting(true)
      setSelectedCard(value)

      try {
        await submitVote(storyId, value)
      } catch (error) {
        console.error("Failed to submit vote:", error)
      } finally {
        setIsVoting(false)
      }
    },
    [isVoting, storyId],
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      if (e.key >= "1" && e.key <= "9") {
        const cardIndex = Number.parseInt(e.key) - 1
        if (cardIndex >= 0 && cardIndex < deck.length) {
          handleVote(deck[cardIndex].label)
        }
      }
      if (e.key === "0" && deck.length > 0) {
        const lastCard = deck[deck.length - 1]
        if (lastCard.label === "?") {
          handleVote(lastCard.label)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [deck, handleVote])

  const votingDisabled = currentStory?.status !== "active"

  return (
    <div className="space-y-4">
      {showConfetti && <Confetti />}
      <h2 className="text-lg font-medium">Your Estimate</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {deck.map((card) => (
          <Card
            key={card.label}
            card={card}
            selected={selectedCard === card.label}
            disabled={isVoting || !storyId}
            onClick={() => handleVote(card.label)}
          />
        ))}
      </div>

      <div>
        <button
          disabled={votingDisabled}
          onClick={() => handleVote(selectedCard || "")}
        >
          Vote
        </button>
      </div>

      {votesRevealed && (
        <CardUI className="mt-6">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Votes have been revealed</p>
              <p className="text-lg font-medium mt-1">Your vote: {selectedCard ? selectedCard : "None"}</p>
            </div>
          </CardContent>
        </CardUI>
      )}

      {votesRevealed && votes.length > 0 && (
        <div className="mt-6">
          <VoteStatistics votes={votes} deck={deck} />
        </div>
      )}

      <div>
        {players.map((player) => {
          const vote = votes.find((v) => v.playerId === player.id)
          return (
            <div key={player.id}>
              {player.name}:{" "}
              {vote
                ? votesRevealed
                  ? vote.value
                  : "Voted"
                : "Thinking..."}
            </div>
          )
        })}
      </div>
    </div>
  )
}
