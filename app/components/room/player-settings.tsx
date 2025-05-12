"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AvatarBuilder } from "./avatar-builder"
import { updatePlayer } from "@/app/actions/player-actions"
import { useToast } from "@/hooks/use-toast"

interface PlayerSettingsProps {
  playerId: string
  initialName: string
  initialAvatarStyle?: string
  initialAvatarOptions?: Record<string, string>
}

export function PlayerSettings({ playerId, initialName, initialAvatarStyle, initialAvatarOptions }: PlayerSettingsProps) {
  const [name, setName] = useState(initialName)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleAvatarChange = async (style: string, options: Record<string, string>) => {
    try {
      await updatePlayer(playerId, {
        avatarStyle: style,
        avatarOptions: JSON.stringify(options),
      })
    } catch (error) {
      console.error("Failed to update avatar:", error)
      toast({
        title: "Error",
        description: "Failed to update avatar. Please try again.",
      })
    }
  }

  const handleSave = async () => {
    if (!name.trim()) return

    setIsSaving(true)
    try {
      await updatePlayer(playerId, { name: name.trim() })
      toast({
        title: "Success",
        description: "Your settings have been updated.",
      })
    } catch (error) {
      console.error("Failed to update settings:", error)
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Player Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        <div className="space-y-2">
          <Label>Avatar</Label>
          <AvatarBuilder
            onAvatarChange={handleAvatarChange}
            initialOptions={initialAvatarOptions}
          />
        </div>

        <Button
          className="w-full"
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  )
} 