import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

interface Vote {
  playerId: string
  playerName: string
  value: string
}

interface Story {
  id: string
  title: string
  description: string | null
  finalScore: number | null
  votes: Vote[]
  createdAt: string
}

interface HistoryPanelProps {
  completedStories: Story[]
}

export function HistoryPanel({ completedStories }: HistoryPanelProps) {
  return (
    <Card className="section-card">
      <div className="flex items-center gap-2 py-3 px-4 border-b border-border bg-muted/40 rounded-t-2xl">
        <CheckCircle className="h-4 w-4 text-accent/80" />
        <h2 className="text-base font-semibold text-muted-foreground tracking-tight">Completed Stories</h2>
      </div>
      <div className="mb-3" />
      <CardContent>
        {completedStories.length === 0 ? (
          <p className="text-muted-foreground">No stories have been completed yet.</p>
        ) : (
          <div className="space-y-4">
            {completedStories.map((story) => (
              <div key={story.id} className="card-base opacity-80 p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{story.title}</h3>
                  <span className="btn-utility text-xs px-2 py-0.5 ml-2">Final Score: {story.finalScore ?? '—'}</span>
                </div>
                {story.description && (
                  <p className="text-sm text-muted-foreground mb-2">{story.description}</p>
                )}
                <div>
                  <p className="text-sm font-medium mb-1">Votes:</p>
                  <div className="flex flex-wrap gap-2">
                    {(story.votes ?? []).length > 0 ? (
                      story.votes.map((vote) => (
                        <span key={vote.playerId} className="btn-utility text-xs px-2 py-0.5">{vote.playerName}: {vote.value}</span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No votes recorded</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 