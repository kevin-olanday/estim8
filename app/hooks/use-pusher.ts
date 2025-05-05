"use client"

import { useState, useEffect } from "react"
import Pusher from "pusher-js"

let pusherClient: Pusher | null = null

export function usePusher() {
  const [pusher, setPusher] = useState<Pusher | null>(null)

  useEffect(() => {
    if (!pusherClient) {
      pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        forceTLS: true,
      })
    }

    setPusher(pusherClient)

    return () => {
      // Don't disconnect on component unmount as other components might be using it
    }
  }, [])

  return pusher
}
