import React from "react";
import { DeckCard } from "@/app/components/room/card";

interface Card {
  label: string;
  [key: string]: any;
}

interface CardGridProps {
  deck: Card[];
  selectedCard: string | null;
  setSelectedCard: (card: string | null) => void;
  isVoting: boolean;
  storyId?: string;
  handleVote: (label: string) => void;
  handleCardKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => void;
}

const CardGrid: React.FC<CardGridProps> = ({
  deck,
  selectedCard,
  setSelectedCard,
  isVoting,
  storyId,
  handleVote,
  handleCardKeyDown,
}) => {
  if (!deck || deck.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2 justify-center justify-items-center sm:hidden">
      {deck.map((card, idx) => (
        <DeckCard
          key={card.label}
          label={card.label}
          selected={selectedCard === card.label}
          disabled={isVoting || !storyId}
          onClick={() => {
            if (selectedCard === card.label) {
              setSelectedCard(null);
            } else {
              handleVote(card.label);
            }
          }}
          tabIndex={0}
          onKeyDown={(e) => handleCardKeyDown(e, idx)}
        />
      ))}
    </div>
  );
};

export default CardGrid; 