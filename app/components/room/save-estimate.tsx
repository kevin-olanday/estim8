"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface SaveEstimateProps {
  roomId: string;
  storyId: string;
  onSaved?: () => void;
}

export function SaveEstimate({ roomId, storyId, onSaved }: SaveEstimateProps) {
  const [estimate, setEstimate] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveEstimate = async () => {
    if (!estimate) return;
    setIsSaving(true);
    try {
      await fetch("/api/story/estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId, storyId, estimate }),
      });
      if (onSaved) onSaved();
    } catch (error) {
      // Error handling without console.error
      toast({
        title: "Failed to save estimate",
        description: "An error occurred while saving the estimate",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="number"
        value={estimate}
        onChange={(e) => setEstimate(e.target.value)}
        placeholder="Enter estimate"
        disabled={isSaving}
      />
      <Button onClick={handleSaveEstimate} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Estimate"}
      </Button>
    </div>
  );
}
