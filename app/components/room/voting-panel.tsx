"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { submitVote, removeVote } from "@/app/actions/vote-actions"
import { usePusherContext } from "@/app/context/pusher-context"
import { VoteStatistics } from "@/app/components/room/vote-statistics"
import { Confetti } from "@/app/components/ui/confetti"
import { useCurrentStory } from "@/app/context/current-story-context"
import { CheckCircle, BarChart2, Hand } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Deck } from "@/types/card"
import ThemeSelectorModal from "./theme-selector-modal"
import CardFan from "./card-fan"
import CardGrid from "./card-grid"
import DefaultThemeBackground from "@/app/components/room/DefaultThemeBackground"
import ConsensusBanner from "@/app/components/room/ConsensusBanner"
import { completeStory, completeStoryWithScore } from "@/app/actions/story-actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useSwipeable } from 'react-swipeable'
import axios from "axios"

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
    avatarStyle?: string | null
    avatarSeed?: string | null
  }[]
  players: {
    id: string
    name: string
    avatarStyle?: string | null
    avatarSeed?: string | null
  }[]
  roomData: {
    currentVotes: Vote[]
    players: {
      id: string
      name: string
      avatarStyle?: string | null
      avatarSeed?: string | null
    }[]
    currentUserId?: string
    id: string
  }
  storyId?: string
  celebrationsEnabled: boolean
  deckTheme: string
  setDeckTheme: (theme: string) => void
}

interface GradientPreset {
  name: string;
  value: string;
  from: string;
  to: string;
  category: "bright" | "dark";
}

