"use client"

import { useState, useEffect } from "react"
import { usePusherContext } from "@/app/context/pusher-context"
import RoomHeader from "@/app/components/room/room-header"
import VotingPanel from "@/app/components/room/voting-panel"
import CurrentStory from "@/app/components/room/current-story"
import PlayersPanel from "@/app/components/room/players-panel"
import HostControls from "@/app/components/room/host-controls"
import StoriesPanel from "@/app/components/room/stories-panel"
import { Separator } from "@/components/ui/separator"
import { WelcomeMessage } from "@/app/components/room/welcome-message"
import { CurrentStoryProvider } from "@/app/context/current-story-context"
import { PusherProvider } from "@/app/context/pusher-context"
import { HistoryPanel } from "@/app/components/room/history-panel"
import { useCurrentStory } from "@/app/context/current-story-context"

export default function RoomClient({ roomData }: { roomData: any }) {
  return (
    <PusherProvider roomId={roomData.id}>
      <CurrentStoryProvider initialStory={roomData.currentStory}>
        <RoomClientInner roomData={roomData} />
      </CurrentStoryProvider>
    </PusherProvider>
  )
}

// New inner component that uses the context
function RoomClientInner({ roomData }: { roomData: any }) {
  const { channel } = usePusherContext()
  const { currentStory, setCurrentStory } = useCurrentStory()
  const [localVotes, setLocalVotes] = useState<{ playerId: string; playerName: string; value: string }[]>([])

  // Log the roomId before rendering PusherProvider
  console.log('Rendering PusherProvider with roomId:', roomData.id);

  // Keep localVotes in sync with initial data and handle real-time updates
  useEffect(() => {
    // Map currentVotes to include playerName
    const votesWithNames = (roomData.currentVotes || []).map((v: any) => {
      if (v.playerName) return v;
      const player = roomData.players.find((p: any) => p.id === v.playerId);
      return { ...v, playerName: player ? player.name : "" };
    });
    console.log('[ROOMCLIENT] Initializing votes from roomData:', votesWithNames);
    setLocalVotes(votesWithNames);
  }, [roomData.currentVotes, roomData.players]);

  // Listen for real-time vote submissions and story changes
  useEffect(() => {
    if (!channel) {
      console.log('[ROOMCLIENT] No channel available yet');
      return;
    }

    console.log('[ROOMCLIENT] Setting up vote handlers for channel:', channel.name);

    const handleVoteSubmitted = (data: any) => {
      console.log('[ROOMCLIENT] vote-submitted event received:', data);
      const player = roomData.players.find((p: any) => p.id === data.playerId);
      const playerName = player ? player.name : "";
      setLocalVotes((prev: any[]) => {
        // Replace or add the vote for this player
        const otherVotes = prev.filter(v => v.playerId !== data.playerId);
        const newVotes = [...otherVotes, { playerId: data.playerId, playerName, value: data.value }];
        console.log('[ROOMCLIENT] Updated localVotes:', newVotes);
        return newVotes;
      });
    }

    const handleActiveStoryChanged = (data: any) => {
      console.log('[ROOMCLIENT] active-story-changed event received:', data);
      setCurrentStory({
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        votesRevealed: data.votesRevealed ?? false,
      });
      // Reset votes when story changes
      setLocalVotes([]);
    }

    // Bind to events using the channel directly
    const bindEvents = () => {
      console.log('[ROOMCLIENT] Binding events to channel:', channel.name);
      channel.bind("vote-submitted", handleVoteSubmitted);
      channel.bind("active-story-changed", handleActiveStoryChanged);
    };

    // Bind to subscription success
    const handleSubscriptionSucceeded = () => {
      console.log('[ROOMCLIENT] Channel subscription succeeded');
      bindEvents();
    };

    // Bind to subscription error
    const handleSubscriptionError = (error: any) => {
      console.error('[ROOMCLIENT] Channel subscription error:', error);
    };

    // Set up event bindings
    channel.bind('pusher:subscription_succeeded', handleSubscriptionSucceeded);
    channel.bind('pusher:subscription_error', handleSubscriptionError);

    // If already subscribed, bind events immediately
    if (channel.subscribed) {
      console.log('[ROOMCLIENT] Channel already subscribed, binding events immediately');
      bindEvents();
    }

    return () => {
      console.log('[ROOMCLIENT] Unbinding vote handlers');
      channel.unbind("vote-submitted", handleVoteSubmitted);
      channel.unbind("active-story-changed", handleActiveStoryChanged);
      channel.unbind('pusher:subscription_succeeded', handleSubscriptionSucceeded);
      channel.unbind('pusher:subscription_error', handleSubscriptionError);
    }
  }, [channel, roomData.players, setCurrentStory]);

  // Calculate allPlayersVoted from real-time localVotes and players
  const allPlayersVoted =
    roomData.players.length > 0 &&
    roomData.players.every(
      (player: any) =>
        localVotes.some((vote: any) => vote.playerId === player.id)
    )

  console.log('[ROOMCLIENT] allPlayersVoted calculation:', {
    playerCount: roomData.players.length,
    voteCount: localVotes.length,
    players: roomData.players.map((p: any) => p.id),
    votes: localVotes.map((v: any) => v.playerId),
    allPlayersVoted
  });

  // Add a debug effect to monitor channel state
  useEffect(() => {
    if (!channel) return;
    console.log('[ROOMCLIENT] Channel state:', {
      name: channel.name,
      subscribed: channel.subscribed,
      subscriptionPending: channel.subscriptionPending,
      bindings: channel.bindings
    });
  }, [channel]);

  useEffect(() => {
    if (!channel) return;
    console.log('[ROOMCLIENT] Binding votes-revealed to channel:', channel.name);

    const handleVotesRevealed = (data: any) => {
      console.log('[ROOMCLIENT] votes-revealed handler called', data);
      setCurrentStory((prev: any) => {
        console.log('[ROOMCLIENT] setCurrentStory called, prev:', prev);
        if (!prev) return prev;
        return { ...prev, votesRevealed: true };
      });
      if (Array.isArray(data.votes)) {
        const votesWithNames = data.votes.map((v: any) => {
          if (v.playerName) return v;
          const player = roomData.players.find((p: any) => p.id === v.playerId);
          return { ...v, playerName: player ? player.name : "" };
        });
        setLocalVotes(votesWithNames);
      }
    };

    // Bind immediately when channel is available
    channel.bind('votes-revealed', handleVotesRevealed);

    return () => {
      channel.unbind('votes-revealed', handleVotesRevealed);
    };
  }, [channel, roomData.players, setCurrentStory]);

  useEffect(() => {
    if (!channel) return

    const handleStoryCompleted = (data: any) => {
      setLocalVotes([])
      setCurrentStory((prev: any) => prev ? { ...prev, votesRevealed: false } : prev);
      // Optionally update currentStory/status here if needed
    }

    channel.bind("story-completed", handleStoryCompleted)
    return () => channel.unbind("story-completed", handleStoryCompleted)
  }, [channel, setCurrentStory])

  useEffect(() => {
    if (!channel) return;

    const handleVotesReset = () => {
      setLocalVotes([] as { playerId: string; playerName: string; value: string }[]);
      setCurrentStory((prev: any) => prev ? { ...prev, votesRevealed: false } : prev);
    };

    channel.bind("votes-reset", handleVotesReset);
    return () => channel.unbind("votes-reset", handleVotesReset);
  }, [channel, setCurrentStory]);

  // 1. Filter completed stories from roomData.stories
  const completedStories = roomData.stories.filter(
    (story: any) => story.status === "completed" || story.completed
  )

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <WelcomeMessage isHost={roomData.isHost} roomCode={roomData.code} />
      <RoomHeader roomCode={roomData.code} isHost={roomData.isHost} />

      <div className="flex-1 container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CurrentStory story={currentStory} isHost={roomData.isHost} />
          <Separator />
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <VotingPanel
                deck={roomData.deck}
                currentVote={roomData.currentUserVote}
                isHost={roomData.isHost}
                storyId={currentStory?.id}
                votes={localVotes}
                players={roomData.players}
                roomData={roomData}
              />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <StoriesPanel stories={roomData.stories} isHost={roomData.isHost} />
          <PlayersPanel
            players={roomData.players}
            hostId={roomData.hostId}
            currentPlayerId={roomData.currentPlayerId}
            votesRevealed={currentStory?.votesRevealed} // <-- real-time state
            deck={roomData.deck}
          />
          {roomData.isHost && (
            <>
              <HostControls
                currentStoryId={roomData.currentStory?.id}
                votesRevealed={roomData.votesRevealed}
                hasVotes={roomData.currentVotes.length > 0}
                allPlayersVoted={allPlayersVoted}
                storyStatus={roomData.currentStory?.status}
              />
            </>
          )}
          <HistoryPanel completedStories={completedStories} />
        </div>
      </div>
    </div>
  )
}