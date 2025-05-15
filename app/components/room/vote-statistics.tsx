"use client"

import { BarChart2, SkipForward } from "lucide-react"
import type { Deck } from "@/types/card"
import { motion } from "framer-motion"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import React from "react"
import { PlayerAvatar } from "./player-avatar"

interface VoteStatisticsProps {
  votes: {
    playerId: string
    playerName: string
    value: string
    avatarStyle?: string | null
    avatarSeed?: string | null
  }[]
  deck: Deck
  currentUserId?: string
  players?: {
    id: string
    name: string
    avatarStyle?: string | null
    avatarSeed?: string | null
  }[]
  isHost?: boolean
  onComplete?: () => void
  votesRevealed?: boolean
  deckTheme?: string
  completeDisabled?: boolean
}

export function VoteStatistics({ votes, deck, currentUserId, players, isHost, onComplete, votesRevealed, deckTheme, completeDisabled = false }: VoteStatisticsProps) {
  if (votes.length === 0) {
    return null
  }

  // Count votes by value
  const voteCounts = votes.reduce(
    (acc, vote) => {
      acc[vote.value] = (acc[vote.value] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Calculate average (excluding non-numeric values)
  const numericVotes = votes
    .map((vote) => Number(vote.value))
    .filter((v) => !isNaN(v))

  const average =
    numericVotes.length > 0
      ? (numericVotes.reduce((sum, value) => sum + value, 0) / numericVotes.length).toFixed(1)
      : "N/A"

  // Find the most common vote
  let mostCommonVote = ""
  let highestCount = 0

  Object.entries(voteCounts).forEach(([value, count]) => {
    if (count > highestCount) {
      mostCommonVote = value
      highestCount = count
    }
  })

  // Median
  let median = "N/A"
  if (numericVotes.length > 0) {
    const sorted = [...numericVotes].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    median =
      sorted.length % 2 !== 0
        ? sorted[mid].toString()
        : ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1)
  }

  // Spread
  let spread = "N/A"
  if (numericVotes.length > 0) {
    const min = Math.min(...numericVotes)
    const max = Math.max(...numericVotes)
    spread = (max - min).toString()
  }

  // Unanimous?
  const allSame = Object.keys(voteCounts).length === 1 && votes.length > 1

  const myVote = currentUserId
    ? votes.find((v) => v.playerId === currentUserId)?.value
    : undefined

  // Calculate percentages
  const totalVotes = votes.length
  const votePercentages = Object.fromEntries(
    Object.entries(voteCounts).map(([value, count]) => [value, Math.round((count / totalVotes) * 100)])
  )

  // Sort by count descending
  const sortedVoteEntries = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])

  // Get voter names and avatars for each value
  const getVoterInfo = (value: string) =>
    votes.filter((v) => v.value === value).map((v) => ({
      name: v.playerName || v.playerId,
      avatarStyle: v.avatarStyle,
      avatarSeed: v.avatarSeed
    }))

  // Get voter names for each value
  const getVoterNames = (value: string) =>
    votes.filter((v) => v.value === value).map((v) => v.playerName || v.playerId).join(", ")

  // Find non-voters
  const nonVoters = players
    ? players.filter(p => !votes.some(v => v.playerId === p.id))
    : [];

  // Keyboard shortcut for host: Enter or Cmd+Enter
  React.useEffect(() => {
    if (!isHost || !votesRevealed || !onComplete) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' && (e.metaKey || e.ctrlKey)) || (e.key === 'Enter' && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        onComplete();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isHost, votesRevealed, onComplete]);

  return (
    <TooltipProvider>
      <div className="rounded-lg bg-muted/20 pt-2 pb-4 px-4 shadow-sm space-y-4 border">
        {/* 1. Header with Complete Story button and icon */}
        <div className="panel-header justify-between mb-2 gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <BarChart2 className="h-5 w-5 text-accent/80" />
            <h2 className="panel-title flex-1 truncate">Estimation Results</h2>
          </div>
          {isHost && votesRevealed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="min-w-fit flex justify-end"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="flex items-center justify-center gap-3 px-5 py-2 rounded-lg font-bold text-base transition-all focus:outline-none focus:ring-2 focus:ring-accent/40 shadow-xl animate-pulse-complete-story relative overflow-hidden group"
                      style={{
                        background: 'linear-gradient(90deg, #6366f1 0%, #9333ea 100%)',
                        color: '#fff',
                        boxShadow: '0 2px 16px 0 rgba(99,102,241,0.20) inset, 0 0 16px 2px rgba(99,102,241,0.15)',
                        border: '2px solid #a5b4fc',
                      }}
                      onMouseOver={e => e.currentTarget.style.boxShadow = '0 0 16px 4px #a5b4fc, 0 2px 16px 0 rgba(99,102,241,0.20) inset'}
                      onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 16px 0 rgba(99,102,241,0.20) inset, 0 0 16px 2px rgba(99,102,241,0.15)'}
                      onFocus={e => e.currentTarget.style.boxShadow = '0 0 16px 4px #a5b4fc, 0 2px 16px 0 rgba(99,102,241,0.20) inset'}
                      onBlur={e => e.currentTarget.style.boxShadow = '0 2px 16px 0 rgba(99,102,241,0.20) inset, 0 0 16px 2px rgba(99,102,241,0.15)'}
                      onClick={onComplete}
                      type="button"
                      disabled={completeDisabled || votes.length === 0}
                      title="Complete Story"
                    >
                      <SkipForward className="h-6 w-6 sm:mr-2 -ml-1 align-middle animate-bounce-arrow" />
                      <span className="hidden sm:inline align-middle">Complete Story</span>
                    </button>
                  </TooltipTrigger>
                  {votes.length === 0 && (
                    <TooltipContent side="top" align="center">
                      Waiting for team to vote
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          )}
        </div>

        {/* 2. Key Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center mb-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Your Vote</div>
            {myVote ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="btn-utility text-sm px-3 py-1"
              >
                {myVote}
              </motion.div>
            ) : (
              <span className="text-muted-foreground italic text-sm">N/A</span>
            )}
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Most Common</div>
            <span className="inline-flex items-center gap-1 font-bold text-accent">
              {mostCommonVote}
              {allSame && (
                <span
                  className="ml-2 px-2 py-0.5 rounded-full text-white text-xs font-semibold shadow animate-bounce"
                  style={{
                    background: 'linear-gradient(90deg, #6366f1 0%, #9333ea 100%)',
                    letterSpacing: '0.01em',
                  }}
                >
                  Consensus
                </span>
              )}
            </span>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Median</div>
            <span className="font-bold">{median}</span>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Spread</div>
            <span className="font-bold">{spread}</span>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Average</div>
            <span className="font-bold">{average}</span>
          </div>
        </div>

        {/* 3. Vote Distribution Bar Graph */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Vote Distribution</p>
          <div className="flex flex-col gap-2">
            {sortedVoteEntries.map(([value, count]) => {
              const percent = votePercentages[value]
              return (
                <div key={value} className="flex items-center gap-2">
                  <span className="font-medium text-sm min-w-[36px] flex items-center gap-1">
                    {value}
                  </span>
                  <div className="flex-1 bg-muted/40 rounded h-5 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ type: "spring", stiffness: 200, damping: 24 }}
                      className="h-5 bg-accent rounded transition-all flex items-center pl-2 text-white text-xs font-semibold"
                      style={{ width: `${percent}%`, minWidth: 24 }}
                    >
                      {percent > 10 && (
                        <span>{count} vote{count > 1 ? "s" : ""}</span>
                      )}
                    </motion.div>
                  </div>
                  <span className="font-medium text-sm min-w-[40px] text-right tabular-nums">{percent}%</span>
                  {/* Tooltip with voter names and avatars */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="ml-1 cursor-help flex items-center gap-1">
                        {getVoterInfo(value).map((voter, idx) => (
                          <PlayerAvatar
                            key={idx}
                            name={voter.name}
                            avatarStyle={voter.avatarStyle || undefined}
                            avatarSeed={voter.avatarSeed || undefined}
                            size="sm"
                          />
                        ))}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">
                      {getVoterNames(value) || "No voters"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )
            })}
          </div>
        </div>

        {/* Non-voter indicator */}
        {nonVoters.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">No vote:</span>
            {nonVoters.map((player, idx) => (
              <Tooltip key={player.id}>
                <TooltipTrigger asChild>
                  <div className="w-5 h-5 rounded-full overflow-hidden opacity-50 bg-muted flex items-center justify-center border border-border">
                    {player.avatarStyle && player.avatarSeed ? (
                      <PlayerAvatar
                        name={player.name}
                        avatarStyle={player.avatarStyle || undefined}
                        avatarSeed={player.avatarSeed || undefined}
                        size="sm"
                      />
                    ) : (
                      <span className="text-[10px]">⏳</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  {player.name} has not voted
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

<style jsx global>{`
@keyframes pulse-complete-story {
  0%, 100% { box-shadow: 0 0 16px 2px #a5b4fc, 0 2px 16px 0 rgba(99,102,241,0.20) inset; }
  50% { box-shadow: 0 0 32px 8px #a5b4fc, 0 2px 24px 0 rgba(99,102,241,0.30) inset; }
}
.animate-pulse-complete-story {
  animation: pulse-complete-story 1.5s infinite;
}
@keyframes bounce-arrow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.animate-bounce-arrow {
  animation: bounce-arrow 1.1s infinite;
}
`}</style>