export default function VotingPanel({
  deck = [],
  currentVote,
  isHost = false,
  votes = [],
  players = [],
  roomData,
  celebrationsEnabled,
  deckTheme,
  setDeckTheme,
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
  const [allInCelebration, setAllInCelebration] = useState(false);
  const prevAllIn = useRef(false);
  const [showConsensusConfetti, setShowConsensusConfetti] = useState(false);
  const [dealAnimKey, setDealAnimKey] = useState(0);
  const [showManualOverrideModal, setShowManualOverrideModal] = useState(false)
  const [medianScore, setMedianScore] = useState<string | null>(null)
  const [overrideScore, setOverrideScore] = useState<string>("")
  const [pendingStoryId, setPendingStoryId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false);

  // Ref to track the previous state of votesRevealed
  const prevVotesRevealed = useRef(currentStory?.votesRevealed ?? false);

  useEffect(() => { setHydrated(true); }, []);

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
      setDealAnimKey((k) => k + 1);
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

      const startTime = performance.now();

      // If the card is already selected, remove the vote
      if (selectedCard === value) {
        // Optimistically update UI
        const uiStartTime = performance.now();
        setSelectedCard(null)
        setIsVoting(true)
        const uiEndTime = performance.now();
        console.log(`[Performance] UI update for vote removal took ${uiEndTime - uiStartTime}ms`);

        try {
          const removeStartTime = performance.now();
          await removeVote(storyId)
          const removeEndTime = performance.now();
          console.log(`[Performance] Remove vote operation took ${removeEndTime - removeStartTime}ms`);
        } catch (error) {
          // Revert optimistic update on error
          setSelectedCard(value)
        } finally {
          setIsVoting(false)
        }
        return
      }

      // Optimistically update UI
      const uiStartTime = performance.now();
      setSelectedCard(value)
      setIsVoting(true)
      const uiEndTime = performance.now();
      console.log(`[Performance] UI update for vote submission took ${uiEndTime - uiStartTime}ms`);

      try {
        const submitStartTime = performance.now();
        await submitVote(storyId, value)
        const submitEndTime = performance.now();
        console.log(`[Performance] Submit vote operation took ${submitEndTime - submitStartTime}ms`);
      } catch (error) {
        // Revert optimistic update on error
        setSelectedCard(null)
      } finally {
        setIsVoting(false)
      }

      const endTime = performance.now();
      console.log(`[Performance] Total handleVote operation took ${endTime - startTime}ms`);
    },
    [isVoting, storyId, selectedCard],
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

  // Gradient theme presets
  const gradientPresets: GradientPreset[] = [
    { name: 'Minimalist Mode', value: 'bg-gradient-to-br from-gray-500 to-gray-700', from: '#6b7280', to: '#374151', category: 'dark' },
    { name: 'Estim8 Core', value: 'bg-gradient-to-br from-blue-500 to-purple-600', from: '#3b82f6', to: '#9333ea', category: 'bright' },
    { name: 'Pink Sunset', value: 'bg-gradient-to-br from-pink-400 to-rose-600', from: '#f472b6', to: '#e11d48', category: 'bright' },
    { name: 'Citrus Pop', value: 'bg-gradient-to-br from-yellow-400 to-orange-500', from: '#facc15', to: '#f97316', category: 'bright' },
    { name: 'Emerald Sky', value: 'bg-gradient-to-br from-green-400 to-teal-500', from: '#4ade80', to: '#14b8a6', category: 'bright' },
    { name: 'Cyberpunk', value: 'bg-gradient-to-br from-fuchsia-600 to-cyan-400', from: '#c026d3', to: '#22d3ee', category: 'bright' },
    { name: 'Ocean Fade', value: 'bg-gradient-to-br from-indigo-400 to-sky-500', from: '#818cf8', to: '#0ea5e9', category: 'bright' },
    { name: 'Aurora Green', value: 'bg-gradient-to-br from-[#00ff99] to-[#0066ff]', from: '#00ff99', to: '#0066ff', category: 'bright' },
    { name: 'Inferno', value: 'bg-gradient-to-br from-[#ff6b6b] to-[#ffa94d]', from: '#ff6b6b', to: '#ffa94d', category: 'bright' },
    { name: 'Neon Noir', value: 'bg-gradient-to-br from-[#1f005c] to-[#5b247a]', from: '#1f005c', to: '#5b247a', category: 'dark' },
    { name: 'Cotton Candy', value: 'bg-gradient-to-br from-[#f6d365] to-[#fda085]', from: '#f6d365', to: '#fda085', category: 'bright' },
    { name: 'Bubblegum Bolt', value: 'bg-gradient-to-br from-[#ec38bc] to-[#7303c0]', from: '#ec38bc', to: '#7303c0', category: 'dark' },
    { name: 'Midnight Ink', value: 'bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e]', from: '#0f0f1a', to: '#1a1a2e', category: 'dark' },
    { name: 'Charcoal Burn', value: 'bg-gradient-to-br from-[#2c2c2e] to-[#444]', from: '#2c2c2e', to: '#444', category: 'dark' },
    { name: 'Galaxy Fade', value: 'bg-gradient-to-br from-[#2d1b69] to-[#000]', from: '#2d1b69', to: '#000', category: 'dark' },
  ];

  // Aurora background theme sync
  useEffect(() => {
    const preset = gradientPresets.find(g => g.value === deckTheme);
    document.body.style.setProperty('--gradient1', preset?.from || '#1f2e56');
    document.body.style.setProperty('--gradient2', preset?.to || '#6d44b8');
    // Use a third color if available, else fallback to a magenta
    const third = (preset && (preset as any).third) || '#ff49d9';
    document.body.style.setProperty('--gradient3', third);
  }, [deckTheme, gradientPresets]);

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

  useEffect(() => {
    const allIn = votes.length === players.length && players.length > 1;
    if (allIn && !prevAllIn.current) {
      setAllInCelebration(true);
      setTimeout(() => setAllInCelebration(false), 1200);
    }
    prevAllIn.current = allIn;
  }, [votes.length, players.length]);

  // Inject shimmer and pulse CSS if not present
  if (typeof window !== 'undefined' && !document.getElementById('all-in-anim-style')) {
    const style = document.createElement('style');
    style.id = 'all-in-anim-style';
    style.innerHTML = `
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .shimmer {
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
        background-size: 200% 100%;
        animation: shimmer 0.5s linear 1;
      }
      @keyframes pulse-ring {
        0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
        70% { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
        100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
      }
      .pulse-ring {
        position: relative;
      }
      .pulse-ring::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        width: 2.5em;
        height: 2.5em;
        transform: translate(-50%, -50%);
        border-radius: 9999px;
        box-shadow: 0 0 0 0 rgba(99,102,241,0.4);
        animation: pulse-ring 0.7s cubic-bezier(0.4,0,0.6,1) 1;
        pointer-events: none;
        z-index: 0;
      }
      @keyframes sparkle {
        0% { opacity: 0; transform: scale(0.7) rotate(0deg); }
        50% { opacity: 1; transform: scale(1.2) rotate(20deg); }
        100% { opacity: 0; transform: scale(0.7) rotate(0deg); }
      }
      .sparkle {
        position: absolute;
        top: 0.2em;
        right: 0.2em;
        width: 1.2em;
        height: 1.2em;
        pointer-events: none;
        z-index: 10;
        opacity: 0;
        animation: sparkle 0.7s ease-in 1;
      }
    `;
    document.head.appendChild(style);
  }

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === "Enter") {
      handleVote(deck[idx].label)
    }
  }

  // Detect consensus when votes are revealed and handle banner display
  useEffect(() => {
    const currentVotesRevealed = currentStory?.votesRevealed ?? false;

    const voteCounts = votes.reduce((acc, vote) => {
      acc[vote.value] = (acc[vote.value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const hasConsensus = Object.keys(voteCounts).length === 1 && votes.length > 1;

    // Show banner only if votes just transitioned to revealed, and consensus exists, and celebrations are on
    const justRevealed = currentVotesRevealed && !prevVotesRevealed.current;

    if (justRevealed && hasConsensus && celebrationsEnabled) {
      setShowConsensusConfetti(true);
    } else if (!currentVotesRevealed || !hasConsensus || !celebrationsEnabled) {
      // Ensure banner is hidden if conditions are not met (e.g., votes not revealed, no consensus, or celebrations off)
      setShowConsensusConfetti(false);
    }

    // Update the ref to the current state for the next render cycle
    prevVotesRevealed.current = currentVotesRevealed;

  }, [votes, currentStory, celebrationsEnabled, setShowConsensusConfetti]);

  const handleCompleteStory = async () => {
    if (!currentStory?.id || !isHost) return
    if (!votes || votes.length === 0) return
    const voteValues = votes.map(v => Number(v.value)).filter(v => !isNaN(v))
    const hasConsensus = voteValues.length > 0 && voteValues.every(v => v === voteValues[0])
    if (hasConsensus) {
      await completeStory(currentStory.id)
    } else {
      const median = calculateMedian(voteValues)
      const medianStr = voteValues.length > 0 ? String(median) : "";
      setMedianScore(medianStr);
      setOverrideScore(medianStr);
      setPendingStoryId(currentStory.id);
      setShowManualOverrideModal(true);
    }
  }

  // Determine if deck interaction should be disabled
  const deckInteractionDisabled = !!currentStory?.votesRevealed && currentStory?.status !== "completed";

  const confirmManualOverride = async () => {
    if (!pendingStoryId) return;
    const trimmedScore = overrideScore.trim();
    if (trimmedScore === "" || isNaN(Number(trimmedScore))) return;
    try {
      const score = Number(trimmedScore);
      await completeStoryWithScore(pendingStoryId, score, {
        manualOverride: true,
        originalVotes: votes
      });
      setShowManualOverrideModal(false);
      setPendingStoryId(null);
      setMedianScore(null);
      setOverrideScore("");
    } catch (error) {
      // Error handling without console.error
    }
  };

  // Add calculateMedian helper
  const calculateMedian = (arr: number[]): string => {
    if (!arr.length) return "N/A";
    const sorted = [...arr].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    if (sorted.length % 2 !== 0) return String(sorted[mid]);
    const avg = (sorted[mid - 1] + sorted[mid]) / 2;
    // If avg is an integer, show as int, else as float with 1 decimal
    return Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
  }

  // --- Swipeable Handlers for Card Navigation ---
  const cardLabels = deck.map(card => card.label)
  const currentIdx = selectedCard ? cardLabels.indexOf(selectedCard) : -1
  const canSwipe = !isVoting && !deckInteractionDisabled && deck.length > 1
  const handleSwipeLeft = () => {
    if (!canSwipe) return
    if (currentIdx < deck.length - 1) {
      const next = cardLabels[currentIdx + 1] ?? cardLabels[0]
      handleVote(next)
    }
  }
  const handleSwipeRight = () => {
    if (!canSwipe) return
    if (currentIdx > 0) {
      const prev = cardLabels[currentIdx - 1] ?? cardLabels[deck.length - 1]
      handleVote(prev)
    }
  }
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleSwipeLeft,
    onSwipedRight: handleSwipeRight,
    trackMouse: false,
    preventScrollOnSwipe: true,
    delta: 30,
  })

  const handleRemoveVote = async () => {
    try {
      await removeVote(storyId)
    } catch (error) {
      // Error handling without console.error
      // Revert optimistic update on error
      setSelectedCard(null)
    }
  }

  const handleSubmitVote = async (value: string) => {
    try {
      await submitVote(storyId, value)
    } catch (error) {
      // Error handling without console.error
      // Revert optimistic update on error
      setSelectedCard(null)
    }
  }

  const handleManualOverride = async (overrideScore: number) => {
    try {
      await axios.post("/api/story/complete", {
        roomId: roomData.id,
        storyId: currentStory?.id,
        finalScore: overrideScore,
        manualOverride: true
      });
    } catch (error) {
      // Error handling without console.error
    }
  };

  return (
    <>
      {/* Show fog/ambient background for all dark themes */}
      <DefaultThemeBackground active={gradientPresets.find(g => g.value === deckTheme)?.category === 'dark'} />
      <div className="section-card space-y-2 w-full mx-auto sm:mx-0">
        {/* Consensus Achieved Animation */}
        {showConsensusConfetti && celebrationsEnabled && (
          <ConsensusBanner show={true} players={players} />
        )}
        <div className="panel-header justify-between">
          <div className="flex items-center gap-2">
            <Hand className="h-4 w-4 text-accent/80" />
            <h2 className="panel-title text-base">Your Estimate</h2>
          </div>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              className="btn btn-utility"
              onClick={() => setShowThemeModal(true)}
            >
              🎨 Customize Theme
            </button>
          </div>
        </div>
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
        <div {...swipeHandlers} className="mb-2 touch-pan-x select-none">
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
            dealAnimKey={dealAnimKey}
            disabled={deckInteractionDisabled}
          />
        </div>
        {/* Mobile grid fallback */}
        <div {...swipeHandlers} className="mb-2 touch-pan-x select-none">
          <CardGrid
            deck={deck}
            selectedCard={selectedCard}
            setSelectedCard={setSelectedCard}
            isVoting={isVoting}
            storyId={storyId}
            handleVote={handleVote}
            handleCardKeyDown={handleCardKeyDown}
            disabled={deckInteractionDisabled}
            deckTheme={deckTheme}
            gradientPresets={gradientPresets}
            getContrastYIQ={getContrastYIQ}
          />
        </div>

        {/* --- Vote Reveal Section --- */}
        {hydrated && currentStory?.votesRevealed && (
          <VoteStatistics
            votes={votes}
            deck={deck}
            currentUserId={roomData?.currentUserId}
            players={players}
            isHost={isHost}
            onComplete={handleCompleteStory}
            votesRevealed={currentStory?.votesRevealed}
            deckTheme={deckTheme}
            completeDisabled={!currentStory?.id || !currentStory?.votesRevealed}
          />
        )}
        {!currentStory?.votesRevealed && players.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center mt-8"
          >
            <div
              className={
                votes.length === players.length
                  ? `relative flex items-center gap-2 px-6 py-2 rounded-full border border-accent/40 bg-accent/10 shadow-inner text-accent font-semibold text-base overflow-hidden ${allInCelebration ? 'shimmer' : ''}`
                  : "flex items-center gap-2 px-5 py-2 rounded-lg border border-border bg-muted/60 shadow-sm text-muted-foreground font-semibold text-base"
              }
              style={{ boxShadow: votes.length === players.length && allInCelebration ? '0 2px 16px 0 rgba(99,102,241,0.10) inset' : undefined }}
            >
              {votes.length === players.length ? (
                <span className={allInCelebration ? 'pulse-ring relative' : ''} style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
                  <CheckCircle className="w-6 h-6 mr-1 z-10" />
                  {allInCelebration && (
                    <span className="sparkle">
                      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                        <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.42 1.42M6.34 17.66l-1.42 1.42M17.66 17.66l-1.42-1.42M6.34 6.34L4.92 4.92" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                  )}
                </span>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-2 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                </>
              )}
              {votes.length === players.length
                ? "All votes in"
                : <span className="text-base font-semibold">{`${votes.length} of ${players.length} votes cast`}</span>}
            </div>
          </motion.div>
        )}
      </div>
      {/* Manual Override Modal */}
      <Dialog open={showManualOverrideModal} onOpenChange={setShowManualOverrideModal}>
        <DialogContent className="max-w-md rounded-2xl border-2 border-accent shadow-xl">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2 text-accent"><BarChart2 className="w-5 h-5" /> Complete Story Without Consensus</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-base text-muted-foreground">
            The median score is: <b>{medianScore}</b><br />
            You can override this score if needed.
          </div>
          <div className="space-y-3 mt-2">
            <Input
              type="number"
              value={overrideScore}
              onChange={e => setOverrideScore(e.target.value)}
              placeholder="Override Score"
            />
            <button
              className="w-full btn btn-primary flex items-center justify-center gap-2 py-2 rounded-lg"
              onClick={confirmManualOverride}
              type="button"
              disabled={overrideScore.trim() === "" || isNaN(Number(overrideScore))}
            >
              Confirm
            </button>
            <button
              className="w-full btn btn-secondary flex items-center justify-center gap-2 py-2 rounded-lg"
              onClick={() => setShowManualOverrideModal(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}