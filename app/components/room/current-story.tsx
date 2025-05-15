"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Save, FileText, Play, Pause, Settings, RotateCcw, Clock } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { updateStory, completeStory } from "@/app/actions/story-actions"
import { usePusherContext } from "@/app/context/pusher-context"
import { useCurrentStory } from "@/app/context/current-story-context"
import { cn } from "@/lib/utils"

interface CurrentStoryProps {
  story: any 
  isHost: boolean
}

function VotingTimerPill({
  isHost,
  votingActive,
  onRevealVotes,
  initialDuration = 60,
}: {
  isHost: boolean;
  votingActive: boolean;
  onRevealVotes: () => void;
  initialDuration?: number;
}) {
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(initialDuration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [pulse, setPulse] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [pendingHours, setPendingHours] = useState(0);
  const [pendingMinutes, setPendingMinutes] = useState(0);
  const [pendingSeconds, setPendingSeconds] = useState(initialDuration);

  // Timer logic
  useEffect(() => {
    if (!isRunning || !votingActive) return;
    if (timeLeft <= 0) {
      setIsRunning(false);
      onRevealVotes();
      return;
    }
    setPulse(true);
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [isRunning, timeLeft, votingActive, onRevealVotes]);

  // Remove pulse after animation
  useEffect(() => {
    if (pulse) {
      const timeout = setTimeout(() => setPulse(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [pulse]);

  // Reset timer when voting becomes active
  useEffect(() => {
    if (votingActive) {
      setTimeLeft(duration);
      setIsRunning(false);
    }
  }, [votingActive, duration]);

  // Format time
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Animation: pulse on tick, intensify if < 10s
  const animateClass =
    pulse && timeLeft <= 10
      ? "timer-pulse-intense"
      : pulse
      ? "timer-pulse"
      : "";

  // Hourglass spin animation
  const hourglassClass =
    isRunning && timeLeft <= 10
      ? "timer-hourglass-spin-fast"
      : isRunning
      ? "timer-hourglass-spin"
      : "";

  // Add CSS for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'timer-anim-style';
    style.innerHTML = `
      @keyframes timerPulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99,102,241,0.10); }
        50% { transform: scale(1.08); box-shadow: 0 0 8px 2px rgba(99,102,241,0.18); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99,102,241,0.10); }
      }
      .timer-pulse {
        animation: timerPulse 0.3s cubic-bezier(0.4,0,0.6,1);
      }
      @keyframes timerPulseIntense {
        0% { transform: scale(1); box-shadow: 0 0 0 0 #f59e42cc; }
        50% { transform: scale(1.13); box-shadow: 0 0 16px 4px #f59e42cc; }
        100% { transform: scale(1); box-shadow: 0 0 0 0 #f59e42cc; }
      }
      .timer-pulse-intense {
        animation: timerPulseIntense 0.3s cubic-bezier(0.4,0,0.6,1);
      }
      @keyframes hourglassSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .timer-hourglass-spin {
        animation: hourglassSpin 1.2s linear infinite;
      }
      .timer-hourglass-spin-fast {
        animation: hourglassSpin 0.5s linear infinite;
      }
    `;
    if (!document.getElementById('timer-anim-style')) {
      document.head.appendChild(style);
    }
    return () => {
      if (document.getElementById('timer-anim-style')) {
        document.head.removeChild(style);
      }
    };
  }, []);

  if (!votingActive) return null;

  return (
    <>
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        <div
          className={`rounded-full bg-muted px-4 py-1 flex items-center gap-2 shadow font-mono text-sm font-semibold transition-all duration-300 ${animateClass}`}
        >
          <span className={`mr-1 ${hourglassClass}`}>⏳</span>
          <span>{formatTime(timeLeft)}</span>
          {isHost && (
            <span className="flex items-center gap-1 ml-2">
              {isRunning ? (
                <button
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-accent/20 transition"
                  onClick={() => setIsRunning(false)}
                  title="Pause"
                  type="button"
                >
                  <Pause className="w-4 h-4" />
                </button>
              ) : (
                <button
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-accent/20 transition"
                  onClick={() => setIsRunning(true)}
                  title="Start"
                  type="button"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
              <button
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-accent/20 transition"
                onClick={() => { setTimeLeft(duration); setIsRunning(false); }}
                title="Reset timer"
                type="button"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-accent/20 transition"
                onClick={() => {
                  setPendingHours(Math.floor(duration / 3600));
                  setPendingMinutes(Math.floor((duration % 3600) / 60));
                  setPendingSeconds(duration % 60);
                  setShowDurationModal(true);
                }}
                title="Set duration"
                type="button"
              >
                <Settings className="w-4 h-4" />
              </button>
            </span>
          )}
        </div>
      </div>
      {/* Timer Duration Modal */}
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
          <form
            onSubmit={e => {
              e.preventDefault();
              const total = pendingHours * 3600 + pendingMinutes * 60 + pendingSeconds;
              setDuration(total);
              setTimeLeft(total);
              setIsRunning(false);
              setShowDurationModal(false);
            }}
            className="space-y-4"
          >
            <div className="flex items-end justify-center gap-0 mb-2 bg-muted/60 border border-border rounded-xl px-2 py-3">
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min={0}
                  className="w-12 px-1 py-2 bg-transparent border-none outline-none text-center font-mono text-lg focus:ring-2 focus:ring-accent rounded-md"
                  value={pendingHours}
                  onChange={e => setPendingHours(Math.max(0, Number(e.target.value)))}
                  autoFocus
                />
                <span className="text-xs text-muted-foreground mt-0.5">h</span>
              </div>
              <span className="mx-1 text-lg font-bold text-muted-foreground select-none">:</span>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min={0}
                  max={59}
                  className="w-12 px-1 py-2 bg-transparent border-none outline-none text-center font-mono text-lg focus:ring-2 focus:ring-accent rounded-md"
                  value={pendingMinutes}
                  onChange={e => setPendingMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
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
    </>
  );
}

export default function CurrentStory({ story, isHost }: CurrentStoryProps) {
  const { currentStory, setCurrentStory } = useCurrentStory()
  const { channel } = usePusherContext()
  const [highlight, setHighlight] = useState(false)
  const [showGlowSweep, setShowGlowSweep] = useState(false)
  const [showDurationModal, setShowDurationModal] = useState(false)
  const [pendingDuration, setPendingDuration] = useState(60)

  useEffect(() => {
    if (!channel) return

    const handleStoryUpdated = (data: any) => {
      if (data.id === story?.id) {
        setCurrentStory(data);
      }
    }
    
    const handleStoryCompleted = (data: any) => {
      console.log('[CurrentStory] Story completed event received:', data);
      if (story && story.id === data.id) {
        setCurrentStory(null);
      }
    }

    channel.bind("story-updated", handleStoryUpdated)
    channel.bind("story-completed", handleStoryCompleted)

    return () => {
      channel.unbind("story-updated", handleStoryUpdated)
      channel.unbind("story-completed", handleStoryCompleted)
    }
  }, [channel, story, setCurrentStory])

  // Add styles for animated gradient border
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      @keyframes border-flow {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }
      
      .animated-border {
        position: relative;
      }
      
      .animated-border > span {
        background: linear-gradient(-45deg, var(--color-accent), var(--color-secondary), #6d44b8, #ff49d9);
        background-size: 300% 300%;
        animation: border-flow 8s ease infinite;
        mask: 
          linear-gradient(#fff 0 0) content-box, 
          linear-gradient(#fff 0 0);
        mask-composite: exclude;
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        padding: 2px;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  useEffect(() => {
    if (story?.id) {
      setHighlight(true)
      const timeout = setTimeout(() => setHighlight(false), 700)
      return () => clearTimeout(timeout)
    }
  }, [story?.id])

  // Add CSS for radial glow sweep animation (must be at top level for hook order)
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'glow-sweep-style';
    style.innerHTML = `
      @keyframes radialGlowSweep {
        0% {
          opacity: 0;
          transform: scale(0.85);
        }
        10% {
          opacity: 0.35;
          transform: scale(1);
        }
        60% {
          opacity: 0.18;
          transform: scale(1.25);
        }
        100% {
          opacity: 0;
          transform: scale(1.7);
        }
      }
      .glow-sweep {
        pointer-events: none;
        position: fixed;
        inset: 0;
        z-index: 50;
        background: radial-gradient(circle at 50% 50%, #a5b4fc88 0%, #6366f144 40%, transparent 80%);
        animation: radialGlowSweep 0.85s cubic-bezier(0.4,0,0.6,1);
        opacity: 0;
      }
    `;
    if (!document.getElementById('glow-sweep-style')) {
      document.head.appendChild(style);
    }
    return () => {
      if (document.getElementById('glow-sweep-style')) {
        document.head.removeChild(style);
      }
    };
  }, []);

  if (!story) {
    return (
      <Card className="section-card min-h-[140px] flex flex-col">
        <div className="panel-header justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent/80" />
            <h2 className="panel-title">Current Story</h2>
          </div>
        </div>
        <CardContent className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-muted-foreground w-full">
            Select a story to start estimation
          </p>
        </CardContent>
      </Card>
    )
  }

  // Add this function to reveal votes when timer ends
  const handleRevealVotes = () => {
    setShowGlowSweep(true);
    setTimeout(() => setShowGlowSweep(false), 1200);
    // TODO: Implement reveal votes logic here (call backend or context)
    // For now, just log
    console.log("Timer ended: reveal votes!");
  };

  return (
    <>
      {showGlowSweep && <div className="glow-sweep" />}
      <Card className={cn(
        "section-card min-h-[140px] relative flex flex-col",
        story && "animated-border",
        highlight && "animate-[pulse_0.7s] ring-2 ring-indigo-400/60"
      )}>
        {/* Timer Pill (top-right) */}
        {story.status === "active" && (
          <VotingTimerPill
            isHost={isHost}
            votingActive={story.status === "active"}
            onRevealVotes={handleRevealVotes}
            initialDuration={60}
          />
        )}
        {/* Gradient border overlay for animation */}
        <span className="absolute inset-0 rounded-2xl overflow-hidden border border-transparent pointer-events-none" />
        <div className="panel-header justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent/80" />
            <h2 className="panel-title">Current Story</h2>
          </div>
        </div>
        <div className="mb-3" />
        <CardContent>
          <div className="space-y-2 text-center">
            <h3 className="font-bold text-xl text-foreground leading-tight tracking-tight">{story.title}</h3>
            <p className="text-base text-muted-foreground whitespace-pre-line">
              {story.description || "No description provided."}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
