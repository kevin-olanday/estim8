"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Eye, EyeOff, SkipForward, RotateCcw } from "lucide-react"
import { addStory, completeStory } from "@/app/actions/story-actions"
import { revealVotes, resetVotes } from "@/app/actions/story-actions"
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog"
import { updateRoomSettings } from "@/app/actions/room-actions"

interface HostControlsProps {
  currentStoryId: string | null
  votesRevealed: boolean
  hasVotes: boolean
  autoRevealVotes: boolean
  allPlayersVoted: boolean
  storyStatus?: "idle" | "active" | "completed"
}

export default function HostControls({
  currentStoryId,
  votesRevealed,
  hasVotes,
  autoRevealVotes,
  allPlayersVoted,
  storyStatus = "idle",
}: HostControlsProps) {
  const [isAddingStory, setIsAddingStory] = useState(false)
  const [storyTitle, setStoryTitle] = useState("")
  const [storyDescription, setStoryDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autoReveal, setAutoReveal] = useState(autoRevealVotes)

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

  const handleRevealVotes = async () => {
    if (!currentStoryId) return

    try {
      await revealVotes(currentStoryId)
    } catch (error) {
      console.error("Failed to reveal votes:", error)
    }
  }

  const handleResetVotes = async () => {
    if (!currentStoryId) return

    try {
      await resetVotes(currentStoryId)
    } catch (error) {
      console.error("Failed to reset votes:", error)
    }
  }

  const handleCompleteStory = async () => {
    if (!currentStoryId) return

    try {
      await completeStory(currentStoryId)
    } catch (error) {
      console.error("Failed to complete story:", error)
    }
  }

  const handleToggleAutoReveal = async () => {
    setAutoReveal((prev) => !prev)
    await updateRoomSettings({ autoRevealVotes: !autoReveal })
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      if (e.key === "r" && !e.shiftKey && currentStoryId && hasVotes) {
        if (votesRevealed) {
          handleResetVotes()
        } else {
          handleRevealVotes()
        }
      }
      if (e.key === "R" && e.shiftKey && currentStoryId && hasVotes) {
        handleResetVotes()
      }
      if (e.key === "n" && currentStoryId) {
        handleCompleteStory()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentStoryId, hasVotes, votesRevealed])

  const canRevealVotes =
    storyStatus === "active" && allPlayersVoted && !votesRevealed

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Host Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Dialog open={isAddingStory} onOpenChange={setIsAddingStory}>
            <DialogTrigger asChild>
              <Button className="w-full">
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

          <Button
            className="w-full"
            variant={votesRevealed ? "outline" : "default"}
            onClick={votesRevealed ? handleResetVotes : handleRevealVotes}
            disabled={!canRevealVotes && !votesRevealed}
          >
            {votesRevealed ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Votes
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Reveal Votes
              </>
            )}
          </Button>

          <Button
            className="w-full"
            variant="outline"
            onClick={handleResetVotes}
            disabled={!currentStoryId || !hasVotes}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Votes
          </Button>

          <ConfirmDialog
            title="Complete Story"
            description="This will mark the current story as completed. You can start a new story afterwards."
            actionText="Complete"
            onConfirm={handleCompleteStory}
          >
            <Button className="w-full" variant="outline" disabled={!currentStoryId}>
              <SkipForward className="h-4 w-4 mr-2" />
              Complete Story
            </Button>
          </ConfirmDialog>

          <div className="flex items-center space-x-2">
            <label htmlFor="autoRevealVotes">Auto Reveal Votes</label>
            <input
              id="autoRevealVotes"
              type="checkbox"
              checked={autoReveal}
              onChange={handleToggleAutoReveal}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
