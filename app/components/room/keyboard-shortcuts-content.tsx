"use client"

import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { KeyboardShortcut } from "@/app/components/ui/keyboard-shortcut"

export function KeyboardShortcutsContent({ isHost }: { isHost: boolean }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Keyboard Shortcuts</DialogTitle>
      </DialogHeader>
      <div className="space-y-8 py-4">
        {/* General */}
        <div>
          <h3 className="text-base font-semibold mb-3 text-muted-foreground">General</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            <div className="flex items-center justify-between gap-2">
              <span>Show shortcuts</span>
              <KeyboardShortcut keys={["Shift", "?"]} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Copy room code</span>
              <KeyboardShortcut keys={["Alt", "C"]} />
            </div>
            {isHost && (
              <div className="flex items-center justify-between gap-2 col-span-2 sm:col-span-1">
                <span>Add story</span>
                <KeyboardShortcut keys={["Alt", "A"]} />
              </div>
            )}
          </div>
        </div>
        {/* Voting */}
        <div>
          <h3 className="text-base font-semibold mb-3 text-muted-foreground">Voting</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            <div className="flex items-center justify-between gap-2">
              <span>Vote 1-8</span>
              <KeyboardShortcut keys={["1-8"]} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Vote ?</span>
              <KeyboardShortcut keys={["0"]} />
            </div>
          </div>
        </div>
        {/* Host Controls */}
        {isHost && (
          <div>
            <h3 className="text-base font-semibold mb-3 text-muted-foreground">Host Controls</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
              <div className="flex items-center justify-between gap-2">
                <span>Reveal votes</span>
                <KeyboardShortcut keys={["R"]} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Reset votes</span>
                <KeyboardShortcut keys={["Shift", "R"]} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Next story</span>
                <KeyboardShortcut keys={["N"]} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Start/Pause timer</span>
                <KeyboardShortcut keys={["T"]} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
} 