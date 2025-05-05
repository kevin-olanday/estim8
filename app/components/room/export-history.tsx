"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Story {
  id: string
  title: string
  description: string
  finalEstimate: string | null
  votes: {
    userId: string
    userName: string
    value: string
  }[]
  createdAt: string
}

interface ExportHistoryProps {
  storyHistory: Story[]
}

export function ExportHistory({ storyHistory }: ExportHistoryProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const exportToCsv = () => {
    if (storyHistory.length === 0) {
      toast({
        title: "No stories to export",
        description: "Complete some stories first",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)

    try {
      // Create CSV header
      const headers = ["Title", "Description", "Final Estimate", "Votes", "Created At"]

      // Create CSV rows
      const rows = storyHistory.map((story) => {
        const votes = story.votes.map((vote) => `${vote.userName}: ${vote.value}`).join("; ")
        const date = new Date(story.createdAt).toLocaleString()

        return [
          `"${story.title.replace(/"/g, '""')}"`,
          `"${story.description?.replace(/"/g, '""') || ""}"`,
          story.finalEstimate || "",
          `"${votes}"`,
          date,
        ]
      })

      // Combine header and rows
      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")

      // Create a blob and download link
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `estim8-history-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export successful",
        description: "Story history has been exported to CSV",
      })
    } catch (error) {
      console.error("Export failed:", error)
      toast({
        title: "Export failed",
        description: "An error occurred while exporting",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={exportToCsv} disabled={isExporting || storyHistory.length === 0}>
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? "Exporting..." : "Export to CSV"}
    </Button>
  )
}
