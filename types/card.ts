export interface Card {
  label: string
}

export type Deck = Card[]

export enum DeckType {
  FIBONACCI = "FIBONACCI",
  MODIFIED_FIBONACCI = "MODIFIED_FIBONACCI",
  TSHIRT = "TSHIRT",
  POWERS_OF_TWO = "POWERS_OF_TWO",
  SEQUENTIAL = "SEQUENTIAL",
  RISK = "RISK",
  CUSTOM = "CUSTOM",
  SIMPLE_1_5 = "SIMPLE_1_5",
}

export const DEFAULT_DECKS: Record<DeckType, Deck> = {
  [DeckType.FIBONACCI]: [
    { label: "1" },
    { label: "2" },
    { label: "3" },
    { label: "5" },
    { label: "8" },
    { label: "13" },
    { label: "21" },
    { label: "?" },
  ],
  [DeckType.MODIFIED_FIBONACCI]: [
    { label: "0" },
    { label: "½" },
    { label: "1" },
    { label: "2" },
    { label: "3" },
    { label: "5" },
    { label: "8" },
    { label: "13" },
    { label: "20" },
    { label: "40" },
    { label: "100" },
    { label: "?" },
  ],
  [DeckType.TSHIRT]: [
    { label: "XS" },
    { label: "S" },
    { label: "M" },
    { label: "L" },
    { label: "XL" },
    { label: "XXL" },
    { label: "?" },
  ],
  [DeckType.POWERS_OF_TWO]: [
    { label: "1" },
    { label: "2" },
    { label: "4" },
    { label: "8" },
    { label: "16" },
    { label: "32" },
    { label: "64" },
    { label: "?" },
  ],
  [DeckType.SEQUENTIAL]: [
    { label: "1" },
    { label: "2" },
    { label: "3" },
    { label: "4" },
    { label: "5" },
    { label: "6" },
    { label: "7" },
    { label: "8" },
    { label: "9" },
    { label: "10" },
    { label: "?" },
  ],
  [DeckType.RISK]: [
    { label: "Low" },
    { label: "Medium" },
    { label: "High" },
    { label: "?" },
  ],
  [DeckType.CUSTOM]: [
    { label: "1" },
    { label: "2" },
    { label: "3" },
    { label: "5" },
    { label: "8" },
    { label: "13" },
    { label: "?" },
  ],
  [DeckType.SIMPLE_1_5]: [
    { label: "1" },
    { label: "2" },
    { label: "3" },
    { label: "4" },
    { label: "5" },
    { label: "?" },
  ],
}
