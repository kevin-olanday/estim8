"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart2, Repeat } from "lucide-react"
import type { Deck } from "@/types/card"
import { motion } from "framer-motion"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

interface VoteStatisticsProps {
  votes: {
    playerId: string
    playerName: string
    value: string
  }[]
  deck: Deck
  currentUserId?: string
}

export function VoteStatistics({ votes, deck, currentUserId }: VoteStatisticsProps) {
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

  // Get voter names for each value
  const getVoterNames = (value: string) =>
    votes.filter((v) => v.value === value).map((v) => v.playerName || v.playerId).join(", ")

  return (
    <TooltipProvider>
      <div className="rounded-lg bg-muted/20 p-5 shadow-sm space-y-4 border">
        {/* 1. Header */}
        <div className="text-lg font-semibold mb-2 text-center">Estimation Results</div>

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
              {allSame && <span className="ml-1 animate-bounce">🎉</span>}
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
                  {/* Tooltip with voter names */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-1 cursor-help text-muted-foreground text-xs">👤</span>
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
      </div>
    </TooltipProvider>
  )
}
