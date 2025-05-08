"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, PlayCircle, PlusCircle, Trash2, GripVertical, Play, Clock, BookOpen, Archive } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { addStory, setActiveStory, deleteStory } from "@/app/actions/story-actions"
import { cn } from "@/lib/utils"
import { usePusherContext } from "@/app/context/pusher-context"
import { useCurrentStory } from "@/app/context/current-story-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

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
      setCurrentStory((prev: { id: string; status: string } | null) =>
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

  useEffect(() => {
    if (!channel) return

    const handleStoryDeleted = (data: any) => {
      setLocalStories((prev) => prev.filter((story) => story.id !== data.id))
    }

    channel.bind("story-deleted", handleStoryDeleted)
    return () => channel.unbind("story-deleted", handleStoryDeleted)
  }, [channel])

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
    <Card className="section-card">
      {/* Title Bar */}
      <div className="flex items-center justify-between gap-4 py-3 px-4 border-b border-border bg-muted/40 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-accent/80" />
          <h2 className="text-lg font-bold text-muted-foreground tracking-tight">Stories</h2>
        </div>
      </div>
      <div className="mb-3" />
      <CardContent className="space-y-6">
        <TooltipProvider>
          {/* Current Story Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PlayCircle className="h-5 w-5 text-green-500" />
              <h3 className="text-base font-semibold text-muted-foreground">Current Story</h3>
            </div>
            <div className="section-card p-4 border border-accent/60 bg-muted/60 shadow-sm transition-all min-w-0">
              {activeStory ? (
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold truncate max-w-[220px]">{activeStory.title}</span>
                    <Badge variant="outline" className="text-xs text-accent border-accent">Now Estimating</Badge>
                  </div>
                  {activeStory.description && (
                    <p className="text-xs text-muted-foreground truncate max-w-[320px]">{activeStory.description}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground opacity-80">
                  <Clock className="w-5 h-5 opacity-60" />
                  <span>No active story — select one to begin estimation</span>
                </div>
              )}
            </div>
          </div>

          {/* Separator */}
          {(pendingStories.length > 0 || completedStories.length > 0) && (
            <div className="my-3 border-b border-border opacity-30" />
          )}

          {/* Upcoming Stories Section */}
          {pendingStories.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-semibold text-muted-foreground">Upcoming Stories <span className="text-xs font-normal">({pendingStories.length})</span></h3>
              </div>
              <div className="space-y-1">
                {pendingStories.map((story) => (
                  <div
                    key={story.id}
                    className="section-card px-2 py-1 rounded-xl border border-border bg-muted/60 hover:bg-muted/80 transition-colors flex items-center gap-3 min-w-0 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-semibold truncate max-w-[180px]" title={story.title}>{story.title}</span>
                      </div>
                      {story.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[260px]" title={story.description}>{story.description}</p>
                      )}
                    </div>
                    {isHost && (
                      <div className="flex gap-1 items-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleSetActiveStory(story.id)}
                              title="Start estimation"
                              tabIndex={0}
                            >
                              <Play className="h-4 w-4 text-accent hover:text-accent-hover transition-colors" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Start estimation</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="ml-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                              title="Delete story"
                              onClick={async (e) => {
                                e.stopPropagation()
                                if (confirm("Are you sure you want to delete this story?")) {
                                  await deleteStory(story.id)
                                }
                              }}
                              tabIndex={0}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Delete story</TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Separator */}
          {completedStories.length > 0 && (
            <div className="my-3 border-b border-border opacity-30" />
          )}

          {/* Completed Stories Section */}
          {completedStories.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Archive className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-base font-semibold text-muted-foreground">Completed Stories <span className="text-xs font-normal">({completedStories.length})</span></h3>
              </div>
              <div className="space-y-1">
                {completedStories.map((story) => (
                  <div key={story.id} className="section-card px-2 py-1 rounded-xl border border-border bg-muted/50 flex items-center gap-3 min-w-0 opacity-70">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold truncate max-w-[180px]">{story.title}</span>
                      {story.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[220px]">{story.description}</p>
                      )}
                    </div>
                    {isHost && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="ml-2 text-red-500 hover:text-red-700 text-sm"
                            title="Delete story"
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (confirm("Are you sure you want to delete this story?")) {
                                await deleteStory(story.id)
                              }
                            }}
                            tabIndex={0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Delete story</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {localStories.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No stories yet</p>
              {isHost && <p className="text-sm mt-1">Click "Add Story" to create your first story</p>}
            </div>
          )}
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
