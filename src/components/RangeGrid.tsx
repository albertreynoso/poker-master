import { useState } from 'react';
import { HAND_LABELS, HandMatrix, getHandColor, isPocketPair, isSuited, isBroadway } from '@/types/poker';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';

interface RangeGridProps {
  hands: HandMatrix;
  onChange: (hands: HandMatrix) => void;
}

export function RangeGrid({ hands, onChange }: RangeGridProps) {
  const [selectedHand, setSelectedHand] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleCellClick = (hand: string) => {
    setSelectedHand(hand);
  };

  const handleCellMouseDown = (hand: string) => {
    setIsSelecting(true);
    toggleHand(hand);
  };

  const handleCellMouseEnter = (hand: string) => {
    if (isSelecting) {
      toggleHand(hand);
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  const toggleHand = (hand: string) => {
    const currentWeight = hands[hand] || 0;
    const newWeight = currentWeight === 100 ? 0 : 100;
    onChange({ ...hands, [hand]: newWeight });
  };

  const handleWeightChange = (value: number[]) => {
    if (selectedHand) {
      onChange({ ...hands, [selectedHand]: value[0] });
    }
  };

  const selectAll = () => {
    const newHands: HandMatrix = {};
    HAND_LABELS.flat().forEach(hand => {
      newHands[hand] = 100;
    });
    onChange(newHands);
  };

  const selectPocketPairs = () => {
    const newHands = { ...hands };
    HAND_LABELS.flat().forEach(hand => {
      if (isPocketPair(hand)) {
        newHands[hand] = 100;
      }
    });
    onChange(newHands);
  };

  const selectBroadway = () => {
    const newHands = { ...hands };
    HAND_LABELS.flat().forEach(hand => {
      if (isBroadway(hand)) {
        newHands[hand] = 100;
      }
    });
    onChange(newHands);
  };

  const selectSuited = () => {
    const newHands = { ...hands };
    HAND_LABELS.flat().forEach(hand => {
      if (isSuited(hand)) {
        newHands[hand] = 100;
      }
    });
    onChange(newHands);
  };

  const clearAll = () => {
    onChange({});
  };

  return (
    <div className="space-y-4" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="grid grid-cols-13 gap-1 select-none">
        {HAND_LABELS.map((row, rowIndex) => (
          row.map((hand, colIndex) => {
            const weight = hands[hand] || 0;
            const isSelected = selectedHand === hand;
            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={cn(
                  "aspect-square flex items-center justify-center text-xs font-semibold transition-all border",
                  getHandColor(hand, weight),
                  isSelected && "ring-2 ring-primary ring-offset-2",
                  weight > 0 ? "border-foreground/20" : "border-border"
                )}
                onClick={() => handleCellClick(hand)}
                onMouseDown={() => handleCellMouseDown(hand)}
                onMouseEnter={() => handleCellMouseEnter(hand)}
              >
                <span className="text-foreground">{hand}</span>
              </button>
            );
          })
        ))}
      </div>

      {selectedHand && (
        <div className="p-4 border rounded-lg bg-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">{selectedHand}</span>
            <span className="text-sm text-muted-foreground">
              Weight: {hands[selectedHand] || 0}%
            </span>
          </div>
          <Slider
            value={[hands[selectedHand] || 0]}
            onValueChange={handleWeightChange}
            max={100}
            step={5}
            className="w-full"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={selectAll} variant="default" size="sm">
          All
        </Button>
        <Button onClick={selectPocketPairs} variant="secondary" size="sm">
          Pocket
        </Button>
        <Button onClick={selectBroadway} variant="secondary" size="sm">
          Broadway
        </Button>
        <Button onClick={selectSuited} variant="secondary" size="sm">
          Suited
        </Button>
        <Button onClick={clearAll} variant="destructive" size="sm">
          Clear
        </Button>
      </div>
    </div>
  );
}
