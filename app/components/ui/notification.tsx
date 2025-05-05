"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"

interface NotificationProps {
  message: string
  type?: "info" | "success" | "warning" | "error"
  duration?: number
  onClose?: () => void
}

export function Notification({ message, type = "info", duration = 5000, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      if (onClose) onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    if (onClose) onClose()
  }

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-500"
      case "warning":
        return "bg-amber-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-md text-white shadow-lg ${getTypeStyles()}`}
        >
          <div className="flex items-center justify-between">
            <p>{message}</p>
            <button onClick={handleClose} className="ml-4 p-1 rounded-full hover:bg-white/20">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
