"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { Notification } from "@/app/components/ui/notification"

type NotificationType = "info" | "success" | "warning" | "error"

interface NotificationItem {
  id: string
  message: string
  type: NotificationType
  duration?: number
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType, duration?: number) => void
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
})

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const showNotification = (message: string, type: NotificationType = "info", duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setNotifications((prev) => [...prev, { id, message, type, duration }])
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => useContext(NotificationContext)
