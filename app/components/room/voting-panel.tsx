"use client"

import { useState, useEffect, useCallback } from "react"
import { Card as CardUI } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { submitVote } from "@/app/actions/vote-actions"
import { usePusherContext } from "@/app/context/pusher-context"
import { VoteStatistics } from "@/app/components/room/vote-statistics"
import { Confetti } from "@/app/components/ui/confetti"
import { DeckCard } from "@/app/components/room/card"
import { useCurrentStory } from "@/app/context/current-story-context"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, BarChart2, Repeat, Hand } from "lucide-react"
import { easeOut, motion } from "framer-motion"
import type { Deck } from "@/types/card"
import { cn } from "@/lib/utils"
import ThemeSelectorModal from "./theme-selector-modal"
import CardFan from "./card-fan"
import CardGrid from "./card-grid"

interface Vote {
  playerId: string
  value: string
}

interface VotingPanelProps {
  deck: Deck
  currentVote: string | null
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
    currentUserId?: string
  }
  storyId?: string
}

export default function VotingPanel({
  deck = [],
  currentVote,
  isHost = false,
  votes = [],
  players = [],
  roomData,
}: VotingPanelProps) {
  const { currentStory, setCurrentStory } = useCurrentStory()
  const storyId = currentStory?.id

  const [selectedCard, setSelectedCard] = useState<string | null>(currentVote)
  const [isVoting, setIsVoting] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const { channel } = usePusherContext()
  const [hovered, setHovered] = useState<number | null>(null)
  const [keyboardHovered, setKeyboardHovered] = useState<number | null>(null)
  const [showThemeModal, setShowThemeModal] = useState(false)

  console.log('[VotingPanel] currentUserId:', roomData?.currentUserId, 'votes:', votes, 'currentVote:', currentVote);
  console.log('Deck:', deck);

  // Reset selectedCard and hide statistics when the active story changes
  useEffect(() => {
    setSelectedCard(null)
    setShowConfetti(false)
  }, [storyId])

  // Update selectedCard when currentVote changes
  useEffect(() => {
    setSelectedCard(currentVote)
  }, [currentVote])

  useEffect(() => {
    if (!channel) return

    const handleVotesRevealed = () => {
      console.log('[VotingPanel] votes-revealed event received');
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
      // Update the context
      setCurrentStory((prev: any) => {
        if (!prev) return prev;
        return { ...prev, votesRevealed: true };
      });
    }

    const handleVotesReset = () => {
      setSelectedCard(null)
      setShowConfetti(false)
      // Reset the context
      setCurrentStory((prev: any) => {
        if (!prev) return prev;
        return { ...prev, votesRevealed: false };
      });
    }

    const handleVoteSubmitted = (data: any) => {
      if (data.playerId === roomData?.currentUserId) {
        setSelectedCard(data.value)
      }
    }

    channel.bind("votes-revealed", handleVotesRevealed)
    channel.bind("votes-reset", handleVotesReset)
    channel.bind("vote-submitted", handleVoteSubmitted)

    return () => {
      channel.unbind("votes-revealed", handleVotesRevealed)
      channel.unbind("votes-reset", handleVotesReset)
      channel.unbind("vote-submitted", handleVoteSubmitted)
    }
  }, [channel, roomData?.currentUserId, setCurrentStory])

  useEffect(() => {
    if (!channel) return

    const handleStoryCompleted = (data: { id: string }) => {
      if (data.id === storyId) {
        setSelectedCard(null)
      }
    }

    channel.bind("story-completed", handleStoryCompleted)
    return () => channel.unbind("story-completed", handleStoryCompleted)
  }, [channel, storyId])

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
      // Number keys: move keyboardHovered
      if (e.key >= "1" && e.key <= "9") {
        const cardIndex = Number.parseInt(e.key) - 1
        if (cardIndex >= 0 && cardIndex < deck.length) {
          if (keyboardHovered === cardIndex) {
            handleVote(deck[cardIndex].label)
          } else {
            setKeyboardHovered(cardIndex)
          }
        }
      }
      if (e.key === "0" && deck.length > 0) {
        const lastIndex = deck.length - 1
        if (keyboardHovered === lastIndex) {
          handleVote(deck[lastIndex].label)
        } else {
          setKeyboardHovered(lastIndex)
        }
      }
      // Arrow keys: left/right navigation
      if (e.key === "ArrowRight") {
        setKeyboardHovered((prev) => {
          if (prev === null) return 0;
          return Math.min(deck.length - 1, prev + 1);
        });
      }
      if (e.key === "ArrowLeft") {
        setKeyboardHovered((prev) => {
          if (prev === null) return deck.length - 1;
          return Math.max(0, prev - 1);
        });
      }
      // Enter/Space: select hovered card
      if ((e.key === "Enter" || e.key === " ") && keyboardHovered !== null) {
        handleVote(deck[keyboardHovered].label)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [deck, handleVote, keyboardHovered])

  const votingDisabled = currentStory?.status !== "active"

  // Find the user's vote in the revealed votes
  const myVote = votes.find((v) => v.playerId === roomData?.currentUserId)?.value ?? currentVote

  // Debug logging for votesRevealed and votes
  console.log('VotingPanel:', { votesRevealed: currentStory?.votesRevealed, votes });

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === "Enter") {
      handleVote(deck[idx].label)
    }
  }

  // Gradient theme presets
  const gradientPresets = [
    { name: 'Default', value: 'bg-gradient-to-br from-gray-500 to-gray-700', from: '#6b7280', to: '#374151' },
    { name: 'Blue to Purple', value: 'bg-gradient-to-br from-blue-500 to-purple-600', from: '#3b82f6', to: '#9333ea' },
    { name: 'Pink Sunset', value: 'bg-gradient-to-br from-pink-400 to-rose-600', from: '#f472b6', to: '#e11d48' },
    { name: 'Citrus Pop', value: 'bg-gradient-to-br from-yellow-400 to-orange-500', from: '#facc15', to: '#f97316' },
    { name: 'Emerald Sky', value: 'bg-gradient-to-br from-green-400 to-teal-500', from: '#4ade80', to: '#14b8a6' },
    { name: 'Cyberpunk', value: 'bg-gradient-to-br from-fuchsia-600 to-cyan-400', from: '#c026d3', to: '#22d3ee' },
    { name: 'Ocean Fade', value: 'bg-gradient-to-br from-indigo-400 to-sky-500', from: '#818cf8', to: '#0ea5e9' },
    { name: 'Aurora Green', value: 'bg-gradient-to-br from-[#00ff99] to-[#0066ff]', from: '#00ff99', to: '#0066ff' },
    { name: 'Inferno', value: 'bg-gradient-to-br from-[#ff6b6b] to-[#ffa94d]', from: '#ff6b6b', to: '#ffa94d' },
    { name: 'Neon Noir', value: 'bg-gradient-to-br from-[#1f005c] to-[#5b247a]', from: '#1f005c', to: '#5b247a' },
    { name: 'Cotton Candy', value: 'bg-gradient-to-br from-[#f6d365] to-[#fda085]', from: '#f6d365', to: '#fda085' },
    { name: 'Bubblegum Bolt', value: 'bg-gradient-to-br from-[#ec38bc] to-[#7303c0]', from: '#ec38bc', to: '#7303c0' },
  ];
  const [deckTheme, setDeckTheme] = useState<string>(gradientPresets[0].value);

  function handleSurpriseMe() {
    const idx = Math.floor(Math.random() * gradientPresets.length);
    setDeckTheme(gradientPresets[idx].value);
  }

  // Dynamic contrast function for label color
  function getContrastYIQ(hex: string): 'text-black' | 'text-white' {
    const r = parseInt(hex.slice(1,3),16)
    const g = parseInt(hex.slice(3,5),16)
    const b = parseInt(hex.slice(5,7),16)
    const yiq = (r*299 + g*587 + b*114) / 1000
    return yiq >= 128 ? 'text-black' : 'text-white'
  }

  // Inject custom CSS for animated gradient if not present
  if (typeof window !== 'undefined' && !document.getElementById('gradient-anim-style')) {
    const style = document.createElement('style');
    style.id = 'gradient-anim-style';
    style.innerHTML = `
      @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      .animate-gradient {
        background-size: 200% 200%;
        animation: gradientShift 6s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }

  // Inject custom CSS for animate-pulse-slow if not present
  if (typeof window !== 'undefined' && !document.getElementById('pulse-slow-style')) {
    const style = document.createElement('style');
    style.id = 'pulse-slow-style';
    style.innerHTML = `
      @keyframes pulseSlow {
        0%, 100% { opacity: 1; }
        50% { opacity: .5; }
      }
      .animate-pulse-slow {
        animation: pulseSlow 2.5s cubic-bezier(0.4,0,0.6,1) infinite;
      }
    `;
    document.head.appendChild(style);
  }

  return (
    <div className="section-card space-y-4">
      {showConfetti && <Confetti />}
      <div className="flex items-center justify-between py-3 px-4 border-b border-border bg-muted/40 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Hand className="h-4 w-4 text-accent/80" />
          <h2 className="text-base font-semibold text-muted-foreground tracking-tight">Your Estimate</h2>
        </div>
        <div className="flex gap-2 items-center">
          <span className="label-base">Card Theme:</span>
          <button
            type="button"
            className="btn btn-utility"
            onClick={() => setShowThemeModal(true)}
          >
            🎨 Customize Theme
          </button>
        </div>
      </div>
      <div className="mb-3" />
      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        show={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        gradientPresets={gradientPresets}
        deckTheme={deckTheme}
        setDeckTheme={setDeckTheme}
        handleSurpriseMe={() => { handleSurpriseMe(); setShowThemeModal(false); }}
      />
      {/* Hand of Cards Layout (desktop), grid fallback (mobile) */}
      <CardFan
        deck={deck}
        selectedCard={selectedCard}
        setSelectedCard={setSelectedCard}
        isVoting={isVoting}
        storyId={storyId}
        handleVote={handleVote}
        handleCardKeyDown={handleCardKeyDown}
        hovered={hovered}
        setHovered={setHovered}
        keyboardHovered={keyboardHovered}
        deckTheme={deckTheme}
        gradientPresets={gradientPresets}
        getContrastYIQ={getContrastYIQ}
      />
      {/* Mobile grid fallback */}
      <CardGrid
        deck={deck}
        selectedCard={selectedCard}
        setSelectedCard={setSelectedCard}
        isVoting={isVoting}
        storyId={storyId}
        handleVote={handleVote}
        handleCardKeyDown={handleCardKeyDown}
      />

      {/* --- Vote Reveal Section --- */}
      {currentStory?.votesRevealed ? (
        <motion.div>
          <VoteStatistics votes={votes} deck={deck} currentUserId={roomData?.currentUserId} />
        </motion.div>
      ) : (
        <div className="mt-4">
          <CardUI>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {votes.length} votes cast
                </Badge>
                {votes.length === players.length && (
                  <Badge variant="outline" className="text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    All votes in
                  </Badge>
                )}
              </div>
            </CardContent>
          </CardUI>
        </div>
      )}
    </div>
  )
}