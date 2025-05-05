"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import Pusher from "pusher-js"

type PusherContextType = {
  pusher: Pusher | null
  channel: any | null
}

const PusherContext = createContext<PusherContextType>({
  pusher: null,
  channel: null,
})

export function PusherProvider({ children, roomId }: { children: ReactNode; roomId: string }) {
  const [pusher, setPusher] = useState<Pusher | null>(null)
  const [channel, setChannel] = useState<any | null>(null)

  useEffect(() => {
    // Initialize Pusher
    const pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      forceTLS: true,
    })

    setPusher(pusherInstance)

    // Subscribe to the room channel
    const roomChannel = pusherInstance.subscribe(`room-${roomId}`)
    setChannel(roomChannel)

    return () => {
      roomChannel.unbind_all()
      pusherInstance.unsubscribe(`room-${roomId}`)
      pusherInstance.disconnect()
    }
  }, [roomId])

  return <PusherContext.Provider value={{ pusher, channel }}>{children}</PusherContext.Provider>
}

export const usePusherContext = () => useContext(PusherContext)
