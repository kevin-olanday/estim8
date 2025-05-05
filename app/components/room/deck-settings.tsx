"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Plus, Trash2 } from "lucide-react"
import { updateDeck } from "@/app/actions/room-actions"
import { DEFAULT_DECKS, DeckType } from "@/types/card"
import type { Card as CardType, Deck } from "@/types/card"
import { Card as CardComponent } from "@/app/components/room/card"

interface DeckSettingsProps {
  currentDeckType: DeckType
  currentDeck: Deck
}

export default function DeckSettings({ currentDeckType, currentDeck }: DeckSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [deckType, setDeckType] = useState<DeckType>(currentDeckType)
  const [customDeck, setCustomDeck] = useState<Deck>(
    deckType === DeckType.CUSTOM ? currentDeck : DEFAULT_DECKS[DeckType.CUSTOM],
  )
  const [newCard, setNewCard] = useState<CardType>({ label: "", emoji: "", color: "#f5f5f5" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDeckTypeChange = (value: string) => {
    const newDeckType = value as DeckType
    setDeckType(newDeckType)

    if (newDeckType !== DeckType.CUSTOM) {
      // Reset custom deck when switching to a predefined deck
      setCustomDeck(DEFAULT_DECKS[DeckType.CUSTOM])
    }
  }

  const handleAddCard = () => {
    if (!newCard.label) return

    setCustomDeck([...customDeck, { ...newCard }])
    setNewCard({ label: "", emoji: "", color: "#f5f5f5" })
  }

  const handleRemoveCard = (index: number) => {
    const updatedDeck = [...customDeck]
    updatedDeck.splice(index, 1)
    setCustomDeck(updatedDeck)
  }

  const handleSaveDeck = async () => {
    setIsSubmitting(true)
    try {
      await updateDeck(deckType, deckType === DeckType.CUSTOM ? customDeck : undefined)
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to update deck:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Deck Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Customize Deck
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Customize Voting Deck</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Deck Type</label>
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
                    {(deckType === DeckType.CUSTOM ? customDeck : DEFAULT_DECKS[deckType]).map((card, index) => (
                      <CardComponent key={index} card={card} selected={false} onClick={() => {}} />
                    ))}
                  </div>
                </TabsContent>

                {deckType === DeckType.CUSTOM && (
                  <TabsContent value="edit" className="space-y-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium">Label</label>
                          <Input
                            value={newCard.label}
                            onChange={(e) => setNewCard({ ...newCard, label: e.target.value })}
                            placeholder="e.g. 1, XS, Low"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Emoji (optional)</label>
                          <Input
                            value={newCard.emoji || ""}
                            onChange={(e) => setNewCard({ ...newCard, emoji: e.target.value })}
                            placeholder="e.g. 🧠, 🚀"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Color</label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={newCard.color || "#f5f5f5"}
                              onChange={(e) => setNewCard({ ...newCard, color: e.target.value })}
                              className="w-12 p-1 h-10"
                            />
                            <Input
                              value={newCard.color || "#f5f5f5"}
                              onChange={(e) => setNewCard({ ...newCard, color: e.target.value })}
                              placeholder="#f5f5f5"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>

                      <Button onClick={handleAddCard} disabled={!newCard.label}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Card
                      </Button>
                    </div>

                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Current Cards</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {customDeck.map((card, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded flex items-center justify-center text-white"
                                style={{ backgroundColor: card.color || "#f5f5f5" }}
                              >
                                {card.emoji || card.label[0]}
                              </div>
                              <span>{card.label}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveCard(index)}>
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
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveDeck} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Deck"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
