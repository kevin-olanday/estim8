import { NextRequest, NextResponse } from "next/server"
import { pusherServer } from "@/lib/pusher-server"

export async function POST(req: NextRequest) {
  try {
    const { fromPlayerId, toPlayerId, emoji, roomId } = await req.json()
    
    if (!fromPlayerId || !toPlayerId || !emoji || !roomId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Trigger the event on the presence channel
    await pusherServer.trigger(`presence-room-${roomId}`, "player-reaction", {
      fromPlayerId,
      toPlayerId,
      emoji
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error handling reaction:", error)
    return NextResponse.json({ error: "Failed to process reaction" }, { status: 500 })
  }
} 