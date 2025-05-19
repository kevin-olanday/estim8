"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { pusherServer } from "@/lib/pusher-server"
import { prisma } from "@/lib/prisma"

export async function addStory(title: string, description: string | null = null) {
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
    throw new Error("Only the host can add stories")
  }

  // Create the story
  const story = await prisma.story.create({
    data: {
      title,
      description,
      roomId,
      status: "idle", // Use status instead of active/completed
      votesRevealed: false,
    },
  })

  // Broadcast story update via Pusher
  await pusherServer.trigger(`presence-room-${roomId}`, "story-added", {
    id: story.id,
    title: story.title,
    description: story.description,
  })

  revalidatePath(`/room/[roomId]`)

  return { success: true }
}

export async function setActiveStory(storyId: string) {
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
    throw new Error("Only the host can change the active story")
  }

  // Set all non-completed stories in the room to "idle"
  await prisma.story.updateMany({
    where: { roomId, status: { not: "completed" } },
    data: { status: "idle" },
  })

  // Set the selected story to "active" and reset votesRevealed
  const story = await prisma.story.update({
    where: { id: storyId, roomId },
    data: { status: "active", votesRevealed: false },
  })

  // Update the room's activeStoryId
  await prisma.room.update({
    where: {
      id: roomId,
    },
    data: {
      activeStoryId: storyId,
    },
  })

  // Delete all votes for the story
  await prisma.vote.deleteMany({
    where: {
      storyId,
    },
  })

  // Broadcast story update via Pusher
  await pusherServer.trigger(`presence-room-${roomId}`, "active-story-changed", {
    id: story.id,
    title: story.title,
    description: story.description,
    status: story.status,
    votesRevealed: story.votesRevealed,
  })

  revalidatePath(`/room/[roomId]`)

  return { success: true }
}

export async function updateStory(storyId: string, title: string, description: string | null = null) {
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
    throw new Error("Only the host can update stories")
  }

  // Update the story
  const story = await prisma.story.update({
    where: {
      id: storyId,
      roomId,
    },
    data: {
      title,
      description,
    },
  })

  // Broadcast story update via Pusher
  await pusherServer.trigger(`presence-room-${roomId}`, "story-updated", {
    id: story.id,
    title: story.title,
    description: story.description,
  })

  revalidatePath(`/room/[roomId]`)

  return { success: true }
}

export async function completeStory(storyId: string) {
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
    throw new Error("Only the host can complete stories")
  }

  // Get all votes for the story
  const votes = await prisma.vote.findMany({
    where: { storyId },
  });

  let finalScore: string | null = null;

  if (votes.length === 1) {
    // Only one vote, use it
    finalScore = votes[0].choice;
  } else if (votes.length > 1) {
    // Check for consensus
    const allSame = votes.every(v => v.choice === votes[0].choice);
    if (allSame) {
      finalScore = votes[0].choice;
    } else {
      // No consensus, use median of numeric votes if possible, else pick first value
      const numericVotes = votes
        .map(v => parseFloat(v.choice))
        .filter(v => !isNaN(v));
      if (numericVotes.length > 0) {
        const sorted = [...numericVotes].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median =
          sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
        finalScore = String(median);
      } else {
        finalScore = votes[0]?.choice || null;
      }
    }
  }

  // Mark the story as completed and set the final score
  const story = await prisma.story.update({
    where: {
      id: storyId,
      roomId,
    },
    data: {
      status: "completed",
      // Cast as any to allow string or number (schema is String, but types may expect number)
      finalScore: finalScore as any,
    },
  })

  // If this was the active story, clear the activeStoryId
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
    select: {
      activeStoryId: true,
    },
  })

  if (room?.activeStoryId === storyId) {
    await prisma.room.update({
      where: {
        id: roomId,
      },
      data: {
        activeStoryId: null,
      },
    })
  }

  // Broadcast story update via Pusher
  await pusherServer.trigger(`presence-room-${roomId}`, "story-completed", {
    id: story.id,
    finalScore: finalScore,
    status: "completed",
    resetCurrentStory: true
  })

  revalidatePath(`/room/[roomId]`)

  return { success: true }
}

