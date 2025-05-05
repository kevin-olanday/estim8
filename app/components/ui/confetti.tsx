"use client"

import { useEffect, useState } from "react"
import ReactConfetti from "react-confetti"
import { useWindowSize } from "@/app/hooks/use-window-size"

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

  if (!isActive) return null

  return <ReactConfetti width={width} height={height} recycle={false} numberOfPieces={200} gravity={0.2} />
}
