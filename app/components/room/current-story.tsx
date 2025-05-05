"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Save } from "lucide-react"
import { updateStory } from "@/app/actions/story-actions"
import { usePusherContext } from "@/app/context/pusher-context"
import { useCurrentStory } from "@/app/context/current-story-context"

interface CurrentStoryProps {
  story: any 
  isHost: boolean
}

export default function CurrentStory({ story, isHost }: CurrentStoryProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(story?.title || "")
  const [description, setDescription] = useState(story?.description || "")
  const [isSaving, setIsSaving] = useState(false)

  const { channel } = usePusherContext()

  useEffect(() => {
    if (!channel) return

    const handleStoryUpdated = (data: any) => {
      if (data.id === story?.id) {
        setTitle(data.title)
        setDescription(data.description || "")
      }
    }

    channel.bind("story-updated", handleStoryUpdated)

    return () => {
      channel.unbind("story-updated", handleStoryUpdated)
    }
  }, [channel, story])

  // Update local state when story changes
  useEffect(() => {
    if (story) {
      setTitle(story.title)
      setDescription(story.description || "")
    }
  }, [story])

  if (!story) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            {isHost ? "Add a story to start estimation" : "Waiting for the host to add a story"}
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Current Story</CardTitle>
        {isHost && !isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
        {isHost && isEditing && (
          <Button variant="ghost" size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        )}
      </CardHeader>
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
            <h3 className="font-medium text-lg">{story.title}</h3>
            <p className="text-muted-foreground whitespace-pre-line">
              {story.description || "No description provided."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
