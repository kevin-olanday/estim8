import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
    <Card>
      <CardHeader>
        <CardTitle>Completed Stories</CardTitle>
      </CardHeader>
      <CardContent>
        {completedStories.length === 0 ? (
          <p className="text-muted-foreground">No stories have been completed yet.</p>
        ) : (
          <div className="space-y-4">
            {completedStories.map((story) => (
              <div key={story.id} className="border rounded-md p-4 bg-muted/50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{story.title}</h3>
                  {story.finalScore !== null && (
                    <Badge className="ml-2">Final Score: {story.finalScore}</Badge>
                  )}
                </div>
                {story.description && (
                  <p className="text-sm text-muted-foreground mb-2">{story.description}</p>
                )}
                <div>
                  <p className="text-sm font-medium mb-1">Votes:</p>
                  <div className="flex flex-wrap gap-2">
                    {(story.votes ?? []).map((vote) => (
                      <Badge key={vote.playerId} variant="outline">
                        {vote.playerName}: {vote.value}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Created: {new Date(story.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}