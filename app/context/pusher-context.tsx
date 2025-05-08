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
      authEndpoint: "/api/pusher/auth", // <-- You need to implement this endpoint for presence auth
      auth: {
        params: {
          // Optionally pass user info here
        },
      },
    })

    setPusher(pusherInstance)

    if (!roomId) return;

    console.log('[PUSHER CONTEXT] Subscribing to:', `presence-room-${roomId}`);
    const channel = pusherInstance.subscribe(`presence-room-${roomId}`);
    setChannel(channel);

    // Set up global event logger
    channel.bind_global((eventName: string, data: any) => {
      console.log('[PUSHER CONTEXT] Global event:', eventName, data);
    });

    // Handle subscription success
    channel.bind('pusher:subscription_succeeded', (data: any) => {
      console.log('[PUSHER CONTEXT] Subscription succeeded for:', `presence-room-${roomId}`);
    });

    // Handle subscription error
    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('[PUSHER CONTEXT] Subscription error:', error);
    });

    return () => {
      console.log('[PUSHER CONTEXT] Unsubscribing from:', `presence-room-${roomId}`);
      pusherInstance.unsubscribe(`presence-room-${roomId}`);
      setChannel(null);
    };
  }, [roomId])

  return <PusherContext.Provider value={{ pusher, channel }}>{children}</PusherContext.Provider>
}

export const usePusherContext = () => useContext(PusherContext)