export async function completeStoryWithScore(storyId: string, score: string | number, options?: { manualOverride?: boolean, originalVotes?: any[] }) {
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
    throw new Error("Only the host can complete stories")
  }

  // Mark the story as completed and set the final score, manualOverride, and originalVotes if provided
  const story = await prisma.story.update({
    where: {
      id: storyId,
      roomId,
    },
    data: {
      status: "completed",
      finalScore: String(score), // Ensure finalScore is always a string
      manualOverride: options?.manualOverride || false,
      originalVotes: options?.originalVotes ? JSON.stringify(options.originalVotes) : undefined,
    },
  })

  // If this was the active story, clear the activeStoryId
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
    select: {
      activeStoryId: true,
    },
  })

  if (room?.activeStoryId === storyId) {
    await prisma.room.update({
      where: {
        id: roomId,
      },
      data: {
        activeStoryId: null,
      },
    })
  }

  // Broadcast story update via Pusher
  await pusherServer.trigger(`presence-room-${roomId}`, "story-completed", {
    id: story.id,
    finalScore: score,
    status: "completed",
    manualOverride: options?.manualOverride || false,
    originalVotes: options?.originalVotes || [],
    resetCurrentStory: true
  })

  revalidatePath(`/room/[roomId]`)

  return { success: true }
}

export async function revealVotes(storyId: string) {
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
    throw new Error("Only the host can reveal votes")
  }

  // Update story to reveal votes
  await prisma.story.update({
    where: { id: storyId, roomId },
    data: {
      votesRevealed: true,
    },
  })

  // Get all votes for the story
  const detailedVotes = await prisma.vote.findMany({
    where: { storyId },
    include: { player: true },
  })

  const formattedVotes = detailedVotes.map((vote) => ({
    playerId: vote.playerId,
    playerName: vote.player.name || "",
    value: vote.choice,
    avatarStyle: vote.player.avatarStyle,
    avatarSeed: vote.player.avatarSeed
  }))

  // Broadcast votes via Pusher
  console.log('Triggering votes-revealed event for story', storyId, 'with votes:', formattedVotes);
  await pusherServer.trigger(`presence-room-${roomId}`, "votes-revealed", {
    storyId,
    votes: formattedVotes,
  })

  revalidatePath(`/room/[roomId]`)
  return { success: true }
}

export async function resetVotes(storyId: string) {
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
    throw new Error("Only the host can reset votes")
  }

  // Update story to hide votes
  await prisma.story.update({
    where: {
      id: storyId,
      roomId,
    },
    data: {
      votesRevealed: false,
    },
  })

  // Delete all votes for the story
  await prisma.vote.deleteMany({
    where: {
      storyId,
    },
  })

  // Broadcast reset via Pusher
  await pusherServer.trigger(`presence-room-${roomId}`, "votes-reset", {
    storyId,
  })

  revalidatePath(`/room/[roomId]`)
  return { success: true }
}

export async function deleteStory(storyId: string) {
  const cookiesStore = await cookies()
  const roomId = cookiesStore.get("roomId")?.value
  const playerId = cookiesStore.get("playerId")?.value

  if (!roomId || !playerId) {
    throw new Error("Not authenticated")
  }

  // Check if player is host
  const player = await prisma.player.findUnique({
    where: { id: playerId, roomId },
  })
  if (!player?.isHost) {
    throw new Error("Only the host can delete stories")
  }

  // Delete the story and its votes
  await prisma.vote.deleteMany({ where: { storyId } })
  await prisma.story.delete({ where: { id: storyId, roomId } })

  // Broadcast story deletion via Pusher
  await pusherServer.trigger(`presence-room-${roomId}`, "story-deleted", { id: storyId })

  revalidatePath(`/room/[roomId]`)
  return { success: true }
}
