import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const COMMON_EMOJIS = [
  "👍", "❤️", "😂", "🎉", "👏", "🙌", "🔥", "✨", "🤔", "👀",
  "😊", "🫶", "🤝", "💪", "👊", "🚀", "💡", "🌟", "💯", "🤜",
  "💩", "💀", "🤡", "👽", "👻"
]

interface EmojiPanelProps {
  isOpen: boolean
  onClose: () => void
  onSelectEmoji: (emoji: string) => void
  position: { x: number; y: number }
  disabled?: boolean
}

export function EmojiPanel({ isOpen, onClose, onSelectEmoji, position, disabled = false }: EmojiPanelProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className={cn(
              "fixed z-50 bg-background border border-border rounded-lg shadow-lg p-2",
              "grid grid-cols-5 gap-2"
            )}
            style={{
              left: position.x,
              top: position.y,
            }}
          >
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onSelectEmoji(emoji)
                  onClose()
                }}
                className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-accent/10 rounded-lg transition-colors"
                disabled={disabled}
                style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : undefined }}
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 