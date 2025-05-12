"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Eye, EyeOff, SkipForward, RotateCcw, Plus, Trash2, Settings } from "lucide-react"
import { addStory, completeStory } from "@/app/actions/story-actions"
import { revealVotes, resetVotes } from "@/app/actions/story-actions"
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog"
import { updateRoomSettings, updateDeck } from "@/app/actions/room-actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DEFAULT_DECKS, DeckType } from "@/types/card"
import type { Card as CardType, Deck } from "@/types/card"
import { DeckCard } from "@/app/components/room/card"

interface HostControlsProps {
  currentStoryId: string | null
  votesRevealed: boolean
  hasVotes: boolean
  allPlayersVoted: boolean
  storyStatus?: "idle" | "active" | "completed"
  currentDeckType: DeckType
  currentDeck: Deck
}

export default function HostControls({
  currentStoryId,
  votesRevealed,
  hasVotes,
  allPlayersVoted,
  storyStatus = "idle",
  currentDeckType,
  currentDeck,
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
      <div className="flex items-center gap-2 py-3 px-4 border-b border-border bg-muted/40 rounded-t-2xl">
        <Settings className="h-5 w-5 text-accent/80" />
        <h2 className="text-lg font-bold text-muted-foreground tracking-tight">Host Controls</h2>
      </div>
      <div className="mb-3" />
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pl-0.5">
            Manage Session
          </div>
          <Dialog open={isAddingStory} onOpenChange={setIsAddingStory}>
            <DialogTrigger asChild>
              <button
                className="w-full bg-gradient-to-r from-accent to-accent-hover text-white font-semibold py-2 rounded-lg shadow hover:shadow-lg transition-all duration-150 hover:from-accent-hover hover:to-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                type="button"
              >
                <PlusCircle className="h-4 w-4 mr-2 inline" />
                Add Story
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Story</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddStory} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Input
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    placeholder="Story title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Textarea
                    value={storyDescription}
                    onChange={(e) => setStoryDescription(e.target.value)}
                    placeholder="Story description (optional)"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Story"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <div className="my-3 border-b border-border opacity-30" />
          <div className="space-y-2">
            {(votesRevealed || allPlayersVoted) && (
              <button
                className={
                  `w-full bg-muted border border-border text-foreground font-medium py-2 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/30 flex items-center justify-center gap-2 ` +
                  (votesRevealed ? 'hover:bg-muted/80' : '')
                }
                onClick={votesRevealed ? handleResetVotes : handleRevealVotes}
                type="button"
              >
                {votesRevealed ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2 inline" />
                    Reset Votes
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2 inline" />
                    Reveal Votes
                  </>
                )}
              </button>
            )}
            <button
              className="w-full bg-secondary/20 border border-secondary text-secondary font-medium py-2 rounded-lg hover:bg-secondary/30 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-secondary/30"
              onClick={handleCompleteStory}
              disabled={!currentStoryId}
              type="button"
            >
              <SkipForward className="h-4 w-4 mr-2 inline" />
              Complete Story
            </button>
            <button
              className="w-full bg-secondary/10 border border-secondary text-secondary font-medium py-2 rounded-lg hover:bg-secondary/20 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-secondary/30"
              onClick={() => setIsDeckDialogOpen(true)}
              type="button"
            >
              <Settings className="h-4 w-4 mr-2 inline" />
              Customize Deck
            </button>
          </div>
        </div>
        <div className="my-3 border-b border-border opacity-30" />
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
                    {((deckType === DeckType.CUSTOM ? customDeck : DEFAULT_DECKS[deckType]) || []).map((card, index) => (
                      <DeckCard key={index} label={card.label} selected={false} onClick={() => {}} />
                    ))}
                    {(!customDeck && deckType === DeckType.CUSTOM) && (
                      <div className="col-span-full text-red-500 text-sm">
                        Warning: customDeck is undefined.
                      </div>
                    )}
                    {(!DEFAULT_DECKS[deckType] && deckType !== DeckType.CUSTOM) && (
                      <div className="col-span-full text-red-500 text-sm">
                        Warning: DEFAULT_DECKS[deckType] is undefined for deckType: {String(deckType)}
                      </div>
                    )}
                  </div>
                </TabsContent>
                {deckType === DeckType.CUSTOM &&
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
                      <button className="btn btn-primary" onClick={handleAddCard} disabled={!newCard.label} type="button">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Card
                      </button>
                    </div>
                    <div className="card-base p-4">
                      <h3 className="font-medium mb-2">Current Cards</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {customDeck.map((card, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                              <span>{card.label}</span>
                            <button className="btn btn-ghost" onClick={() => handleRemoveCard(index)} type="button">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </button>
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
                }
              </Tabs>
              <div className="flex justify-end gap-2 pt-4">
                <button className="btn btn-secondary" onClick={() => setIsDeckDialogOpen(false)} type="button">
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveDeck} disabled={isDeckSubmitting} type="button">
                  {isDeckSubmitting ? "Saving..." : "Save Deck"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
