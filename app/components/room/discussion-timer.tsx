"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, RotateCcw } from "lucide-react"
import { updateTimerState } from "@/app/actions/room-actions"
import { usePusherContext } from "@/app/context/pusher-context"
import { CountdownAlert } from "@/app/components/ui/countdown-alert"

interface DiscussionTimerProps {
  initialTime: number
  isHost: boolean
}

export default function DiscussionTimer({ initialTime = 300, isHost }: DiscussionTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)
  const [duration, setDuration] = useState(initialTime)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { channel } = usePusherContext()

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

      try {
        switch (action) {
          case "start":
            setIsRunning(true)
            await updateTimerState(true, timeLeft, duration)
            break
          case "pause":
            setIsRunning(false)
            await updateTimerState(false, timeLeft, duration)
            break
          case "reset":
            setIsRunning(false)
            setTimeLeft(duration)
            await updateTimerState(false, duration, duration)
            break
        }
      } catch (error) {
        console.error("Failed to update timer:", error)
      }
    },
    [duration, isHost, timeLeft],
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input field and user is host
      if (!isHost || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Start/pause timer with T key
      if (e.key === "t") {
        if (isRunning) {
          handleTimerAction("pause")
        } else if (timeLeft > 0) {
          handleTimerAction("start")
        }
      }

      // Reset timer with Shift+T
      if (e.key === "T" && e.shiftKey) {
        handleTimerAction("reset")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isHost, isRunning, timeLeft, handleTimerAction])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleDurationChange = async (value: number[]) => {
    if (!isHost) return

    const newDuration = value[0]
    setDuration(newDuration)

    if (!isRunning) {
      setTimeLeft(newDuration)
      await updateTimerState(false, newDuration, newDuration)
    }
  }

  const progress = (timeLeft / duration) * 100

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Discussion Timer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isRunning && timeLeft <= 30 && timeLeft > 0 && <CountdownAlert timeLeft={timeLeft} threshold={30} />}

          <div className="text-center">
            <span className="text-3xl font-mono">{formatTime(timeLeft)}</span>
          </div>

          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex justify-center space-x-2">
            {isRunning ? (
              <Button variant="outline" size="icon" onClick={() => handleTimerAction("pause")} disabled={!isHost}>
                <Pause className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleTimerAction("start")}
                disabled={!isHost || timeLeft === 0}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={() => handleTimerAction("reset")} disabled={!isHost}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {isHost && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">Timer duration (minutes)</p>
              <Slider
                defaultValue={[duration]}
                max={900}
                step={60}
                onValueChange={handleDurationChange}
                disabled={isRunning}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1m</span>
                <span>15m</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
