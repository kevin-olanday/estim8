"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Save, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { updateStory, completeStory } from "@/app/actions/story-actions"
import { usePusherContext } from "@/app/context/pusher-context"
import { useCurrentStory } from "@/app/context/current-story-context"
import { cn } from "@/lib/utils"

interface CurrentStoryProps {
  story: any 
  isHost: boolean
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
        {/* Animated gradient border span */}
        {story && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 rounded-2xl border-4"
            style={{
              background: 'linear-gradient(-45deg, var(--color-accent), var(--color-secondary), #6d44b8, #ff49d9)',
              backgroundSize: '300% 300%',
              animation: 'border-flow 8s ease infinite',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
              padding: 4,
              border: 0,
              boxSizing: 'border-box',
            }}
          />
        )}
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
            {story.description && (
              <p className="text-base text-muted-foreground whitespace-pre-line">
                {story.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
