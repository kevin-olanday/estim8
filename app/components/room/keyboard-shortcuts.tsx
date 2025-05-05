"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { KeyboardShortcut } from "@/app/components/ui/keyboard-shortcut"
import { Keyboard } from "lucide-react"

interface KeyboardShortcutsProps {
  isHost: boolean
}

export function KeyboardShortcuts({ isHost }: KeyboardShortcutsProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts dialog when pressing "?" with Shift
      if (e.key === "?" && e.shiftKey) {
        setOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Keyboard Shortcuts">
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">General</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Show shortcuts</span>
                <KeyboardShortcut keys={["Shift", "?"]} />
              </div>
              <div className="flex justify-between items-center">
                <span>Copy room code</span>
                <KeyboardShortcut keys={["Ctrl", "C"]} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Voting</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Vote 1-8</span>
                <KeyboardShortcut keys={["1-8"]} />
              </div>
              <div className="flex justify-between items-center">
                <span>Vote ?</span>
                <KeyboardShortcut keys={["0"]} />
              </div>
            </div>
          </div>

          {isHost && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Host Controls</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between items-center">
                  <span>Reveal votes</span>
                  <KeyboardShortcut keys={["R"]} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Reset votes</span>
                  <KeyboardShortcut keys={["Shift", "R"]} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Next story</span>
                  <KeyboardShortcut keys={["N"]} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Start/Pause timer</span>
                  <KeyboardShortcut keys={["T"]} />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
