"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Deck } from "@/types/card"

interface VoteStatisticsProps {
  votes: {
    playerId: string
    playerName: string
    value: string
  }[]
  deck: Deck
}

export function VoteStatistics({ votes, deck }: VoteStatisticsProps) {
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
    .map((vote) => vote.value)
    .filter((value) => !isNaN(Number(value)))
    .map(Number)

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

  // Find card colors for the votes
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
        <CardTitle className="text-lg">Vote Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Average</p>
            <p className="text-xl font-medium">{average}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Most Common</p>
            <p className="text-xl font-medium">
              {getCardEmoji(mostCommonVote) && <span className="mr-1">{getCardEmoji(mostCommonVote)}</span>}
              {mostCommonVote}
            </p>
          </div>
          <div className="col-span-2 space-y-2">
            <p className="text-sm text-muted-foreground">Vote Distribution</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(voteCounts).map(([value, count]) => (
                <Badge
                  key={value}
                  variant="outline"
                  className="flex items-center gap-1"
                  style={{
                    backgroundColor: getCardColor(value),
                    color: getCardColor(value) && getCardColor(value) !== "#f5f5f5" ? "#fff" : undefined,
                  }}
                >
                  {getCardEmoji(value) && <span className="mr-1">{getCardEmoji(value)}</span>}
                  <span>{value}:</span>
                  <span className="font-bold">{count}</span>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
