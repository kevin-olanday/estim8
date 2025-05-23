"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { pusherServer } from "@/lib/pusher-server"
import { DEFAULT_DECKS, DeckType } from "@/types/card"
import type { Deck } from "@/types/card"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function createRoom(formData: FormData) {
  const roomName = formData.get("roomName") as string
  const hostName = formData.get("hostName") as string
  const deckTypeValue = (formData.get("deckType") as string) || DeckType.FIBONACCI
  const avatarStyle = formData.get("avatarStyle") as string | null
  let avatarSeed = formData.get("avatarSeed") as string | null

  if (!hostName) {
    throw new Error("Host name is required")
  }

  // Validate deck type
  const deckType = Object.values(DeckType).includes(deckTypeValue as DeckType)
    ? (deckTypeValue as DeckType)
    : DeckType.FIBONACCI

  // Validate avatarSeed is a valid JSON string with accessories
  let parsedSeed: any = null;
  try {
    parsedSeed = avatarSeed ? JSON.parse(avatarSeed) : null;
  } catch {
    parsedSeed = null;
  }
  if (!parsedSeed || !parsedSeed.accessories) {
    // Fallback to a default avatarSeed with accessories
    parsedSeed = {
      hair: "straightHair",
      mouth: "braces",
      eyes: "confused",
      hairColor: "d56c0c",
      skinColor: "643d19",
      accessories: ["catEars"]
    };
    avatarSeed = JSON.stringify(parsedSeed);
  }

  // Generate a unique room code
  const roomCode = generateRoomCode()

  // Create the room in the database
  const room = await prisma.room.create({
    data: {
      code: roomCode,
      deckType,
      deck: JSON.stringify(DEFAULT_DECKS[deckType]),
      name: roomName,
    },
  })

  // Create the host player
  const player = await prisma.player.create({
    data: {
      name: hostName,
      isHost: true,
      roomId: room.id,
      avatarStyle: avatarStyle,
      avatarSeed: avatarSeed,
    },
  })

  // Set cookies for authentication
  const cookiesStore = await cookies()
  cookiesStore.set("playerId", player.id, {
    httpOnly: true,
    sameSite: "lax",
  })

  cookiesStore.set("roomId", room.id, {
    httpOnly: true,
    sameSite: "lax",
  })

  cookiesStore.set("playerName", player.name ?? "", {
    httpOnly: false, // must be accessible by the browser
    sameSite: "lax",
  })

  // Redirect to the room
  redirect(`/room/${roomCode}`)
}

export async function joinRoom(formData: FormData) {
  const roomCode = formData.get("roomCode") as string
  const playerName = formData.get("playerName") as string
  const avatarStyle = formData.get("avatarStyle") as string | null
  let avatarSeed = formData.get("avatarSeed") as string | null

  if (!roomCode || !playerName) {
    return { error: "Room code and name are required" }
  }

  // Validate avatarSeed is a valid JSON string with accessories
  let parsedSeed: any = null;
  try {
    parsedSeed = avatarSeed ? JSON.parse(avatarSeed) : null;
  } catch {
    parsedSeed = null;
  }
  if (!parsedSeed || !parsedSeed.accessories) {
    // Fallback to a default avatarSeed with accessories
    parsedSeed = {
      hair: "straightHair",
      mouth: "braces",
      eyes: "confused",
      hairColor: "d56c0c",
      skinColor: "643d19",
      accessories: ["catEars"]
    };
    avatarSeed = JSON.stringify(parsedSeed);
  }

  // Find the room
  const room = await prisma.room.findUnique({
    where: {
      code: roomCode,
    },
  })

  if (!room) {
    return { error: "Room not found" }
  }

  // Create the player
  const player = await prisma.player.create({
    data: {
      name: playerName,
      isHost: false,
      roomId: room.id,
      avatarStyle: avatarStyle,
      avatarSeed: avatarSeed,
    },
  })

  // Set cookies for authentication
  const cookiesStore = await cookies()
  cookiesStore.set("playerId", player.id, {
    httpOnly: true,
    sameSite: "lax",
  })

  cookiesStore.set("roomId", room.id, {
    httpOnly: true,
    sameSite: "lax",
  })

  cookiesStore.set("playerName", player.name ?? "", {
    httpOnly: false, // must be accessible by the browser
    sameSite: "lax",
  })

  // Notify other players via Pusher
  await pusherServer.trigger(`presence-room-${room.id}`, "player-joined", {
    playerId: player.id,
    playerName: player.name,
    avatarStyle: player.avatarStyle,
    avatarSeed: player.avatarSeed,
  })

  // Redirect to the room
  redirect(`/room/${roomCode}`)
}

