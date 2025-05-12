"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Save, FileText } from "lucide-react"
import { updateStory, completeStory } from "@/app/actions/story-actions"
import { usePusherContext } from "@/app/context/pusher-context"
import { useCurrentStory } from "@/app/context/current-story-context"
import { cn } from "@/lib/utils"

interface CurrentStoryProps {
  story: any 
  isHost: boolean
}

export default function CurrentStory({ story, isHost }: CurrentStoryProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(story?.title || "")
  const [description, setDescription] = useState(story?.description || "")
  const [isSaving, setIsSaving] = useState(false)
  const { currentStory, setCurrentStory } = useCurrentStory()
  const { channel } = usePusherContext()
  const [highlight, setHighlight] = useState(false)

  useEffect(() => {
    if (!channel) return

    const handleStoryUpdated = (data: any) => {
      if (data.id === story?.id) {
        setTitle(data.title)
        setDescription(data.description || "")
      }
    }
    
    const handleStoryCompleted = (data: any) => {
      console.log('[CurrentStory] Story completed event received:', data);
      if (story && story.id === data.id) {
        setCurrentStory(null);
      }
    }

    channel.bind("story-updated", handleStoryUpdated)
    channel.bind("story-completed", handleStoryCompleted)

    return () => {
      channel.unbind("story-updated", handleStoryUpdated)
      channel.unbind("story-completed", handleStoryCompleted)
    }
  }, [channel, story, setCurrentStory])

  // Update local state when story changes
  useEffect(() => {
    console.log('[CurrentStory] Story prop changed:', story);
    if (story) {
      setTitle(story.title)
      setDescription(story.description || "")
    }
  }, [story])

  // Add styles for animated gradient border
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      @keyframes border-flow {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }
      
      .animated-border {
        position: relative;
      }
      
      .animated-border > span {
        background: linear-gradient(-45deg, var(--color-accent), var(--color-secondary), #6d44b8, #ff49d9);
        background-size: 300% 300%;
        animation: border-flow 8s ease infinite;
        mask: 
          linear-gradient(#fff 0 0) content-box, 
          linear-gradient(#fff 0 0);
        mask-composite: exclude;
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        padding: 2px;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  useEffect(() => {
    if (story?.id) {
      setHighlight(true)
      const timeout = setTimeout(() => setHighlight(false), 700)
      return () => clearTimeout(timeout)
    }
  }, [story?.id])

  if (!story) {
    return (
      <Card className="section-card min-h-[140px] flex flex-col">
        <div className="panel-header justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent/80" />
            <h2 className="panel-title">Current Story</h2>
          </div>
        </div>
        <CardContent className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-muted-foreground w-full">
            Select a story to start estimation
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleSave = async () => {
    if (!story || !isHost) return

    setIsSaving(true)
    try {
      await updateStory(story.id, title, description || null)
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update story:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleComplete = async () => {
    if (!story || !isHost) return
    try {
      await completeStory(story.id)
    } catch (error) {
      console.error("Failed to complete story:", error)
    }
  }

  return (
    <Card className={cn(
      "section-card min-h-[140px] relative flex flex-col",
      story && "animated-border",
      highlight && "animate-[pulse_0.7s] ring-2 ring-indigo-400/60"
    )}>
      {/* Gradient border overlay for animation */}
      <span className="absolute inset-0 rounded-2xl overflow-hidden border border-transparent pointer-events-none" />
      <div className="panel-header justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent/80" />
          <h2 className="panel-title">Current Story</h2>
        </div>
        <div className="flex gap-2 items-center">
          {isHost && !isEditing && (
            <button className="btn-utility flex items-center gap-1 text-sm font-semibold px-3 py-1 hover:text-accent transition-colors" onClick={() => setIsEditing(true)} type="button">
              <Edit className="h-4 w-4" />
              Edit
            </button>
          )}
          {isHost && isEditing && (
            <button className="btn btn-primary text-sm font-semibold" onClick={handleSave} disabled={isSaving} type="button">
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
          )}
        </div>
      </div>
      <div className="mb-3" />
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Story title"
                className="font-medium text-lg"
              />
            </div>
            <div>
              <Textarea
                value={description || ""}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Story description"
                rows={4}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-bold text-xl text-foreground leading-tight tracking-tight">{story.title}</h3>
            <p className="text-base text-muted-foreground whitespace-pre-line">
              {story.description || "No description provided."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
