"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { pusherServer } from "@/lib/pusher-server"
import { revealVotes } from "./story-actions"
import { prisma } from "@/lib/prisma"

export async function submitVote(storyId: string, value: string) {
  const cookiesStore = await cookies()
  const roomId = cookiesStore.get("roomId")?.value
  const playerId = cookiesStore.get("playerId")?.value

  if (!roomId || !playerId) {
    throw new Error("Not authenticated")
  }

  // Check if story exists and is active
  const story = await prisma.story.findFirst({
    where: {
      id: storyId,
      roomId,
      status: "active",
    },
  })
  if (!story) throw new Error("Story not active")

  // Get the room to validate the vote against the deck
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
    select: {
      deck: true,
      players: {
        select: {
          id: true,
        },
      },
      autoRevealVotes: true,
    },
  })

  if (!room) {
    throw new Error("Room not found")
  }

  // Validate that the vote value exists in the deck
  let deck = room.deck as any
  if (typeof deck === "string") {
    try {
      deck = JSON.parse(deck)
    } catch {
      throw new Error("Invalid deck format")
    }
  }
  const isValidVote = Array.isArray(deck) && deck.some((card) => card.label === value)

  if (!isValidVote) {
    throw new Error("Invalid vote value")
  }

  // Create or update the vote
  await prisma.vote.upsert({
    where: {
      playerId_storyId: {
        playerId,
        storyId,
      },
    },
    update: {
      choice: value,
    },
    create: {
      playerId,
      storyId,
      choice: value,
    },
  })

  // Fetch the updated vote and player name
  const vote = await prisma.vote.findUnique({
    where: {
      playerId_storyId: {
        playerId,
        storyId,
      },
    },
    include: {
      player: true,
    },
  })

  // Count votes for this story
  const votes = await prisma.vote.count({
    where: {
      storyId,
    },
  })

  // If all players have voted and autoRevealVotes is enabled, reveal votes
  if (votes === room.players.length && room.autoRevealVotes) {
    await revealVotes(storyId)
  }

  // Broadcast vote update via Pusher
  await pusherServer.trigger(`presence-room-${roomId}`, "vote-submitted", {
    playerId,
    storyId,
    value: vote?.choice,
    playerName: vote?.player?.name ?? "",
    hasVoted: true,
  })

  revalidatePath(`/room/[roomId]`)

  return { success: true }
}

export async function removeVote(storyId: string) {
  const cookiesStore = await cookies();
  const roomId = cookiesStore.get("roomId")?.value;
  const playerId = cookiesStore.get("playerId")?.value;

  if (!roomId || !playerId) {
    throw new Error("Not authenticated");
  }

  // Delete the vote
  await prisma.vote.deleteMany({
    where: {
      playerId,
      storyId,
    },
  });

  // Broadcast vote removal via Pusher
  await pusherServer.trigger(`presence-room-${roomId}`, "vote-removed", {
    playerId,
    storyId,
  });

  revalidatePath(`/room/[roomId]`);
  return { success: true };
}
