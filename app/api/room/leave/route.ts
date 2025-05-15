import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { pusherServer } from "@/lib/pusher-server"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { roomId, userId, newHostId } = await req.json()
    if (!roomId || !userId) {
      return NextResponse.json({ error: "Missing roomId or userId" }, { status: 400 })
    }

    // Fetch all players in the room
    const players = await prisma.player.findMany({
      where: { roomId },
    })
    const leavingPlayer = players.find(p => p.id === userId)
    if (!leavingPlayer) {
      return NextResponse.json({ error: "Player not found in room" }, { status: 404 })
    }
    const isHost = leavingPlayer.isHost
    const otherPlayers = players.filter(p => p.id !== userId)

    if (isHost) {
      if (otherPlayers.length > 0) {
        // Host must transfer before leaving
        if (!newHostId || !otherPlayers.some(p => p.id === newHostId)) {
          return NextResponse.json({ error: "Must select a valid new host before leaving" }, { status: 400 })
        }
        // Transfer host
        await prisma.player.update({ where: { id: userId }, data: { isHost: false } })
        await prisma.player.update({ where: { id: newHostId }, data: { isHost: true } })
        // Remove host from players
        await prisma.player.delete({ where: { id: userId } })
        // Broadcast host transfer and player leave
        const newHost = players.find(p => p.id === newHostId);
        await pusherServer.trigger(`presence-room-${roomId}`, "host-transferred", { newHostId, oldHostId: userId, newHostName: newHost?.name || "Someone" })
        await pusherServer.trigger(`presence-room-${roomId}`, "player-left", { playerId: userId, playerName: leavingPlayer.name })
        return NextResponse.json({ success: true, transferred: true })
      } else {
        // Host is last player, delete room (cascade deletes players/stories)
        await prisma.room.delete({ where: { id: roomId } })
        // Optionally broadcast room deletion
        return NextResponse.json({ success: true, deleted: true })
      }
    } else {
      // Regular player leaves
      await prisma.player.delete({ where: { id: userId } })
      // Broadcast player leave
      await pusherServer.trigger(`presence-room-${roomId}`, "player-left", { playerId: userId, playerName: leavingPlayer.name })
      return NextResponse.json({ success: true, left: true })
    }
  } catch (e) {
    console.error("[LEAVE ROOM ERROR]", e);
    return NextResponse.json({ error: "Failed to leave room" }, { status: 500 })
  }
} 