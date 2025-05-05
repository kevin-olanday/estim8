"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { saveEstimate } from "@/app/actions/story-actions"
import { useToast } from "@/hooks/use-toast"

interface SaveEstimateProps {
  storyId: string
  votes: {
    userId: string
    userName: string
    value: string
  }[]
  currentEstimate: string | null
  onSaved?: () => void
}

export function SaveEstimate({ storyId, votes, currentEstimate, onSaved }: SaveEstimateProps) {
  const [estimate, setEstimate] = useState<string>(currentEstimate || "")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Get unique vote values
  const uniqueVotes = Array.from(new Set(votes.map((vote) => vote.value)))

  const handleSave = async () => {
    if (!estimate) return

    setIsSaving(true)
    try {
      await saveEstimate(storyId, estimate)
      toast({
        title: "Estimate saved",
        description: "The final estimate has been saved",
      })
      if (onSaved) onSaved()
    } catch (error) {
      console.error("Failed to save estimate:", error)
      toast({
        title: "Failed to save estimate",
        description: "An error occurred while saving the estimate",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={estimate} onValueChange={setEstimate}>
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {uniqueVotes.map((value) => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={handleSave} disabled={isSaving || !estimate}>
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </div>
  )
}
