"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Clock, Settings } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { usePusherContext } from "@/app/context/pusher-context"

interface RoomTimerProps {
  isHost: boolean
  initialTime?: number
  roomId: string
}

export default function RoomTimer({ isHost, initialTime = 300, roomId }: RoomTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)
  const [duration, setDuration] = useState(initialTime)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { channel } = usePusherContext()
  const [showDurationModal, setShowDurationModal] = useState(false)
  const [pendingMinutes, setPendingMinutes] = useState(Math.floor(initialTime / 60))
  const [pendingSeconds, setPendingSeconds] = useState(initialTime % 60)

  useEffect(() => {
    if (!channel) return
    const handleTimerUpdate = (data: any) => {
      setIsRunning(data.isRunning)
      setTimeLeft(data.timeLeft)
      setDuration(data.duration)
    }
    channel.bind("timer-update", handleTimerUpdate)
    return () => {
      channel.unbind("timer-update", handleTimerUpdate)
    }
  }, [channel])

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            setIsRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning])

  const handleTimerAction = useCallback(
    async (action: "start" | "pause" | "reset") => {
      if (!isHost) return
      // TODO: Replace with your backend API call for timer state
      // await updateTimerState(action, ...)
      switch (action) {
        case "start":
          setIsRunning(true)
          break
        case "pause":
          setIsRunning(false)
          break
        case "reset":
          setIsRunning(false)
          setTimeLeft(duration)
          break
      }
    },
    [duration, isHost, timeLeft],
  )

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleDurationChange = async (e: React.FormEvent) => {
    e.preventDefault()
    const newDuration = pendingMinutes * 60 + pendingSeconds
    setDuration(newDuration)
    setTimeLeft(newDuration)
    setShowDurationModal(false)
    // TODO: Broadcast duration change via backend
  }

  return (
    <Card className="rounded-full bg-muted px-4 py-1 flex items-center gap-2 shadow font-mono text-base font-semibold transition-all duration-300 w-fit mx-auto">
      <span className="mr-1"><Clock className="w-5 h-5 text-accent" /></span>
      <span>{formatTime(timeLeft)}</span>
      {isHost && (
        <span className="flex items-center gap-1 ml-2">
          {isRunning ? (
            <Button size="icon" variant="ghost" onClick={() => handleTimerAction("pause")}
              title="Pause" type="button">
              <Pause className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" onClick={() => handleTimerAction("start")}
              title="Start" type="button">
              <Play className="w-4 h-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={() => handleTimerAction("reset")}
            title="Reset timer" type="button">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setShowDurationModal(true)}
            title="Set duration" type="button">
            <Settings className="w-4 h-4" />
          </Button>
        </span>
      )}
      <Dialog open={showDurationModal} onOpenChange={setShowDurationModal}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                Set Timer Duration
              </span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDurationChange} className="space-y-4">
            <div className="flex items-end justify-center gap-0 mb-2 bg-muted/60 border border-border rounded-xl px-2 py-3">
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min={0}
                  className="w-12 px-1 py-2 bg-transparent border-none outline-none text-center font-mono text-lg focus:ring-2 focus:ring-accent rounded-md"
                  value={pendingMinutes}
                  onChange={e => setPendingMinutes(Math.max(0, Number(e.target.value)))}
                  autoFocus
                />
                <span className="text-xs text-muted-foreground mt-0.5">m</span>
              </div>
              <span className="mx-1 text-lg font-bold text-muted-foreground select-none">:</span>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min={0}
                  max={59}
                  className="w-12 px-1 py-2 bg-transparent border-none outline-none text-center font-mono text-lg focus:ring-2 focus:ring-accent rounded-md"
                  value={pendingSeconds}
                  onChange={e => setPendingSeconds(Math.max(0, Math.min(59, Number(e.target.value))))}
                />
                <span className="text-xs text-muted-foreground mt-0.5">s</span>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDurationModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 