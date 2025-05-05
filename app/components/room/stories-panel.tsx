"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, PlayCircle, PlusCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { addStory, setActiveStory } from "@/app/actions/story-actions"
import { cn } from "@/lib/utils"
import { usePusherContext } from "@/app/context/pusher-context"
import { useCurrentStory } from "@/app/context/current-story-context"

interface Story {
  id: string
  title: string
  description: string | null
  active: boolean
  completed: boolean
  votesRevealed: boolean
}

interface StoriesPanelProps {
  stories: Story[]
  isHost: boolean
}

export default function StoriesPanel({ stories, isHost }: StoriesPanelProps) {
  const [isAddingStory, setIsAddingStory] = useState(false)
  const [storyTitle, setStoryTitle] = useState("")
  const [storyDescription, setStoryDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localStories, setLocalStories] = useState(stories)
  const { channel } = usePusherContext()
  const { setCurrentStory } = useCurrentStory()

  useEffect(() => {
    setLocalStories(stories)
  }, [stories])

  useEffect(() => {
    if (!channel) return

    const handleStoryAdded = (data: any) => {
      setLocalStories((prev) => [
        ...prev,
        {
          id: data.id,
          title: data.title,
          description: data.description,
          active: false,
          completed: false,
          votesRevealed: false,
        },
      ])
    }

    const handleStoryCompleted = (data: any) => {
      setLocalStories((prev) =>
        prev.map((story) =>
          story.id === data.id
            ? { ...story, completed: true, active: false }
            : story
        )
      )
      setCurrentStory((prev) =>
        prev && prev.id === data.id
          ? { ...prev, status: "completed" }
          : prev
      )
    }

    channel.bind("story-added", handleStoryAdded)
    channel.bind("story-completed", handleStoryCompleted)

    return () => {
      channel.unbind("story-added", handleStoryAdded)
      channel.unbind("story-completed", handleStoryCompleted)
    }
  }, [channel, setCurrentStory])

  useEffect(() => {
    if (!channel) return

    const handleActiveStoryChanged = (data: any) => {
      setLocalStories((prev) =>
        prev.map((story) =>
          story.id === data.id
            ? { ...story, active: true, votesRevealed: false }
            : { ...story, active: false }
        )
      )
      setCurrentStory({
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        votesRevealed: false,
      })
    }

    channel.bind("active-story-changed", handleActiveStoryChanged)
    return () => channel.unbind("active-story-changed", handleActiveStoryChanged)
  }, [channel, setCurrentStory])

  const activeStory = localStories.find((story) => story.active && !story.completed)
  const completedStories = localStories.filter((story) => story.completed)
  const pendingStories = localStories.filter((story) => !story.active && !story.completed)

  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storyTitle.trim()) return

    setIsSubmitting(true)
    try {
      await addStory(storyTitle, storyDescription || null)
      setStoryTitle("")
      setStoryDescription("")
      setIsAddingStory(false)
    } catch (error) {
      console.error("Failed to add story:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSetActiveStory = async (storyId: string) => {
    if (!isHost) return

    try {
      await setActiveStory(storyId)
    } catch (error) {
      console.error("Failed to set active story:", error)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Stories</CardTitle>
        {isHost && (
          <Dialog open={isAddingStory} onOpenChange={setIsAddingStory}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Story
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Story</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddStory} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Input
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    placeholder="Story title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Textarea
                    value={storyDescription}
                    onChange={(e) => setStoryDescription(e.target.value)}
                    placeholder="Story description (optional)"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Story"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Active Story */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center">
              <PlayCircle className="h-4 w-4 mr-1 text-green-500" />
              Current Story
            </h3>
            {activeStory ? (
              <div className="border rounded-md p-3 bg-accent/30">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{activeStory.title}</h4>
                  <Badge variant={activeStory.votesRevealed ? "default" : "outline"}>
                    {activeStory.votesRevealed ? "Votes Revealed" : "Voting"}
                  </Badge>
                </div>
                {activeStory.description && (
                  <p className="text-sm text-muted-foreground mt-1">{activeStory.description}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No active story</p>
            )}
          </div>

          {/* Pending Stories */}
          {pendingStories.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center">
                <Circle className="h-4 w-4 mr-1 text-blue-500" />
                Upcoming Stories ({pendingStories.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {pendingStories.map((story) => (
                  <div
                    key={story.id}
                    className={cn(
                      "border rounded-md p-2 hover:bg-accent/20 transition-colors",
                      isHost && "cursor-pointer",
                    )}
                    onClick={isHost ? () => handleSetActiveStory(story.id) : undefined}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{story.title}</h4>
                      {isHost && (
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          Start
                        </Button>
                      )}
                    </div>
                    {story.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{story.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Stories */}
          {completedStories.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                Completed Stories ({completedStories.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {completedStories.map((story) => (
                  <div key={story.id} className="border rounded-md p-2 opacity-70">
                    <h4 className="font-medium text-sm">{story.title}</h4>
                    {story.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{story.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {localStories.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No stories yet</p>
              {isHost && <p className="text-sm mt-1">Click "Add Story" to create your first story</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
