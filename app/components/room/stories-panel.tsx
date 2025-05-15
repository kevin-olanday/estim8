"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2, Play, Clock, BookOpen, ChevronDown, ChevronRight, SkipForward } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { addStory, setActiveStory, deleteStory, completeStory, resetVotes, completeStoryWithScore } from "@/app/actions/story-actions"
import { usePusherContext } from "@/app/context/pusher-context"
import { useCurrentStory } from "@/app/context/current-story-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog"

interface Story {
  id: string
  title: string
  description: string | null
  active: boolean
  completed: boolean
  votesRevealed: boolean
  finalScore?: number | null
  votes?: { playerId: string; playerName: string; value: number }[]
  manualOverride?: boolean
  originalVotes?: any
}

interface StoriesPanelProps {
  stories: Story[]
  completedStories: Story[]
  isHost: boolean
  revealedVotes: { playerId: string; playerName: string; value: string }[]
}

export default function StoriesPanel({ stories, completedStories, isHost, revealedVotes }: StoriesPanelProps) {
  const [isAddingStory, setIsAddingStory] = useState(false)
  const [storyTitle, setStoryTitle] = useState("")
  const [storyDescription, setStoryDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localStories, setLocalStories] = useState(stories)
  const [localCompletedStories, setLocalCompletedStories] = useState(completedStories)
  const { channel } = usePusherContext()
  const { setCurrentStory } = useCurrentStory()
  const { toast } = useToast()
  const [highlightCurrent, setHighlightCurrent] = useState(false)
  const [completedOpen, setCompletedOpen] = useState(false)
  const [pendingStorySwitch, setPendingStorySwitch] = useState<string | null>(null)
  const [showIncompleteModal, setShowIncompleteModal] = useState(false)
  const [showManualOverrideModal, setShowManualOverrideModal] = useState(false)
  const [medianScore, setMedianScore] = useState<number | null>(null)
  const [overrideScore, setOverrideScore] = useState<number | null>(null)
  const [pendingStoryId, setPendingStoryId] = useState<string | null>(null)

  useEffect(() => {
    setLocalStories(stories)
  }, [stories])

  useEffect(() => {
    setLocalCompletedStories(completedStories)
  }, [completedStories])

  useEffect(() => {
    if (!channel) return

    const handleStoryAdded = (data: any) => {
      // No local mutation; backend will send updated stories via props
      setLocalStories((prev) => [
        ...prev,
        {
          id: data.id,
          title: data.title,
          description: data.description,
          active: false, // New stories are not active by default
          completed: false,
          votesRevealed: false, // New stories don't have revealed votes
          // votes: [], // Assuming votes will be handled by active-story-changed or votes-revealed
        },
      ]);
    }

    const handleStoryCompleted = (data: any) => {
      // No local mutation; backend will send updated stories via props
      setCurrentStory(null)
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
      toast({
        title: "New story selected",
        description: data.title || "A new story is now active.",
      })
      setHighlightCurrent(true)
      setTimeout(() => setHighlightCurrent(false), 700)
    }

    channel.bind("active-story-changed", handleActiveStoryChanged)
    return () => channel.unbind("active-story-changed", handleActiveStoryChanged)
  }, [channel, setCurrentStory, toast])

  useEffect(() => {
    if (!channel) return

    const handleStoryDeleted = (data: any) => {
      setLocalStories((prev) => prev.filter((story) => story.id !== data.id))
    }

    channel.bind("story-deleted", handleStoryDeleted)
    return () => channel.unbind("story-deleted", handleStoryDeleted)
  }, [channel])

  const activeStory = localStories.find((story) => story.active && !story.completed)
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

    if (activeStory && activeStory.votesRevealed && !activeStory.completed && storyId !== activeStory.id) {
      setPendingStorySwitch(storyId)
      setShowIncompleteModal(true)
      return
    }

    try {
      await setActiveStory(storyId)
    } catch (error) {
      console.error("Failed to set active story:", error)
    }
  }

  const handleIncompleteModalAction = async (action: 'complete' | 'discard' | 'cancel') => {
    if (!pendingStorySwitch) {
      setShowIncompleteModal(false)
      return
    }
    if (action === 'complete') {
      if (activeStory) {
        await completeStory(activeStory.id)
      }
      await setActiveStory(pendingStorySwitch)
    } else if (action === 'discard') {
      if (activeStory) {
        await resetVotes(activeStory.id)
      }
      await setActiveStory(pendingStorySwitch)
    }
    setShowIncompleteModal(false)
    setPendingStorySwitch(null)
  }

  const calculateMedian = (arr: number[]): number => {
    const sorted = [...arr].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  }

  const handleCompleteStory = async (storyId: string) => {
    console.log('[StoriesPanel] handleCompleteStory called for storyId:', storyId);
    console.log('[StoriesPanel] revealedVotes:', revealedVotes);
    if (!revealedVotes || revealedVotes.length === 0) {
      console.log('[StoriesPanel] No revealedVotes, aborting.');
      return;
    }
    const voteValues = revealedVotes.map(v => Number(v.value));
    const hasConsensus = voteValues.every(v => v === voteValues[0]);
    console.log('[StoriesPanel] voteValues:', voteValues, 'hasConsensus:', hasConsensus);
    if (hasConsensus) {
      await completeStory(storyId);
    } else {
      const median = calculateMedian(voteValues);
      setMedianScore(median);
      setOverrideScore(median);
      setPendingStoryId(storyId);
      setShowManualOverrideModal(true);
      console.log('[StoriesPanel] Non-consensus: showing manual override modal. Median:', median);
    }
  }

  const confirmManualOverride = async () => {
    if (!pendingStoryId || overrideScore === null) return

    try {
      await completeStoryWithScore(pendingStoryId, overrideScore, {
        manualOverride: true,
        originalVotes: localStories.find(s => s.id === pendingStoryId)?.votes
      })
      setShowManualOverrideModal(false)
      setPendingStoryId(null)
      setMedianScore(null)
      setOverrideScore(null)
    } catch (error) {
      console.error("Failed to complete story with manual override:", error)
    }
  }

  useEffect(() => {
    if (showManualOverrideModal) {
      console.log('[StoriesPanel] Manual override modal is open. Median:', medianScore, 'Override:', overrideScore)
    }
  }, [showManualOverrideModal, medianScore, overrideScore])

  completedStories.forEach(story => {
    console.log('[StoriesPanel] Rendering completed story:', story.title, 'finalScore:', story.finalScore, 'manualOverride:', story.manualOverride)
  })

  return (
    <Card className="section-card">
      {/* Title Bar with Add Story */}
      <div className="panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-accent/80" />
          <h2 className="panel-title">Stories</h2>
          <span className="text-xs text-muted-foreground/70">({pendingStories.length + completedStories.length})</span>
        </div>
        {isHost && (
          <div className="ml-auto">
            <Dialog open={isAddingStory} onOpenChange={setIsAddingStory}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 rounded-lg px-4 py-2 font-semibold border border-accent/60 bg-accent/10 hover:bg-accent/20 text-accent shadow-lg transition-all duration-150 flex items-center"
                >
                  <PlusCircle className="h-5 w-5 align-middle" />
                  <span className="align-middle">Add Story</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    <span className="flex items-center gap-2"><PlusCircle className="w-5 h-5 text-accent" /> Add Story</span>
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddStory} className="space-y-4">
                  <Input
                    placeholder="Story title"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    required
                    autoFocus
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={storyDescription}
                    onChange={(e) => setStoryDescription(e.target.value)}
                    rows={3}
                  />
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Adding..." : "Add Story"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
      <div className="mb-3" />
      <CardContent className="space-y-6">
        <TooltipProvider>
          {/* Queue Section (Pending Stories) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <h3 className="text-base font-semibold text-muted-foreground">Queue <span className="text-xs font-normal">({pendingStories.length + (activeStory ? 1 : 0)})</span></h3>
            </div>
            {/* Show current story at the top with LIVE tag */}
            {activeStory && !activeStory.completed && (
              <div className="section-card animated-border min-h-[48px] flex items-center gap-3 min-w-0 group relative" style={{padding: '0.5rem 1rem'}}>
                <span className="absolute inset-0 rounded-2xl overflow-hidden border border-transparent pointer-events-none" />
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-sm font-semibold truncate max-w-[180px]" title={activeStory.title}>{activeStory.title}</span>
                    {activeStory.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-[260px]" title={activeStory.description}>{activeStory.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="ml-4 px-2 py-0.5 rounded-full bg-accent text-white text-xs font-bold tracking-wider flex-shrink-0">Active</span>
                  </div>
                </div>
              </div>
            )}
            {/* Pending stories */}
            {pendingStories.length === 0 && !activeStory ? (
              <div className="text-muted-foreground text-sm px-2 py-2">No stories in queue</div>
            ) : (
              <div className="space-y-1 max-h-[calc(3*2.5rem)] overflow-y-auto pr-1 scrollbar-thin">
                {pendingStories.map((story) => (
                  <div
                    key={story.id}
                    className="section-card section-card-muted flex items-center gap-3 min-w-0 group"
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
                            <ConfirmDialog
                              title={<span className="flex items-center gap-2 text-red-600"><Trash2 className="w-5 h-5" /> Delete Story</span>}
                              description="Are you sure you want to delete this story? This action cannot be undone."
                              actionText={<span className="flex items-center gap-1"><Trash2 className="w-4 h-4" /> Delete</span>}
                              cancelText="Cancel"
                              onConfirm={async () => { await deleteStory(story.id) }}
                            >
                              <button
                                className="ml-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                                title="Delete story"
                                tabIndex={0}
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </ConfirmDialog>
                          </TooltipTrigger>
                          <TooltipContent>Delete story</TooltipContent>
                        </Tooltip>
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Stories Section (collapsible) */}
          <div>
            <button
              className="flex items-center gap-2 mb-2 text-muted-foreground hover:text-accent transition-colors"
              onClick={() => setCompletedOpen((v) => !v)}
              aria-expanded={completedOpen}
              aria-controls="completed-stories-list"
              type="button"
            >
              {completedOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              <span className="text-base font-semibold">Completed <span className="text-xs font-normal">({completedStories.length})</span></span>
            </button>
            <div id="completed-stories-list" className={completedOpen ? "space-y-1" : "hidden"}>
              {localCompletedStories.length === 0 ? (
                <div className="text-muted-foreground text-sm px-2 py-2">No completed stories</div>
              ) : (
                localCompletedStories.map((story) => (
                  <div key={story.id} className="section-card section-card-muted50 flex flex-col gap-2 min-w-0 opacity-70 p-2 sm:p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                      <span className="text-sm font-semibold truncate max-w-[120px] sm:max-w-[180px]">{story.title}</span>
                      <div className="flex flex-wrap gap-1 sm:gap-2 mt-1 sm:mt-0">
                        <span className="btn-utility text-xs px-1.5 py-0.5 sm:px-2 sm:py-0.5">
                          Final Score: {story.finalScore ?? 'N/A'}
                        </span>
                        {story.manualOverride && (
                          <span className="btn-utility text-xs px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-yellow-500 text-white">Manual</span>
                        )}
                      </div>
                    </div>
                    {story.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-[140px] sm:max-w-[220px]">{story.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </TooltipProvider>
      </CardContent>

      {/* Incomplete Estimation Modal */}
      <Dialog open={showIncompleteModal} onOpenChange={setShowIncompleteModal}>
        <DialogContent className="max-w-md rounded-2xl border-2 border-accent shadow-xl">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2 text-accent"><Clock className="w-5 h-5" /> Incomplete Estimation</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-base text-muted-foreground">
            The current story has votes that have been revealed, but the story hasn't been completed.<br /><br />
            <b>What would you like to do?</b>
          </div>
          <div className="space-y-3 mt-2">
            <button
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold text-base bg-accent text-white shadow transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent"
              onClick={() => handleIncompleteModalAction('complete')}
              type="button"
            >
              <SkipForward className="h-5 w-5" /> Complete and Move On
            </button>
            <button
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold text-base bg-destructive text-white shadow transition hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive"
              onClick={() => handleIncompleteModalAction('discard')}
              type="button"
            >
              <Trash2 className="h-5 w-5" /> Discard Votes
            </button>
            <button
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold text-base bg-muted text-foreground shadow transition hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-muted"
              onClick={() => handleIncompleteModalAction('cancel')}
              type="button"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Override Modal */}
      <Dialog open={showManualOverrideModal} onOpenChange={setShowManualOverrideModal}>
        <DialogContent className="max-w-md rounded-2xl border-2 border-accent shadow-xl">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2 text-accent"><Clock className="w-5 h-5" /> Complete Story Without Consensus</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-base text-muted-foreground">
            The median score is: <b>{medianScore}</b><br />
            You can override this score if needed.
          </div>
          <div className="space-y-3 mt-2">
            <Input
              type="number"
              value={overrideScore || ''}
              onChange={(e) => setOverrideScore(parseFloat(e.target.value))}
              placeholder="Override Score"
            />
            <button
              className="w-full btn btn-primary flex items-center justify-center gap-2 py-2 rounded-lg"
              onClick={confirmManualOverride}
              type="button"
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
    </Card>
  )
}
