"use client";

import React from "react";
import { DeckCard } from "@/app/components/room/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

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
  disabled?: boolean;
  deckTheme: string;
  gradientPresets: any[];
  getContrastYIQ: (hex: string) => 'text-black' | 'text-white';
}

const CardGrid: React.FC<CardGridProps> = ({
  deck,
  selectedCard,
  setSelectedCard,
  isVoting,
  storyId,
  handleVote,
  handleCardKeyDown,
  disabled = false,
  deckTheme,
  gradientPresets,
  getContrastYIQ,
}) => {
  if (!deck || deck.length === 0) return null;
  return (
    <Carousel className="w-full max-w-xs sm:hidden mx-auto" opts={{ align: "center", loop: true }}>
      <CarouselContent className="-ml-2">
        {deck.map((card, idx) => {
          const isSelected = selectedCard === card.label;
          const themeClass = deckTheme
            ? deckTheme + ' ' + getContrastYIQ((gradientPresets.find(g => g.value === deckTheme)?.from || '#fff'))
            : '';
          return (
            <CarouselItem key={card.label} className="min-w-0 shrink-0 grow-0 basis-[60%] pl-2 flex justify-center items-center">
              <DeckCard
                label={card.label}
                selected={isSelected}
                disabled={isVoting || !storyId || disabled}
                onClick={() => {
                  handleVote(card.label);
                }}
                tabIndex={0}
                onKeyDown={(e) => handleCardKeyDown(e, idx)}
                className={`w-44 h-64 transition-all duration-300 ${themeClass}`}
              />
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious className="left-[-8px]" />
      <CarouselNext className="right-[-8px]" />
    </Carousel>
  );
};

export default CardGrid; 