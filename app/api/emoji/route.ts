import { NextRequest, NextResponse } from "next/server"
import { pusherServer } from "@/lib/pusher-server"

export async function POST(req: NextRequest) {
  try {
    const { emoji, roomId, sender } = await req.json()
    if (!emoji || !roomId) {
      return NextResponse.json({ error: "Missing emoji or roomId" }, { status: 400 })
    }
    await pusherServer.trigger(`presence-room-${roomId}`, "emoji-sent", { emoji, sender })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed to broadcast emoji" }, { status: 500 })
  }
} 