"use server"

import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher-server"

export async function updatePlayer(playerId: string, data: {
  name?: string
  avatarStyle?: string
  avatarOptions?: string
}) {
  const cookiesStore = await cookies()
  const roomId = cookiesStore.get("roomId")?.value

  if (!roomId) {
    throw new Error("Not authenticated")
  }

  // Update player in database
  const player = await prisma.player.update({
    where: {
      id: playerId,
      roomId,
    },
    data: {
      name: data.name,
      avatarStyle: data.avatarStyle,
      avatarSeed: data.avatarOptions, // We'll use avatarSeed field to store the options
    },
  })

  // Broadcast player update via Pusher
  await pusherServer.trigger(`presence-room-${roomId}`, "player-updated", {
    id: player.id,
    name: player.name,
    avatarStyle: player.avatarStyle,
    avatarSeed: player.avatarSeed,
  })

  return { success: true }
} 