import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import Pusher from "pusher"

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

export async function POST(req: NextRequest) {
  const formData = await req.text()
  const params = new URLSearchParams(formData)
  const socket_id = params.get("socket_id")!
  const channel_name = params.get("channel_name")!

  // Await cookies()!
  const cookiesStore = await cookies()
  const playerId = cookiesStore.get("playerId")?.value
  const playerName = cookiesStore.get("playerName")?.value || "Anonymous"

  if (!playerId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const user_id = playerId
  const user_info = { name: playerName }

  const auth = pusher.authorizeChannel(socket_id, channel_name, {
    user_id,
    user_info,
  })

  return NextResponse.json(auth)
}