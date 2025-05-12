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

  // Set all stories in the room to "idle"
  await prisma.story.updateMany({
    where: { roomId },
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

  // Calculate the final score based on votes
  let finalScore: number | null = null;
  
  if (votes.length > 0) {
    // Count votes by value
    const voteCounts: Record<string, number> = {};
    let numericVotes: number[] = [];
    
    // Gather vote data
    votes.forEach(vote => {
      const value = vote.choice;
      voteCounts[value] = (voteCounts[value] || 0) + 1;
      
      // Track numeric votes for average calculation if needed
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        numericVotes.push(numValue);
      }
    });
    
    // Find the most common vote
    let mostCommonValue = "";
    let highestCount = 0;
    
    Object.entries(voteCounts).forEach(([value, count]) => {
      if (count > highestCount) {
        mostCommonValue = value;
        highestCount = count;
      }
    });
    
    // If most common value is numeric, use it as final score
    const numericMostCommon = parseFloat(mostCommonValue);
    if (!isNaN(numericMostCommon)) {
      finalScore = numericMostCommon;
    } 
    // Otherwise calculate average of numeric votes as fallback
    else if (numericVotes.length > 0) {
      finalScore = numericVotes.reduce((sum, value) => sum + value, 0) / numericVotes.length;
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
      finalScore: finalScore,
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
