import { useState } from 'react';
import { Card as CardType, RANKS, SUITS } from '@/types/training';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Shuffle } from 'lucide-react';

interface FlopSelectorProps {
  selectedCards: (CardType | null)[];
  onCardSelect: (card: CardType, position: number) => void;
  onClear: () => void;
  onRandomFlop: () => void;
}

export function FlopSelector({ selectedCards, onCardSelect, onClear, onRandomFlop }: FlopSelectorProps) {
  const [selectingPosition, setSelectingPosition] = useState<number | null>(null);

  const getSuitColor = (suit: string) => {
    return suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-foreground';
  };

  const isCardSelected = (rank: string, suit: string) => {
    return selectedCards.some((card) => card?.rank === rank && card?.suit === suit);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Flop Selector</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRandomFlop}>
            <Shuffle className="h-4 w-4 mr-2" />
            Random
          </Button>
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        {[0, 1, 2].map((position) => (
          <div
            key={position}
            onClick={() => setSelectingPosition(position)}
            className={cn(
              "w-24 h-32 border-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors",
              selectingPosition === position ? "border-primary bg-accent" : "border-border hover:border-muted-foreground",
              selectedCards[position] && "bg-card"
            )}
          >
            {selectedCards[position] ? (
              <div className="text-center">
                <div className={cn("text-4xl font-bold", getSuitColor(selectedCards[position]!.suit))}>
                  {selectedCards[position]!.rank}
                </div>
                <div className={cn("text-3xl", getSuitColor(selectedCards[position]!.suit))}>
                  {selectedCards[position]!.suit}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">Card {position + 1}</span>
            )}
          </div>
        ))}
      </div>

      {selectingPosition !== null && (
        <div className="p-4 border rounded-lg bg-card space-y-3">
          <p className="text-sm text-muted-foreground">Select card for position {selectingPosition + 1}</p>
          {SUITS.map((suit) => (
            <div key={suit} className="flex gap-2 flex-wrap">
              {RANKS.map((rank) => (
                <Button
                  key={`${rank}${suit}`}
                  variant="outline"
                  size="sm"
                  disabled={isCardSelected(rank, suit)}
                  onClick={() => {
                    onCardSelect({ rank, suit }, selectingPosition);
                    setSelectingPosition(null);
                  }}
                  className={cn(
                    "w-12 h-12",
                    getSuitColor(suit),
                    isCardSelected(rank, suit) && "opacity-30"
                  )}
                >
                  <span className="text-lg font-bold">{rank}{suit}</span>
                </Button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
