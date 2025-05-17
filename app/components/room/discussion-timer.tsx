"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, RotateCcw, Timer } from "lucide-react"
import { updateTimerState } from "@/app/actions/room-actions"
import { usePusherContext } from "@/app/context/pusher-context"
import { CountdownAlert } from "@/app/components/ui/countdown-alert"
import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast()

  useEffect(() => {
    if (!channel) return

    const handleTimerUpdate = (data: any) => {
      setIsRunning(data.isRunning)
      setTimeLeft(data.timeLeft)
      setDuration(data.duration)
      if (data.isRunning) {
        toast({ title: "Timer started", description: "The discussion timer has started." })
      } else {
        if (isRunning) {
          toast({ title: "Timer paused", description: "The discussion timer is paused." })
        }
      }
    }

    channel.bind("timer-update", handleTimerUpdate)

    return () => {
      channel.unbind("timer-update", handleTimerUpdate)
    }
  }, [channel, toast, isRunning])

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
            toast({ title: "Timer started", description: "The discussion timer has started." })
            break
          case "pause":
            setIsRunning(false)
            await updateTimerState(false, timeLeft, duration)
            toast({ title: "Timer paused", description: "The discussion timer is paused." })
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
    [duration, isHost, timeLeft, toast],
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

    let newDuration = value[0]
    if (newDuration < 60) newDuration = 60
    setDuration(newDuration)
    setTimeLeft(newDuration)
    await updateTimerState(isRunning, newDuration, newDuration)
  }

  const progress = (timeLeft / duration) * 100

  // --- Progress Bar Animation and Styling ---
  // Animate fill width and color based on time left
  const urgent = timeLeft <= 10 && isRunning && timeLeft > 0;
  const progressBarGradient = urgent
    ? 'linear-gradient(90deg, #f43f5e, #ec4899 60%, #fbbf24)'
    : 'linear-gradient(90deg, #8B5CF6, #EC4899 60%, #06B6D4)';

  // For pulsing effect at urgency
  const pulseClass = urgent ? 'timer-bar-pulse' : '';

  // --- Progress Bar CSS (inject once) ---
  if (typeof window !== 'undefined' && !document.getElementById('timer-bar-style')) {
    const style = document.createElement('style');
    style.id = 'timer-bar-style';
    style.innerHTML = `
      .timer-bar {
        height: 8px;
        border-radius: 9999px;
        background: rgba(255,255,255,0.08);
        overflow: hidden;
        position: relative;
      }
      .timer-bar-fill {
        height: 100%;
        border-radius: 9999px;
        box-shadow: 0 0 12px 2px #8B5CF6cc, 0 0 24px 4px #EC489988;
        filter: blur(0.5px);
        transition: background 0.3s;
        will-change: width, background;
      }
      @keyframes timerBarPulse {
        0%, 100% { transform: scaleY(1); opacity: 1; }
        50% { transform: scaleY(1.18); opacity: 0.85; }
      }
      .timer-bar-pulse {
        animation: timerBarPulse 0.7s cubic-bezier(.4,0,.2,1) infinite;
        box-shadow: 0 0 16px 4px #f43f5ecc, 0 0 32px 8px #ec489988;
      }
    `;
    document.head.appendChild(style);
  }

  return (
    <Card className="section-card min-h-[80px] flex flex-col justify-center">
      <div className="panel-header justify-between mb-1">
        <h2 className="panel-title flex items-center gap-2">
          <Timer className="h-5 w-5 text-accent/80" />
          Discussion Timer
        </h2>
      </div>
      <CardContent className="py-3 px-4">
        {isHost ? (
          <div className="flex items-center justify-between gap-2 w-full">
            {/* Timer (Left) */}
            <div className="flex items-center min-w-[56px]">
              <span className="text-2xl font-mono tabular-nums select-none">{formatTime(timeLeft)}</span>
              {!isRunning && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-muted text-xs text-muted-foreground font-semibold border border-border animate-fade-in">Paused</span>
              )}
            </div>
            {/* Divider */}
            <div className="h-7 w-px bg-border mx-1" />
            {/* Controls (Center) */}
            <div className="flex items-center gap-1">
              {isRunning ? (
                <Button variant="outline" size="sm" onClick={() => handleTimerAction("pause")} disabled={!isHost} className="transition-transform hover:scale-110 px-2 h-8 w-8">
                  <Pause className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTimerAction("start")}
                  disabled={!isHost || timeLeft === 0}
                  className="transition-transform hover:scale-110 px-2 h-8 w-8"
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => handleTimerAction("reset")} disabled={!isHost} className="transition-transform hover:scale-110 px-2 h-8 w-8">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            {/* Divider */}
            <div className="h-7 w-px bg-border mx-1" />
            {/* Duration Slider (Right) */}
            <div className="flex flex-col items-end min-w-[110px]">
              <Slider
                defaultValue={[duration]}
                min={60}
                max={900}
                step={60}
                onValueCommit={handleDurationChange}
                disabled={isRunning || !isHost}
                className="w-28 transition-all duration-150 hover:[&_.slider-thumb]:scale-125"
              />
              <div className="flex justify-between w-full text-xs text-muted-foreground mt-1">
                <span>1m</span>
                <span>15m</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full py-2">
            <span className="text-2xl font-mono tabular-nums select-none">{formatTime(timeLeft)}</span>
            {!isRunning && (
              <span className="ml-2 px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground font-semibold border border-border animate-fade-in">Paused</span>
            )}
          </div>
        )}
        {/* Progress Bar */}
        <div className="w-full mt-3">
          <div className="timer-bar">
            <div
              className={`timer-bar-fill ${pulseClass}`}
              style={{
                width: `${progress}%`,
                background: progressBarGradient,
                transition: 'background 0.3s',
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
