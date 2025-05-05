import { redirect } from "next/navigation"
import { getRoomData } from "@/app/actions/room-actions"
import RoomClient from "./roomclient"

export default async function RoomPage({ params }: { params: { roomId: string } }) {
  const resolvedParams = await params // Await params here
  const roomData = await getRoomData(resolvedParams.roomId)
  if (!roomData) {
    redirect("/")
  }
  return <RoomClient roomData={roomData} />
}
