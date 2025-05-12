import { joinRoom } from "@/app/actions/room-actions";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { roomCode, playerName } = req.body;
  const result = await joinRoom({
    get: (key: string) => (key === "roomCode" ? roomCode : key === "playerName" ? playerName : undefined),
  } as any);
  if (result?.error) {
    return res.status(400).json(result);
  }
  res.status(200).json({ success: true, roomCode });
} 