"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
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
      authEndpoint: "/api/pusher/auth",
      auth: {
        params: {
          // Optionally pass user info here
        },
      },
      enabledTransports: ['ws', 'wss'],
      disabledTransports: ['xhr_streaming', 'xhr_polling'],
      enableStats: true
    })

    setPusher(pusherInstance)

    if (!roomId) return;

    const channel = pusherInstance.subscribe(`presence-room-${roomId}`);
    setChannel(channel);

    // Set up global event logger
    channel.bind_global((eventName: string, data: any) => {
      // Global event handling
    });

    // Handle subscription success
    channel.bind('pusher:subscription_succeeded', (data: any) => {
      // Subscription success handling
    });

    // Handle subscription error
    channel.bind('pusher:subscription_error', (error: any) => {
      // Subscription error handling
    });

    return () => {
      pusherInstance.unsubscribe(`presence-room-${roomId}`);
      setChannel(null);
    };
  }, [roomId])

  const subscribeToRoom = useCallback((roomId: string) => {
    if (!pusher) return;
    // Subscribing to room without console.log
    const channel = pusher.subscribe(`presence-room-${roomId}`);
    return channel;
  }, [pusher]);

  const handleGlobalEvent = useCallback((eventName: string, data: any) => {
    // Global event handling without console.log
  }, []);

  const handleSubscriptionSucceeded = useCallback((channel: any) => {
    // Subscription success handling without console.log
  }, []);

  const handleSubscriptionError = useCallback((error: any) => {
    // Subscription error handling without console.error
  }, []);

  const unsubscribeFromRoom = useCallback((roomId: string) => {
    if (!pusher) return;
    // Unsubscribing without console.log
    pusher.unsubscribe(`presence-room-${roomId}`);
  }, [pusher]);

  return <PusherContext.Provider value={{ pusher, channel }}>{children}</PusherContext.Provider>
}

export const usePusherContext = () => useContext(PusherContext)

