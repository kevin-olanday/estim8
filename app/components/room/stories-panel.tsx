"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2, Play, Clock, BookOpen, ChevronDown, ChevronRight, SkipForward, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { addStory, setActiveStory, deleteStory, completeStory, resetVotes, completeStoryWithScore, updateStory } from "@/app/actions/story-actions"
import { usePusherContext } from "@/app/context/pusher-context"
import { useCurrentStory } from "@/app/context/current-story-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog"
import axios from "axios"

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
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)

  useEffect(() => {
    setLocalStories(stories)
  }, [stories])

  useEffect(() => {
    const handler = () => setIsAddingStory(true);
    window.addEventListener("open-add-story-dialog", handler);
    return () => window.removeEventListener("open-add-story-dialog", handler);
  }, []);

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
    e.preventDefault();
    if (!storyTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await addStory(storyTitle, storyDescription || null);
      setStoryTitle("");
      setStoryDescription("");
      setIsAddingStory(false);
    } catch (error) {
      // Error handling without console.error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetActiveStory = async (storyId: string) => {
    if (!isHost) return;

    if (activeStory && activeStory.votesRevealed && !activeStory.completed && storyId !== activeStory.id) {
      setPendingStorySwitch(storyId);
      setShowIncompleteModal(true);
      return;
    }

    try {
      await setActiveStory(storyId);
    } catch (error) {
      // Error handling without console.error
    }
  };

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
    if (!revealedVotes || revealedVotes.length === 0) {
      return;
    }

    const voteValues = revealedVotes.map(v => parseFloat(v.value));
    const hasConsensus = voteValues.every(v => v === voteValues[0]);
    const median = calculateMedian(voteValues);

    if (!hasConsensus) {
      setOverrideScore(median);
      setShowManualOverrideModal(true);
      return;
    }

    try {
      await completeStory(storyId);
    } catch (error) {
      // Error handling without console.error
    }
  };

  const handleManualOverride = async (overrideScore: number) => {
    if (!pendingStoryId || overrideScore === null) return;
    try {
      await completeStoryWithScore(pendingStoryId, overrideScore, {
        manualOverride: true,
        originalVotes: localStories.find(s => s.id === pendingStoryId)?.votes
      });
      setShowManualOverrideModal(false);
      setPendingStoryId(null);
      setMedianScore(null);
      setOverrideScore(null);
    } catch (error) {
      // Error handling without console.error
    }
  };

  const startEditStory = (story: Story) => {
    setEditingStoryId(story.id)
    setEditTitle(story.title)
    setEditDescription(story.description || "")
    setEditModalOpen(true)
  }

  const cancelEditStory = () => {
    setEditingStoryId(null)
    setEditTitle("")
    setEditDescription("")
    setEditModalOpen(false)
  }

  const saveEditStory = async (storyId: string) => {
    setEditLoading(true)
    try {
      await updateStory(storyId, editTitle, editDescription)
      setEditingStoryId(null)
      setEditModalOpen(false)
    } catch (e) {
      // Optionally show error
    } finally {
      setEditLoading(false)
    }
  }

  const renderCompletedStory = (story: any) => {
    // ... existing render code ...
  }

  return (
    <Card className="section-card">
      {/* Title Bar with Add Story */}
      <div className="panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-accent/80" />
          <h2 className="panel-title text-xs sm:text-sm md:text-lg">Stories</h2>
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
              <h3 className="text-xs sm:text-base font-semibold text-muted-foreground">Queue <span className="text-[10px] sm:text-xs font-normal">({pendingStories.length + (activeStory ? 1 : 0)})</span></h3>
            </div>
            {/* Show current story at the top with LIVE tag */}
            {activeStory && !activeStory.completed && (
              <div className="section-card animated-border min-h-[48px] flex items-center gap-3 min-w-0 group relative" style={{padding: '0.5rem 1rem'}}>
                <span className="absolute inset-0 rounded-2xl overflow-hidden border border-transparent pointer-events-none" />
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="min-w-0">
                    {editingStoryId === activeStory.id ? (
                      <>
                        <Input
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="text-xs sm:text-sm font-semibold max-w-[180px] inline-block mr-2"
                          autoFocus
                        />
                        <Button size="sm" className="ml-1 px-2 py-1" onClick={() => saveEditStory(activeStory.id)} disabled={editLoading}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" className="ml-1 px-2 py-1" onClick={cancelEditStory}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs sm:text-sm font-semibold truncate max-w-[180px]" title={activeStory.title}>{activeStory.title}</span>
                        {isHost && (
                          <button
                            className="ml-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent"
                            style={{ background: 'transparent', lineHeight: 0 }}
                            onClick={() => startEditStory(activeStory)}
                            title="Edit story"
                            type="button"
                          >
                            <Pencil className="w-4 h-4 text-accent" />
                          </button>
                        )}
                      </>
                    )}
                    {activeStory.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-[260px]" title={activeStory.description}>{activeStory.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="ml-4 px-2 py-0.5 rounded-full bg-accent text-white text-[10px] sm:text-xs font-bold tracking-wider flex-shrink-0">Active</span>
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
                    className="section-card section-card-muted flex items-center gap-3 min-w-0 group relative"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        {editingStoryId === story.id ? (
                          <>
                            <Input
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              className="text-xs sm:text-sm font-semibold max-w-[180px] inline-block mr-2"
                              autoFocus
                            />
                            <Button size="sm" className="ml-1 px-2 py-1" onClick={() => saveEditStory(story.id)} disabled={editLoading}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" className="ml-1 px-2 py-1" onClick={cancelEditStory}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="text-xs sm:text-sm font-semibold truncate max-w-[180px]" title={story.title}>{story.title}</span>
                            {isHost && (
                              <button
                                className="ml-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent"
                                style={{ background: 'transparent', lineHeight: 0 }}
                                onClick={() => startEditStory(story)}
                                title="Edit story"
                                type="button"
                              >
                                <Pencil className="w-4 h-4 text-accent" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      {editingStoryId === story.id ? (
                        <Textarea
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          className="text-xs mt-1"
                          rows={2}
                        />
                      ) : (
                        story.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[260px]" title={story.description}>{story.description}</p>
                        )
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
              <span className="text-xs sm:text-base font-semibold">Completed <span className="text-[10px] sm:text-xs font-normal">({completedStories.length})</span></span>
            </button>
            <div id="completed-stories-list" className={completedOpen ? "space-y-1" : "hidden"}>
              {localCompletedStories.length === 0 ? (
                <div className="text-muted-foreground text-sm px-2 py-2">No completed stories</div>
              ) : (
                localCompletedStories.map((story) => (
                  <div key={story.id} className="section-card section-card-muted50 flex flex-col gap-2 min-w-0 opacity-70 p-2 sm:p-3 group relative">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                      <div className="flex items-center min-w-0">
                        <span className="text-sm font-semibold truncate max-w-[120px] sm:max-w-[180px]">{story.title}</span>
                        {isHost && (
                          <button
                            className="ml-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent"
                            style={{ background: 'transparent', lineHeight: 0 }}
                            onClick={() => startEditStory(story)}
                            title="Edit story"
                            type="button"
                          >
                            <Pencil className="w-4 h-4 text-accent" />
                          </button>
                        )}
                      </div>
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
              onClick={() => overrideScore !== null && handleManualOverride(overrideScore)}
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

      {/* Edit Story Modal */}
      <Dialog open={editModalOpen} onOpenChange={open => { if (!open) cancelEditStory(); else setEditModalOpen(true); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2"><Pencil className="w-5 h-5 text-accent" /> Edit Story</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); if (editingStoryId) saveEditStory(editingStoryId); }} className="space-y-4">
            <Input
              placeholder="Story title"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              required
              autoFocus
            />
            <Textarea
              placeholder="Description (optional)"
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={cancelEditStory}>
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading}>
                {editLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

