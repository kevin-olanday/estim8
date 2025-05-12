"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import { useCurrentStory } from "@/app/context/current-story-context"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"

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
  const [localVotes, setLocalVotes] = useState<{ playerId: string; playerName: string; value: string; storyId: string }[]>([])
  const [localCompletedStories, setLocalCompletedStories] = useState(roomData.completedStories || [])
  const [emojis, setEmojis] = useState<{ id: number, emoji: string, sender?: string }[]>([])
  const emojiId = useRef(0)
  const EMOJI_LIMIT = 10
  const EMOJI_CHOICES = ["😂", "🎉", "👏", "😍", "👍", "🤩", "🔥"]

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
    // Map currentVotes to include playerName and avatar info
    const votesWithAvatars = (roomData.currentVotes || []).map((v: any) => {
      const player = roomData.players.find((p: any) => p.id === v.playerId);
      return {
        ...v,
        playerName: v.playerName || (player ? player.name : ""),
        avatarStyle: v.avatarStyle || (player ? player.avatarStyle : null),
        avatarSeed: v.avatarSeed || (player ? player.avatarSeed : null),
        storyId: v.storyId || "",
      };
    });
    console.log('[ROOMCLIENT] Initializing votes from roomData:', votesWithAvatars);
    setLocalVotes(votesWithAvatars);
  }, [roomData.currentVotes, roomData.players]);

  // Listen for real-time vote submissions and story changes
  useEffect(() => {
    if (!channel) {
      console.log('[ROOMCLIENT] No channel available yet');
      return;
    }

    console.log('[ROOMCLIENT] Setting up vote handlers for channel:', channel.name);

    const handleVoteSubmitted = (data: any) => {
      const player = roomData.players.find((p: any) => p.id === data.playerId);
      const playerName = player ? player.name : "";
      // Fallback to currentStory?.id if data.storyId is missing
      const sid = data.storyId || currentStory?.id || "";
      setLocalVotes((prev: any[]) => {
        const otherVotes = prev.filter(v => v.playerId !== data.playerId || v.storyId !== sid);
        const newVotes = [
          ...otherVotes,
          { playerId: data.playerId, playerName, value: data.value, storyId: sid }
        ];
        console.log('[RoomClient] Updated localVotes (vote-submitted):', newVotes);
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
      setCurrentStory((prev: any) => {
        if (!prev) return prev;
        return { ...prev, votesRevealed: true };
      });
      // Fallback to currentStory?.id if data.storyId is missing
      const sid = data.storyId || currentStory?.id || "";
      if (Array.isArray(data.votes)) {
        const votesWithAvatars = data.votes.map((v: any) => {
          const player = roomData.players.find((p: any) => p.id === v.playerId);
          return {
            ...v,
            playerName: v.playerName || (player ? player.name : ""),
            avatarStyle: v.avatarStyle || (player ? player.avatarStyle : null),
            avatarSeed: v.avatarSeed || (player ? player.avatarSeed : null),
            storyId: sid
          };
        });
        console.log('[RoomClient] Updated localVotes (votes-revealed):', votesWithAvatars);
        setLocalVotes(votesWithAvatars);
      }
    };

    // Bind immediately when channel is available
    channel.bind('votes-revealed', handleVotesRevealed);

    return () => {
      channel.unbind('votes-revealed', handleVotesRevealed);
    };
  }, [channel, roomData.players, setCurrentStory]);

  // Update local completed stories when roomData changes
  useEffect(() => {
    setLocalCompletedStories(roomData.completedStories || [])
  }, [roomData.completedStories])

  // Add story completed handler
  useEffect(() => {
    if (!channel) return

    const handleStoryCompleted = (data: any) => {
      console.log('[RoomClient] Story completed event received:', data)
      
      // Clear votes
      setLocalVotes([])
      
      // Force reset current story to null 
      setCurrentStory(null)

      // Update completed stories
      setLocalCompletedStories((prev: any[]) => {
        const storyToComplete = roomData.stories.find((s: any) => s.id === data.id)
        if (!storyToComplete) return prev

        const completedStory = {
          ...storyToComplete,
          completed: true,
          active: false,
          finalScore: data.finalScore,
          manualOverride: data.manualOverride,
          votes: data.votes || []
        }

        return [completedStory, ...prev]
      })
    }

    channel.bind("story-completed", handleStoryCompleted)
    return () => channel.unbind("story-completed", handleStoryCompleted)
  }, [channel, setCurrentStory, roomData.stories])

  useEffect(() => {
    if (!channel) return;

    const handleVotesReset = () => {
      setLocalVotes([] as { playerId: string; playerName: string; value: string; storyId: string }[]);
      setCurrentStory((prev: any) => prev ? { ...prev, votesRevealed: false } : prev);
    };

    channel.bind("votes-reset", handleVotesReset);
    return () => channel.unbind("votes-reset", handleVotesReset);
  }, [channel, setCurrentStory]);

  // Filter localVotes for the current story before passing to StoriesPanel
  const activeStoryId = currentStory?.id;
  const revealedVotes = localVotes.filter(v => v.storyId === activeStoryId);
  console.log('[RoomClient] localVotes:', localVotes);
  console.log('[RoomClient] activeStoryId:', activeStoryId);
  console.log('[RoomClient] revealedVotes:', revealedVotes);

  const getCurrentPlayerName = () => {
    const player = roomData.players.find((p: any) => p.id === roomData.currentPlayerId)
    return player ? player.name : ""
  }

  const sendEmoji = async (emoji?: string) => {
    if (emojis.length >= EMOJI_LIMIT) return
    const chosen = emoji || EMOJI_CHOICES[Math.floor(Math.random() * EMOJI_CHOICES.length)]
    const sender = getCurrentPlayerName()
    try {
      await axios.post("/api/emoji", { emoji: chosen, roomId: roomData.id, sender })
    } catch (e) {
      console.error("Failed to send emoji:", e)
    }
  }

  useEffect(() => {
    if (!channel) return
    const handleEmoji = (data: { emoji: string, sender?: string }) => {
      const id = emojiId.current++
      setEmojis((prev) => {
        if (prev.length >= EMOJI_LIMIT) return prev
        return [...prev, { id, emoji: data.emoji, sender: data.sender }]
      })
      setTimeout(() => {
        setEmojis((prev) => prev.filter((e) => e.id !== id))
      }, 2200)
    }
    channel.bind('emoji-sent', handleEmoji)
    return () => channel.unbind('emoji-sent', handleEmoji)
  }, [channel])

  return (
    <div className="flex flex-col min-h-screen">
      <RoomHeader 
        roomCode={roomData.code} 
        roomName={roomData.name} 
        isHost={roomData.isHost}
        hostName={roomData.players?.find((p: any) => p.isHost)?.name}
      />
      <EmojiOverlay emojis={emojis} />
      {/* Emoji Toolbox Panel */}
      <div className="fixed top-1/3 left-6 z-50 flex flex-col items-center gap-3 p-4 rounded-3xl border border-accent/30 shadow-2xl backdrop-blur-xl bg-gradient-to-b from-background/80 via-surface/80 to-background/60" style={{ minWidth: 72, boxShadow: '0 8px 32px 0 rgba(80,60,180,0.18), 0 1.5px 8px 0 rgba(80,60,180,0.10) inset', border: '1.5px solid var(--accent, #7c3aed)', background: 'linear-gradient(180deg, rgba(40,30,80,0.85) 0%, rgba(30,20,60,0.85) 100%)' }}>
        {EMOJI_CHOICES.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="w-12 h-12 flex items-center justify-center text-3xl rounded-full bg-accent/10 hover:bg-accent/30 border border-accent/20 shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/60 focus:ring-offset-2 focus:ring-offset-background hover:scale-110 active:scale-95"
            onClick={() => sendEmoji(emoji)}
            aria-label={`Send ${emoji}`}
            disabled={emojis.length >= EMOJI_LIMIT}
            style={{ opacity: emojis.length >= EMOJI_LIMIT ? 0.5 : 1, boxShadow: '0 2px 8px 0 rgba(124,58,237,0.10)' }}
          >
            {emoji}
          </button>
        ))}
      </div>
      <main className="flex-1 flex justify-center">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-surface rounded-3xl p-6 shadow-xl w-[80vw] max-w-7xl mx-auto">
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
                <StoriesPanel
                  stories={roomData.stories}
                  completedStories={localCompletedStories}
                  isHost={roomData.isHost}
                  revealedVotes={revealedVotes}
                />
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
              </aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function EmojiOverlay({ emojis }: { emojis: { id: number, emoji: string, sender?: string }[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {emojis.map(({ id, emoji, sender }) => (
        <motion.div
          key={id}
          initial={{ y: 80, opacity: 0, scale: 0.7, left: `${Math.random() * 80 + 10}%` }}
          animate={{ y: -window.innerHeight * 0.7, opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.2 }}
          transition={{ duration: 2.2, ease: "easeInOut" }}
          style={{ position: 'absolute', bottom: 0, fontSize: '2.5rem', left: `${Math.random() * 80 + 10}%`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <span>{emoji}</span>
          {sender && (
            <span
              className="mt-1 px-2 py-1 rounded-lg font-bold text-white text-sm shadow-lg border border-white/10"
              style={{
                background: 'rgba(124, 58, 237, 0.82)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                lineHeight: 1.1,
                marginTop: 6,
                letterSpacing: '0.01em',
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.18)',
                border: '1.5px solid rgba(255,255,255,0.08)',
                zIndex: 1,
              }}
            >
              {sender}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  )
}