import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import Pusher from "pusher"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

export async function POST(req: NextRequest) {
  let socket_id, channel_name;

  // Try to parse as form-urlencoded first
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await req.text();
    const params = new URLSearchParams(formData);
    socket_id = params.get("socket_id");
    channel_name = params.get("channel_name");
  } else if (contentType.includes("application/json")) {
    const body = await req.json();
    socket_id = body.socket_id;
    channel_name = body.channel_name;
  }

  if (!socket_id || !channel_name) {
    return NextResponse.json({ error: "Missing socket_id or channel_name" }, { status: 400 });
  }

  // Await cookies()!
  const cookiesStore = await cookies()
  const playerId = cookiesStore.get("playerId")?.value
  const playerName = cookiesStore.get("playerName")?.value || "Anonymous"

  if (!playerId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // Fetch player from DB to get avatar info
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  const user_id = playerId;
  const user_info = {
    name: playerName,
    emoji: player?.emoji || "👤",
    avatarStyle: player?.avatarStyle || null,
    avatarSeed: player?.avatarSeed || null,
  };

  const auth = pusher.authorizeChannel(socket_id, channel_name, {
    user_id,
    user_info,
  })

  return NextResponse.json(auth)
}