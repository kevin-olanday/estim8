"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Eye, RotateCcw, Plus, Trash2, Settings } from "lucide-react"
import { addStory, completeStory } from "@/app/actions/story-actions"
import { revealVotes, resetVotes } from "@/app/actions/story-actions"
import { updateDeck } from "@/app/actions/room-actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DEFAULT_DECKS, DeckType } from "@/types/card"
import type { Card as CardType, Deck } from "@/types/card"
import { DeckCard } from "@/app/components/room/card"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

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
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pl-0.5">
            Manage Session
          </div>
          <div className="panel-divider" />
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2"
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
            {showRevealConfirm && (
              <Dialog open={showRevealConfirm} onOpenChange={setShowRevealConfirm}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reveal Votes Early?</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 text-base text-muted-foreground">
                    Some players haven't voted yet. Are you sure you want to reveal the votes?
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" onClick={() => setShowRevealConfirm(false)} type="button">
                      Cancel
                    </Button>
                    <Button variant="default" onClick={() => { setShowRevealConfirm(false); handleRevealVotes(); }} type="button">
                      Reveal Anyway
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button
              size="sm"
              variant="secondary"
              className="w-full gap-2"
              onClick={() => setIsDeckDialogOpen(true)}
              type="button"
            >
              <Settings className="h-4 w-4" />
              Customize Deck
            </Button>
          </div>
        </div>
        <div className="panel-divider" />
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
                }
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
      </CardContent>
    </Card>
  )
}
