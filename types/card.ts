export interface Card {
  label: string
  emoji?: string
  color?: string
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
}

export const DEFAULT_DECKS: Record<DeckType, Deck> = {
  [DeckType.FIBONACCI]: [
    { label: "1", emoji: "1️⃣", color: "#E6F7FF" },
    { label: "2", emoji: "2️⃣", color: "#BAE7FF" },
    { label: "3", emoji: "3️⃣", color: "#91D5FF" },
    { label: "5", emoji: "5️⃣", color: "#69C0FF" },
    { label: "8", emoji: "8️⃣", color: "#40A9FF" },
    { label: "13", emoji: "🔢", color: "#1890FF" },
    { label: "21", emoji: "📈", color: "#096DD9" },
    { label: "?", emoji: "❓", color: "#F5F5F5" },
  ],
  [DeckType.MODIFIED_FIBONACCI]: [
    { label: "0", emoji: "0️⃣", color: "#F0F5FF" },
    { label: "½", emoji: "🔹", color: "#D6E4FF" },
    { label: "1", emoji: "1️⃣", color: "#ADC6FF" },
    { label: "2", emoji: "2️⃣", color: "#85A5FF" },
    { label: "3", emoji: "3️⃣", color: "#597EF7" },
    { label: "5", emoji: "5️⃣", color: "#2F54EB" },
    { label: "8", emoji: "8️⃣", color: "#1D39C4" },
    { label: "13", emoji: "🔢", color: "#10239E" },
    { label: "20", emoji: "📊", color: "#061178" },
    { label: "40", emoji: "📈", color: "#030852" },
    { label: "100", emoji: "💯", color: "#02052C" },
    { label: "?", emoji: "❓", color: "#F5F5F5" },
  ],
  [DeckType.TSHIRT]: [
    { label: "XS", emoji: "👕", color: "#FFF0F6" },
    { label: "S", emoji: "👕", color: "#FFD6E7" },
    { label: "M", emoji: "👕", color: "#FFADD2" },
    { label: "L", emoji: "👕", color: "#FF85C0" },
    { label: "XL", emoji: "👕", color: "#F759AB" },
    { label: "XXL", emoji: "👕", color: "#EB2F96" },
    { label: "?", emoji: "❓", color: "#F5F5F5" },
  ],
  [DeckType.POWERS_OF_TWO]: [
    { label: "1", emoji: "1️⃣", color: "#F6FFED" },
    { label: "2", emoji: "2️⃣", color: "#D9F7BE" },
    { label: "4", emoji: "4️⃣", color: "#B7EB8F" },
    { label: "8", emoji: "8️⃣", color: "#95DE64" },
    { label: "16", emoji: "🔢", color: "#73D13D" },
    { label: "32", emoji: "📊", color: "#52C41A" },
    { label: "64", emoji: "📈", color: "#389E0D" },
    { label: "?", emoji: "❓", color: "#F5F5F5" },
  ],
  [DeckType.SEQUENTIAL]: [
    { label: "1", emoji: "1️⃣", color: "#FFF7E6" },
    { label: "2", emoji: "2️⃣", color: "#FFE7BA" },
    { label: "3", emoji: "3️⃣", color: "#FFD591" },
    { label: "4", emoji: "4️⃣", color: "#FFC069" },
    { label: "5", emoji: "5️⃣", color: "#FFA940" },
    { label: "6", emoji: "6️⃣", color: "#FA8C16" },
    { label: "7", emoji: "7️⃣", color: "#D46B08" },
    { label: "8", emoji: "8️⃣", color: "#AD4E00" },
    { label: "9", emoji: "9️⃣", color: "#873800" },
    { label: "10", emoji: "🔟", color: "#612500" },
    { label: "?", emoji: "❓", color: "#F5F5F5" },
  ],
  [DeckType.RISK]: [
    { label: "Low", emoji: "🟢", color: "#E6FFFB" },
    { label: "Medium", emoji: "🟡", color: "#FFF1B8" },
    { label: "High", emoji: "🔴", color: "#FFA39E" },
    { label: "?", emoji: "❓", color: "#F5F5F5" },
  ],
  [DeckType.CUSTOM]: [
    { label: "1", emoji: "🧠", color: "#00FFAA" },
    { label: "2", emoji: "🔍", color: "#FF00AA" },
    { label: "3", emoji: "🚀", color: "#00AAFF" },
    { label: "5", emoji: "💎", color: "#FFAA00" },
    { label: "8", emoji: "🔥", color: "#AA00FF" },
    { label: "13", emoji: "⚡", color: "#AAFF00" },
    { label: "?", emoji: "❓", color: "#F5F5F5" },
  ],
}
