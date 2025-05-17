"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Eye, RotateCcw, Plus, Trash2, Settings, Info } from "lucide-react"
import { addStory, completeStory } from "@/app/actions/story-actions"
import { revealVotes, resetVotes } from "@/app/actions/story-actions"
import { updateDeck, updateCelebrationsEnabled, updateEmojisEnabled } from "@/app/actions/room-actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DEFAULT_DECKS, DeckType } from "@/types/card"
import type { Card as CardType, Deck } from "@/types/card"
import { DeckCard } from "@/app/components/room/card"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"

interface HostControlsProps {
  currentStoryId: string | null
  votesRevealed: boolean
  hasVotes: boolean
  allPlayersVoted: boolean
  storyStatus?: "idle" | "active" | "completed"
  currentDeckType: DeckType
  currentDeck: Deck
  celebrationsEnabled: boolean
  setCelebrationsEnabled: (enabled: boolean) => void
  emojisEnabled: boolean
  setEmojisEnabled: (enabled: boolean) => void
  deckTheme: string
}

// Add gradient theme presets and helpers
const gradientPresets = [
  { name: 'Minimalist Mode', value: 'bg-gradient-to-br from-gray-500 to-gray-700', from: '#6b7280', to: '#374151', category: 'dark' },
  { name: 'Estim8 Core', value: 'bg-gradient-to-br from-blue-500 to-purple-600', from: '#3b82f6', to: '#9333ea', category: 'bright' },
  { name: 'Pink Sunset', value: 'bg-gradient-to-br from-pink-400 to-rose-600', from: '#f472b6', to: '#e11d48', category: 'bright' },
  { name: 'Citrus Pop', value: 'bg-gradient-to-br from-yellow-400 to-orange-500', from: '#facc15', to: '#f97316', category: 'bright' },
  { name: 'Emerald Sky', value: 'bg-gradient-to-br from-green-400 to-teal-500', from: '#4ade80', to: '#14b8a6', category: 'bright' },
  { name: 'Cyberpunk', value: 'bg-gradient-to-br from-fuchsia-600 to-cyan-400', from: '#c026d3', to: '#22d3ee', category: 'bright' },
  { name: 'Ocean Fade', value: 'bg-gradient-to-br from-indigo-400 to-sky-500', from: '#818cf8', to: '#0ea5e9', category: 'bright' },
  { name: 'Aurora Green', value: 'bg-gradient-to-br from-[#00ff99] to-[#0066ff]', from: '#00ff99', to: '#0066ff', category: 'bright' },
  { name: 'Inferno', value: 'bg-gradient-to-br from-[#ff6b6b] to-[#ffa94d]', from: '#ff6b6b', to: '#ffa94d', category: 'bright' },
  { name: 'Neon Noir', value: 'bg-gradient-to-br from-[#1f005c] to-[#5b247a]', from: '#1f005c', to: '#5b247a', category: 'dark' },
  { name: 'Cotton Candy', value: 'bg-gradient-to-br from-[#f6d365] to-[#fda085]', from: '#f6d365', to: '#fda085', category: 'bright' },
  { name: 'Bubblegum Bolt', value: 'bg-gradient-to-br from-[#ec38bc] to-[#7303c0]', from: '#ec38bc', to: '#7303c0', category: 'dark' },
  { name: 'Midnight Ink', value: 'bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e]', from: '#0f0f1a', to: '#1a1a2e', category: 'dark' },
  { name: 'Charcoal Burn', value: 'bg-gradient-to-br from-[#2c2c2e] to-[#444]', from: '#2c2c2e', to: '#444', category: 'dark' },
  { name: 'Galaxy Fade', value: 'bg-gradient-to-br from-[#2d1b69] to-[#000]', from: '#2d1b69', to: '#000', category: 'dark' },
];
function getContrastYIQ(hex: string) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  const yiq = (r*299 + g*587 + b*114) / 1000
  return yiq >= 128 ? 'text-black' : 'text-white'
}

