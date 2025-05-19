"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { pusherServer } from "@/lib/pusher-server"
import { revealVotes } from "./story-actions"
import { prisma } from "@/lib/prisma"

export async function submitVote(storyId: string, value: string) {
  const startTime = performance.now();
  const cookiesStore = await cookies()
  const roomId = cookiesStore.get("roomId")?.value
  const playerId = cookiesStore.get("playerId")?.value

  if (!roomId || !playerId) {
    throw new Error("Not authenticated")
  }

  // Use a transaction to ensure data consistency
  const dbStartTime = performance.now();
  const result = await prisma.$transaction(async (tx) => {
    // Get story and room data in a single query
    const storyQueryStart = performance.now();
    const story = await tx.story.findFirst({
      where: {
        id: storyId,
        roomId,
        status: "active",
      },
      include: {
        room: {
          select: {
            deck: true,
            players: {
              select: {
                id: true,
              },
            },
            autoRevealVotes: true,
          },
        },
      },
    })
    const storyQueryEnd = performance.now();

    if (!story) throw new Error("Story not active")
    if (!story.room) throw new Error("Room not found")

    // Validate that the vote value exists in the deck
    let deck = story.room.deck as any
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
    const voteQueryStart = performance.now();
    const vote = await tx.vote.upsert({
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
      include: {
        player: true,
      },
    })
    const voteQueryEnd = performance.now();

    // Count votes for this story
    const countQueryStart = performance.now();
    const voteCount = await tx.vote.count({
      where: {
        storyId,
      },
    })
    const countQueryEnd = performance.now();

    // If all players have voted and autoRevealVotes is enabled, reveal votes
    if (voteCount === story.room.players.length && story.room.autoRevealVotes) {
      const revealStart = performance.now();
      await revealVotes(storyId)
      const revealEnd = performance.now();
    }

    return { vote, voteCount, story }
  })
  const dbEndTime = performance.now();

  // Broadcast vote update via Pusher
  const pusherStartTime = performance.now();
  await pusherServer.trigger(`presence-room-${roomId}`, "vote-submitted", {
    playerId,
    storyId,
    value: result.vote.choice,
    playerName: result.vote.player?.name ?? "",
    hasVoted: true,
    timestamp: Date.now(),
    totalVotes: result.voteCount,
    totalPlayers: result.story.room.players.length,
    isComplete: result.voteCount === result.story.room.players.length
  })
  const pusherEndTime = performance.now();

  revalidatePath(`/room/[roomId]`)

  const endTime = performance.now();

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
