"use client"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface CountdownAlertProps {
  timeLeft: number
  threshold: number
}

export function CountdownAlert({ timeLeft, threshold }: CountdownAlertProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (timeLeft > 0 && timeLeft <= threshold) {
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [timeLeft, threshold])

  if (!visible) return null

  return (
    <Alert variant="destructive" className="animate-pulse">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Time is running out!</AlertTitle>
      <AlertDescription>Only {timeLeft} seconds remaining for discussion.</AlertDescription>
    </Alert>
  )
}