export default function HostControls({
  currentStoryId,
  votesRevealed,
  hasVotes,
  allPlayersVoted,
  storyStatus = "idle",
  currentDeckType,
  currentDeck,
  celebrationsEnabled,
  setCelebrationsEnabled,
  emojisEnabled,
  setEmojisEnabled,
  deckTheme,
}: HostControlsProps) {
  const [isAddingStory, setIsAddingStory] = useState(false)
  const [storyTitle, setStoryTitle] = useState("")
  const [storyDescription, setStoryDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeckDialogOpen, setIsDeckDialogOpen] = useState(false)
  const [deckType, setDeckType] = useState<DeckType>(currentDeckType)
  const [customDeck, setCustomDeck] = useState<Deck>(
    deckType === DeckType.CUSTOM ? currentDeck : DEFAULT_DECKS[DeckType.CUSTOM],
  )
  const [newCard, setNewCard] = useState<CardType>({ label: "" })
  const [isDeckSubmitting, setIsDeckSubmitting] = useState(false)
  const [showRevealConfirm, setShowRevealConfirm] = useState(false)

  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storyTitle.trim()) return

    setIsSubmitting(true)
    try {
      await addStory(storyTitle, storyDescription || null)
      setStoryTitle("")
      setStoryDescription("")
      setIsAddingStory(false)
    } catch (error) {
      console.error("Failed to add story:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRevealVotes = async () => {
    if (!currentStoryId) return

    try {
      await revealVotes(currentStoryId)
    } catch (error) {
      console.error("Failed to reveal votes:", error)
    }
  }

  const handleResetVotes = async () => {
    if (!currentStoryId) return

    try {
      await resetVotes(currentStoryId)
    } catch (error) {
      console.error("Failed to reset votes:", error)
    }
  }

  const handleCompleteStory = async () => {
    if (!currentStoryId) return

    try {
      await completeStory(currentStoryId)
    } catch (error) {
      console.error("Failed to complete story:", error)
    }
  }

  const handleDeckTypeChange = (value: string) => {
    const newDeckType = value as DeckType
    setDeckType(newDeckType)
    if (newDeckType !== DeckType.CUSTOM) {
      setCustomDeck(DEFAULT_DECKS[DeckType.CUSTOM])
    }
  }

  const handleAddCard = () => {
    if (!newCard.label) return
    setCustomDeck([...customDeck, { label: newCard.label }])
    setNewCard({ label: "" })
  }

  const handleRemoveCard = (index: number) => {
    const updatedDeck = [...customDeck]
    updatedDeck.splice(index, 1)
    setCustomDeck(updatedDeck)
  }

  const handleSaveDeck = async () => {
    setIsDeckSubmitting(true)
    try {
      await updateDeck(deckType, deckType === DeckType.CUSTOM ? customDeck : undefined)
      setIsDeckDialogOpen(false)
    } catch (error) {
      console.error("Failed to update deck:", error)
    } finally {
      setIsDeckSubmitting(false)
    }
  }

  const handleRevealVotesClick = () => {
    if (!currentStoryId || votesRevealed) return;
    if (!allPlayersVoted) {
      setShowRevealConfirm(true);
    } else {
      handleRevealVotes();
    }
  }

  const handleCelebrationToggle = async (checked: boolean) => {
    setCelebrationsEnabled(checked); // Optimistic update
    try {
      await updateCelebrationsEnabled(checked);
    } catch (error) {
      // Optionally revert on error
      setCelebrationsEnabled(!checked);
      // Optionally show a toast
      console.error("Failed to update celebration toggle:", error);
    }
  };

  const handleEmojisToggle = async (checked: boolean) => {
    setEmojisEnabled(checked); // Optimistic update
    try {
      await updateEmojisEnabled(checked);
    } catch (error) {
      setEmojisEnabled(!checked);
      // Optionally show a toast
      console.error("Failed to update emoji toggle:", error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      if (e.key === "r" && !e.shiftKey && currentStoryId && hasVotes) {
        if (votesRevealed) {
          handleResetVotes()
        } else {
          handleRevealVotes()
        }
      }
      if (e.key === "R" && e.shiftKey && currentStoryId && hasVotes) {
        handleResetVotes()
      }
      if (e.key === "n" && currentStoryId) {
        handleCompleteStory()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentStoryId, hasVotes, votesRevealed])

  const canRevealVotes = storyStatus === "active" && allPlayersVoted && !votesRevealed

  return (
    <Card className="section-card">
      <div className="panel-header">
        <Settings className="h-5 w-5 text-accent/80" />
        <h2 className="panel-title">Host Controls</h2>
      </div>
      <div className="mb-3" />
      <CardContent className="space-y-6">
        {/* Setup Section */}
        <div className="space-y-2">
          <Button
            variant="default"
            className="w-full gap-2 btn btn-primary text-base py-2"
            onClick={() => setIsDeckDialogOpen(true)}
            type="button"
          >
            <Settings className="h-4 w-4" />
            Customize Deck
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  className="w-full gap-2 btn text-base py-2"
                  onClick={votesRevealed ? handleResetVotes : handleRevealVotesClick}
                  disabled={!hasVotes && !votesRevealed}
                >
                  {votesRevealed ? (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      Reset Votes
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Reveal Votes
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              {!hasVotes && !votesRevealed && (
                <TooltipContent side="top" align="center">
                  No votes have been submitted yet.
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Session Preferences Section */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-8 gap-2">
            {/* Celebration Mode Toggle */}
            <div className="flex items-center justify-between gap-4 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-sm text-foreground whitespace-nowrap">Celebration Mode</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-pointer text-muted-foreground flex items-center"><Info className="w-3.5 h-3.5" /></span>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">
                      Show confetti and animated avatars when consensus is reached
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                checked={celebrationsEnabled}
                onCheckedChange={handleCelebrationToggle}
                id="celebration-animations-toggle"
              />
            </div>
            {/* Emoji Reactions Toggle */}
            <div className="flex items-center justify-between gap-4 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-sm text-foreground whitespace-nowrap">Emoji Reactions</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-pointer text-muted-foreground flex items-center"><Info className="w-3.5 h-3.5" /></span>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">
                      Allow emoji reactions for all users
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                checked={emojisEnabled}
                onCheckedChange={handleEmojisToggle}
                id="emoji-reactions-toggle"
              />
            </div>
          </div>
        </div>
      </CardContent>

      {/* Deck Dialog */}
      <Dialog open={isDeckDialogOpen} onOpenChange={setIsDeckDialogOpen}>
        <DialogTrigger asChild></DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customize Voting Deck</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="label-base">Deck Type</label>
              <Select value={deckType} onValueChange={handleDeckTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select deck type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DeckType.FIBONACCI}>Fibonacci</SelectItem>
                  <SelectItem value={DeckType.MODIFIED_FIBONACCI}>Modified Fibonacci</SelectItem>
                  <SelectItem value={DeckType.TSHIRT}>T-Shirt Sizes</SelectItem>
                  <SelectItem value={DeckType.POWERS_OF_TWO}>Powers of Two</SelectItem>
                  <SelectItem value={DeckType.SEQUENTIAL}>Sequential</SelectItem>
                  <SelectItem value={DeckType.SIMPLE_1_5}>Simple 1-5</SelectItem>
                  <SelectItem value={DeckType.RISK}>Risk Assessment</SelectItem>
                  <SelectItem value={DeckType.CUSTOM}>Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                {deckType === DeckType.CUSTOM && <TabsTrigger value="edit">Edit Cards</TabsTrigger>}
              </TabsList>
              <TabsContent value="preview" className="space-y-4">
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-4">
                  {((deckType === DeckType.CUSTOM ? customDeck : DEFAULT_DECKS[deckType]) || []).map((card, index) => {
                    const themeClass = deckTheme + ' ' + getContrastYIQ((gradientPresets.find(g => g.value === deckTheme)?.from || '#fff'));
                    return (
                      <DeckCard key={index} label={card.label} selected={false} onClick={() => {}} className={themeClass} />
                    );
                  })}
                </div>
              </TabsContent>
              {deckType === DeckType.CUSTOM && (
                <TabsContent value="edit" className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="label-base">Label</label>
                        <Input
                          value={newCard.label}
                          onChange={(e) => setNewCard({ label: e.target.value })}
                          placeholder="e.g. 1, XS, Low"
                        />
                      </div>
                    </div>
                    <Button variant="default" onClick={handleAddCard} disabled={!newCard.label} type="button" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Card
                    </Button>
                  </div>
                  <div className="card-base p-4">
                    <h3 className="font-medium mb-2">Current Cards</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {customDeck.map((card, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                          <span>{card.label}</span>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveCard(index)} type="button">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      {customDeck.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No cards added yet. Add some cards above.
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={() => setIsDeckDialogOpen(false)} type="button">
                Cancel
              </Button>
              <Button variant="default" onClick={handleSaveDeck} disabled={isDeckSubmitting} type="button">
                {isDeckSubmitting ? "Saving..." : "Save Deck"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
