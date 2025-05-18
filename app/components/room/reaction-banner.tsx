import { motion, AnimatePresence } from "framer-motion"
import { PlayerAvatar } from "./player-avatar"
import { useEffect, useState, useRef, useLayoutEffect } from "react"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

interface ReactionBannerProps {
  show: boolean
  fromPlayer: {
    name: string
    avatarStyle?: string | null
    avatarSeed?: string | null
  }
  toPlayer: {
    name: string
    avatarStyle?: string | null
    avatarSeed?: string | null
  }
  emoji: string
  onComplete?: () => void
}

export function ReactionBanner({ show, fromPlayer, toPlayer, emoji, onComplete }: ReactionBannerProps) {
  const [yPosition, setYPosition] = useState(0)
  const senderRef = useRef<HTMLDivElement>(null);
  const recipientRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [emojiDistance, setEmojiDistance] = useState(100);
  const EMOJI_MARGIN = 8; // px, space between emoji and avatar
  const EMOJI_SIZE = 32; // px, adjust to match text-3xl
  const senderAvatarImgRef = useRef<HTMLImageElement | HTMLDivElement>(null);
  const [emojiTop, setEmojiTop] = useState<number>(0);

  useEffect(() => {
    if (show) {
      // Random y position between 20% and 80% of viewport height
      const randomY = Math.random() * 60 + 20
      setYPosition(randomY)
    }
  }, [show])

  useLayoutEffect(() => {
    if (senderRef.current && recipientRef.current && containerRef.current && senderAvatarImgRef.current) {
      const senderRect = senderRef.current.getBoundingClientRect();
      const recipientRect = recipientRef.current.getBoundingClientRect();
      const avatarImgRect = senderAvatarImgRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      // Distance from right edge of sender to left edge of recipient, minus emoji size and margin
      const distance = recipientRect.left - senderRect.right - EMOJI_MARGIN - EMOJI_SIZE;
      setEmojiDistance(distance > 0 ? distance : 0);
      // Vertical center of avatar image relative to container
      setEmojiTop(avatarImgRect.top - containerRect.top + avatarImgRect.height / 2);
    }
  }, [show, fromPlayer.name, toPlayer.name]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: "-100vw", y: `${yPosition}vh` }}
          animate={{ x: "10vw" }}
          exit={{ x: "100vw" }}
          transition={{ 
            x: { 
              duration:10,
              ease: "linear"
            }
          }}
          className="fixed z-50 w-full flex flex-col items-center"
          style={{ top: `${yPosition}vh` }}
          onAnimationComplete={onComplete}
        >
          <div ref={containerRef} className="flex items-center justify-center gap-[120px] relative min-h-[64px] w-full" style={{ maxWidth: 500, margin: '0 auto' }}>
            {/* Sender Avatar */}
            <div ref={senderRef} className="flex flex-col items-center z-10">
              <PlayerAvatar
                name={fromPlayer.name}
                avatarStyle={fromPlayer.avatarStyle || undefined}
                avatarSeed={fromPlayer.avatarSeed || undefined}
                size="md"
                // @ts-ignore
                imgRef={senderAvatarImgRef}
              />
            </div>

            {/* Recipient Avatar */}
            <div ref={recipientRef} className="flex flex-col items-center z-10">
              <PlayerAvatar
                name={toPlayer.name}
                avatarStyle={toPlayer.avatarStyle || undefined}
                avatarSeed={toPlayer.avatarSeed || undefined}
                size="md"
              />
            </div>

            {/* Animated Emoji (absolutely positioned in the row, vertically centered with avatars) */}
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: emojiDistance }}
              transition={{
                repeat: Infinity,
                repeatType: "loop",
                duration: 1.2,
                ease: "easeInOut"
              }}
              style={{
                position: 'absolute',
                left:
                  senderRef.current && containerRef.current
                    ? senderRef.current.getBoundingClientRect().right - containerRef.current.getBoundingClientRect().left
                    : 0,
                top: emojiTop,
                transform: 'translateY(-50%)',
                width: EMOJI_SIZE,
                height: EMOJI_SIZE,
                zIndex: 5,
                pointerEvents: 'none',
              }}
            >
              {/* Trailing motion blur effect */}
              <span
                style={{
                  position: 'absolute',
                  left: -EMOJI_SIZE * 0.7,
                  top: 0,
                  width: EMOJI_SIZE,
                  height: EMOJI_SIZE,
                  fontSize: EMOJI_SIZE,
                  opacity: 0.35,
                  filter: 'blur(6px)',
                  pointerEvents: 'none',
                  zIndex: 4,
                  transition: 'opacity 0.2s',
                }}
                aria-hidden="true"
              >
                {emoji}
              </span>
              {/* Main emoji */}
              <span style={{ fontSize: EMOJI_SIZE, display: 'inline-block', width: EMOJI_SIZE, height: EMOJI_SIZE, textAlign: 'center', zIndex: 5 }}>
                {emoji}
              </span>
            </motion.div>
          </div>
          {/* Text label below for clarity */}
          <div className="mt-1 text-sm font-medium bg-background/80 px-3 py-1 rounded shadow border border-border" aria-live="polite" style={{ color: 'var(--foreground, #fff)' }}>
            <span style={{ background: '#4654F0', color: '#fff', fontWeight: 'bold', padding: '0 6px', borderRadius: '6px', marginRight: 2 }}>{fromPlayer.name}</span>
            {` sent `}
            <span>{emoji}</span>
            {` to `}
            <span style={{ background: '#C25278', color: '#fff', fontWeight: 'bold', padding: '0 6px', borderRadius: '6px', marginLeft: 2 }}>{toPlayer.name}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 