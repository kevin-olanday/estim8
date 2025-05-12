"use client"

import { useEffect, useState } from "react"
import ReactConfetti from "react-confetti"
import { useWindowSize } from "@/app/hooks/use-window-size"
import { AnimatePresence, motion } from "framer-motion"

interface ConfettiProps {
  duration?: number
}

export function Confetti({ duration = 3000 }: ConfettiProps) {
  const [isActive, setIsActive] = useState(true)
  const { width, height } = useWindowSize()

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsActive(false)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50 }}
        >
          <ReactConfetti width={width} height={height} recycle={false} numberOfPieces={200} gravity={0.2} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