export async function getRoomData(roomCode: string) {
  // Get player and room IDs from cookies
  const cookiesStore = await cookies()
  const playerId = cookiesStore.get("playerId")?.value
  const roomId = cookiesStore.get("roomId")?.value

  if (!playerId || !roomId) {
    return null
  }

  // Get room data
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
      code: roomCode,
    },
    include: {
      activeStory: {
        include: {
          votes: {
            include: {
              player: true,
            },
          },
        },
      },
      players: true,
      stories: {
        include: {
          votes: {
            include: {
              player: true,
            },
          },
        },
      },
    },
  })

  if (!room) {
    return null
  }

  // Find the current player
  const currentPlayer = room.players.find((player) => player.id === playerId)

  if (!currentPlayer) {
    return null
  }

  // Find the host
  const host = room.players.find((player) => player.isHost)

  if (!host) {
    return null
  }

  // Get active story
  const activeStory = room.activeStory

  // Get votes for active story
  const currentVotes = activeStory
    ? activeStory.votes.map((vote) => ({
        playerId: vote.playerId,
        playerName: vote.player.name || "",
        value: vote.choice,
        avatarStyle: vote.player.avatarStyle || null,
        avatarSeed: vote.player.avatarSeed || null,
      }))
    : []

  // Format the data
  const players = room.players.map((player) => ({
    id: player.id,
    name: player.name || "",
    emoji: player.emoji || "👤",
    isHost: player.isHost,
    isOnline: true, // We'll update this with Pusher presence
    // Get vote for active story if it exists
    vote: activeStory ? activeStory.votes.find((vote) => vote.playerId === player.id)?.choice || null : null,
    avatarStyle: player.avatarStyle || null,
    avatarSeed: player.avatarSeed || null,
  }))

  // Get completed stories
  const completedStories = await prisma.story.findMany({
    where: { roomId: room.id, status: "completed" },
    include: {
      votes: {
        include: {
          player: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Map to shape for frontend
  const completedStoriesData = completedStories.map(story => ({
    id: story.id,
    title: story.title,
    description: story.description,
    finalScore: story.finalScore,
    createdAt: story.createdAt,
    manualOverride: story.manualOverride || false,
    votes: Array.isArray(story.votes) ? story.votes.map(vote => ({
      playerId: vote.playerId,
      playerName: vote.player?.name ?? "Unknown",
      value: vote.choice,
      avatarStyle: vote.player?.avatarStyle || null,
      avatarSeed: vote.player?.avatarSeed || null,
    })) : [],
  }))

  // Parse the deck from JSON
  const deck = typeof room.deck === "string" ? JSON.parse(room.deck) : room.deck

  return {
    id: room.id,
    code: room.code,
    name: room.name,
    isHost: currentPlayer.isHost,
    currentPlayerId: currentPlayer.id,
    hostId: host.id,
    deckType: room.deckType,
    deck,
    votesRevealed: activeStory?.votesRevealed || false,
    hasVotes: activeStory ? activeStory.votes.length > 0 : false,
    currentStory: activeStory
      ? {
          id: activeStory.id,
          title: activeStory.title,
          description: activeStory.description || null,
          votesRevealed: activeStory.votesRevealed,
          status: activeStory.status,
        }
      : null,
    currentVotes,
    players,
    stories: room.stories
      .filter((story) => story.status !== "completed")
      .map((story) => ({
        id: story.id,
        title: story.title,
        description: story.description || null,
        status: story.status,
        active: story.status === "active",
        completed: story.status === "completed",
        votesRevealed: story.votesRevealed,
      })),
    completedStories: completedStoriesData,
    currentUserId: playerId,
    celebrationsEnabled: (room as any).celebrationsEnabled ?? true,
    emojisEnabled: (room as any).emojisEnabled ?? true,
  }
}

export async function updateDeck(deckType: DeckType, customDeck?: Deck, deckTheme?: string) {
  const cookiesStore = await cookies()
  const roomId = cookiesStore.get("roomId")?.value
  const playerId = cookiesStore.get("playerId")?.value

  if (!roomId || !playerId) {
    throw new Error("Not authenticated")
  }

  // Check if player is host
  const player = await prisma.player.findUnique({
    where: {
      id: playerId,
      roomId,
    },
  })

  if (!player?.isHost) {
    throw new Error("Only the host can update deck values")
  }

  // Update deck values
  await prisma.room.update({
    where: {
      id: roomId,
    },
    data: {
      deckType,
      deck: (customDeck || DEFAULT_DECKS[deckType]) as unknown as Prisma.InputJsonValue,
      ...(deckTheme ? { deckTheme } : {}),
    },
  })

  // Broadcast deck update via Pusher
  await pusherServer.trigger(`presence-room-${roomId}`, "deck-updated", {
    deckType,
    deck: customDeck || DEFAULT_DECKS[deckType],
    deckTheme,
  })

  revalidatePath(`/room/[roomId]`)

  return { success: true }
}

export async function updateRoomSettings(settings: { autoRevealVotes?: boolean }) {
  const cookiesStore = await cookies()
  const roomId = cookiesStore.get("roomId")?.value
  const playerId = cookiesStore.get("playerId")?.value

  if (!roomId || !playerId) {
    throw new Error("Not authenticated")
  }

  // Check if player is host
  const player = await prisma.player.findUnique({
    where: {
      id: playerId,
      roomId,
    },
  })

  if (!player?.isHost) {
    throw new Error("Only the host can update room settings")
  }

  // Update room settings
  await prisma.room.update({
    where: { id: roomId },
    data: {
      ...(settings.autoRevealVotes !== undefined && { autoRevealVotes: settings.autoRevealVotes }),
    },
  })

  // Optionally, broadcast the settings update via Pusher if you want real-time updates
  await pusherServer.trigger(`presence-room-${roomId}`, "room-settings-updated", settings)

  revalidatePath(`/room/[roomId]`)

  return { success: true }
}

export async function kickPlayer(playerId: string) {
  const cookiesStore = await cookies()
  const roomId = cookiesStore.get("roomId")?.value
  const currentPlayerId = cookiesStore.get("playerId")?.value

  if (!roomId || !currentPlayerId) {
    throw new Error("Not authenticated")
  }

  // Only the host can kick players
  const host = await prisma.player.findFirst({
    where: { roomId, isHost: true },
  })
  if (!host || host.id !== currentPlayerId) {
    throw new Error("Only the host can kick players")
  }

  // Before deleting the player, fetch their name:
  const kickedPlayer = await prisma.player.findUnique({
    where: { id: playerId, roomId },
  })

  if (!kickedPlayer) throw new Error("Player not found")

  // Remove the player from the DB
  await prisma.player.delete({
    where: { id: playerId, roomId },
  })

  // Optionally, remove their votes, etc.
  await prisma.vote.deleteMany({ where: { playerId } })

  // Broadcast to all clients that this player was kicked
  await pusherServer.trigger(`presence-room-${roomId}`, "player-kicked", {
    playerId,
    playerName: kickedPlayer.name, // Add this line
  })

  // Optionally, clear cookies if the kicked player is the current user (for SSR actions)
  // (Clients should also handle this event and clear their own session if kicked.)

  revalidatePath(`/room/[roomId]`)
  return { success: true }
}

export async function updateRoomName(newName: string) {
  const cookiesStore = await cookies()
  const roomId = cookiesStore.get("roomId")?.value
  const playerId = cookiesStore.get("playerId")?.value

  if (!roomId || !playerId) {
    throw new Error("Not authenticated")
  }

  // Check if player is host
  const player = await prisma.player.findUnique({
    where: {
      id: playerId,
      roomId,
    },
  })

  if (!player?.isHost) {
    throw new Error("Only the host can update the room name")
  }

  // Update the room name
  const updatedRoom = await prisma.room.update({
    where: { id: roomId },
    data: { name: newName },
  })

  // Broadcast the name update via Pusher
  await pusherServer.trigger(`presence-room-${roomId}`, "room-name-updated", { name: newName })

  revalidatePath(`/room/[roomId]`)

  return { success: true, name: updatedRoom.name }
}

export async function updateCelebrationsEnabled(celebrationsEnabled: boolean) {
  const cookiesStore = await cookies()
  const roomId = cookiesStore.get("roomId")?.value
  const playerId = cookiesStore.get("playerId")?.value

  if (!roomId || !playerId) throw new Error("Not authenticated")

  // Check if player is host
  const player = await prisma.player.findUnique({ where: { id: playerId, roomId } })
  if (!player?.isHost) throw new Error("Only the host can update room settings")

  await prisma.room.update({
    where: { id: roomId },
    data: { celebrationsEnabled },
  })

  // Broadcast to all clients
  await pusherServer.trigger(`presence-room-${roomId}`, "celebrations-enabled-updated", { celebrationsEnabled })

  revalidatePath(`/room/[roomId]`)
  return { success: true }
}

export async function updateEmojisEnabled(emojisEnabled: boolean) {
  const cookiesStore = await cookies()
  const roomId = cookiesStore.get("roomId")?.value
  const playerId = cookiesStore.get("playerId")?.value

  if (!roomId || !playerId) throw new Error("Not authenticated")

  // Check if player is host
  const player = await prisma.player.findUnique({ where: { id: playerId, roomId } })
  if (!player?.isHost) throw new Error("Only the host can update room settings")

  await prisma.room.update({
    where: { id: roomId },
    data: { emojisEnabled } as any,
  })

  // Broadcast to all clients
  await pusherServer.trigger(`presence-room-${roomId}`, "emojis-enabled-updated", { emojisEnabled })

  revalidatePath(`/room/[roomId]`)
  return { success: true }
}

export async function updateTimerState(isRunning: boolean, timeLeft: number, duration: number) {
  const cookiesStore = await cookies()
  const roomId = cookiesStore.get("roomId")?.value
  const playerId = cookiesStore.get("playerId")?.value

  if (!roomId || !playerId) {
    throw new Error("Not authenticated")
  }

  // Check if player is host
  const player = await prisma.player.findUnique({
    where: {
      id: playerId,
      roomId,
    },
  })

  if (!player?.isHost) {
    throw new Error("Only the host can update timer state")
  }

  // Broadcast timer state to all clients
  await pusherServer.trigger(`presence-room-${roomId}`, "timer-update", {
    isRunning,
    timeLeft,
    duration,
  })

  return { success: true }
}

// Helper functions
function generateRoomCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}
