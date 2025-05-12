"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { updateSettings } from "@/app/actions/room-actions"
import { ExportHistory } from "@/app/components/room/export-history"

interface Story {
  id: string
  title: string
  description: string
  finalEstimate: string | null
  votes: {
    userId: string
    userName: string
    value: string
  }[]
  createdAt: string
}

interface Settings {
  votingSystem: string
  autoReveal: boolean
  timerDuration: number
}

interface RoomTabsProps {
  storyHistory: Story[]
  settings: Settings
  isHost: boolean
}

export default function RoomTabs({ storyHistory, settings, isHost }: RoomTabsProps) {
  const handleVotingSystemChange = async (value: string) => {
    if (!isHost) return

    try {
      await updateSettings({
        ...settings,
        votingSystem: value,
      })
    } catch (error) {
      console.error("Failed to update settings:", error)
    }
  }

  const handleAutoRevealChange = async (checked: boolean) => {
    if (!isHost) return

    try {
      await updateSettings({
        ...settings,
        autoReveal: checked,
      })
    } catch (error) {
      console.error("Failed to update settings:", error)
    }
  }

  return (
    <Tabs defaultValue="history">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="history">Story History</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="history">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Completed Stories</CardTitle>
                <CardDescription>View previously estimated stories</CardDescription>
              </div>
              <ExportHistory storyHistory={storyHistory} />
            </div>
          </CardHeader>
          <CardContent>
            {storyHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No stories have been completed yet</p>
            ) : (
              <div className="space-y-4">
                {storyHistory.map((story) => (
                  <div key={story.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{story.title}</h3>
                      {story.finalEstimate && <span className="btn-utility text-xs px-2 py-0.5 ml-2">{story.finalEstimate}</span>}
                    </div>

                    {story.description && <p className="text-sm text-muted-foreground mb-4">{story.description}</p>}

                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">Votes:</p>
                      <div className="flex flex-wrap gap-2">
                        {story.votes.map((vote) => (
                          <span key={vote.userId} className="btn-utility text-xs px-2 py-0.5">{vote.userName}: {vote.value}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>Room Settings</CardTitle>
            <CardDescription>Configure your planning poker session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="voting-system">Voting System</Label>
              <Select value={settings.votingSystem} onValueChange={handleVotingSystemChange} disabled={!isHost}>
                <SelectTrigger id="voting-system">
                  <SelectValue placeholder="Select voting system" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fibonacci">Fibonacci (1, 2, 3, 5, 8, 13, 21, ?)</SelectItem>
                  <SelectItem value="modified">Modified Fibonacci (0, ½, 1, 2, 3, 5, 8, 13, 20, 40, 100, ?)</SelectItem>
                  <SelectItem value="tshirt">T-Shirt Sizes (XS, S, M, L, XL, XXL, ?)</SelectItem>
                </SelectContent>
              </Select>
              {!isHost && <p className="text-xs text-muted-foreground">Only the host can change settings</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-reveal">Auto-reveal votes</Label>
                <p className="text-sm text-muted-foreground">Automatically reveal votes when everyone has voted</p>
              </div>
              <Switch
                id="auto-reveal"
                checked={settings.autoReveal}
                onCheckedChange={handleAutoRevealChange}
                disabled={!isHost}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
