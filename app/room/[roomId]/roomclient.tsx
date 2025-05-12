"use client"

import { useState, useEffect, useCallback } from "react"
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

  const handleVoteRemoved = useCallback(
    (data: { playerId: string; storyId: string }) => {
      console.log('[RoomClient] Received vote-removed event:', data);
      setLocalVotes((prev) => {
        const newVotes = prev.filter(
          (vote) => vote.playerId !== data.playerId
        );
        console.log('[RoomClient] Updated localVotes:', newVotes);
        return newVotes;
      });
    },
    []
  );

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
      channel.bind("vote-removed", handleVoteRemoved);
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
      channel.unbind("vote-removed", handleVoteRemoved);
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
      console.log('[ROOMCLIENT] Story completed event received:', data);
      
      // Clear votes
      setLocalVotes([]);
      
      // Force reset current story to null 
      setCurrentStory(null);
      
      // Additional check to verify the story was cleared
      setTimeout(() => {
        console.log('[ROOMCLIENT] Current story after completion:', { currentStory });
      }, 100);
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

  // Use completedStories from roomData which already has votes included
  const completedStories = roomData.completedStories || []

  const removeVote = async (storyId: string) => {
    console.log('[RoomClient] removeVote called with storyId:', storyId);
    try {
      const response = await fetch(`/api/rooms/${roomData.id}/votes`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove vote');
      }

      const data = await response.json();
      console.log('[RoomClient] removeVote response:', data);
    } catch (error) {
      console.error('[RoomClient] Error removing vote:', error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <RoomHeader roomCode={roomData.code} isHost={roomData.isHost} />
      
      <main className="flex-1 flex justify-center">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-surface rounded-3xl p-6 shadow-xl">
            <WelcomeMessage isHost={roomData.isHost} roomCode={roomData.code} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 mb-4">
              {/* Left Column (2/3 width on large screens) */}
              <section className="lg:col-span-2 space-y-6">
                <CurrentStory story={currentStory} isHost={roomData.isHost} />
                <Separator />
                <VotingPanel
                  deck={roomData.deck}
                  currentVote={roomData.currentUserVote}
                  isHost={roomData.isHost}
                  storyId={currentStory?.id}
                  votes={localVotes}
                  players={roomData.players}
                  roomData={roomData}
                />
              </section>
              
              {/* Right Column (1/3 width on large screens) */}
              <aside className="space-y-6">
                <StoriesPanel stories={roomData.stories} isHost={roomData.isHost} />
                <PlayersPanel
                  players={roomData.players}
                  hostId={roomData.hostId}
                  currentPlayerId={roomData.currentPlayerId}
                  votesRevealed={currentStory?.votesRevealed}
                  deck={roomData.deck}
                />
                {roomData.isHost && (
                  <HostControls
                    currentStoryId={roomData.currentStory?.id}
                    votesRevealed={roomData.votesRevealed}
                    hasVotes={roomData.currentVotes.length > 0}
                    allPlayersVoted={allPlayersVoted}
                    storyStatus={roomData.currentStory?.status}
                    currentDeckType={roomData.deckType}
                    currentDeck={roomData.deck}
                  />
                )}
                <HistoryPanel completedStories={completedStories} />
              </aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}