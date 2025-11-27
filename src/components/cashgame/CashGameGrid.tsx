import { useState } from 'react';
import { HAND_LABELS } from '@/types/poker';
import { CashHandMatrix, HandAction, CashAction, getActionColor } from '@/types/cashGame';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CashGameGridProps {
  hands: CashHandMatrix;
  onChange: (hands: CashHandMatrix) => void;
  availableActions: CashAction[];
}

export function CashGameGrid({ hands, onChange, availableActions }: CashGameGridProps) {
  const [selectedHand, setSelectedHand] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<CashAction>(availableActions[0]);

  const handleCellClick = (hand: string) => {
    setSelectedHand(hand);
  };

  const addActionToHand = (hand: string, action: CashAction, percentage: number) => {
    const newHands = { ...hands };
    if (!newHands[hand]) {
      newHands[hand] = [];
    }
    
    const existingIndex = newHands[hand].findIndex(a => a.action === action);
    if (existingIndex >= 0) {
      newHands[hand][existingIndex].percentage = percentage;
    } else {
      newHands[hand].push({ action, percentage });
    }
    
    // Remove if percentage is 0
    if (percentage === 0) {
      newHands[hand] = newHands[hand].filter(a => a.action !== action);
    }
    
    onChange(newHands);
  };

  const getHandDisplay = (hand: string): string => {
    const actions = hands[hand] || [];
    if (actions.length === 0) return '';
    
    const totalPercentage = actions.reduce((sum, a) => sum + a.percentage, 0);
    return `${totalPercentage}%`;
  };

  const getHandColor = (hand: string): string => {
    const actions = hands[hand] || [];
    if (actions.length === 0) return 'bg-muted/20';
    
    // Use the color of the primary action (highest percentage)
    const primaryAction = actions.reduce((max, a) => 
      a.percentage > max.percentage ? a : max
    );
    
    return getActionColor(primaryAction.action);
  };

  const clearAll = () => {
    onChange({});
    setSelectedHand(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {availableActions.map((action) => (
          <Button
            key={action}
            variant={currentAction === action ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentAction(action)}
            className="text-xs"
          >
            {action}
          </Button>
        ))}
        <Button variant="destructive" size="sm" onClick={clearAll}>
          Clear All
        </Button>
      </div>

      <div className="grid grid-cols-13 gap-0.5 bg-border p-1 rounded-lg">
        {HAND_LABELS.map((row, rowIndex) => 
          row.map((hand, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleCellClick(hand)}
              className={cn(
                "aspect-square text-[10px] font-medium rounded transition-all hover:scale-105",
                "flex flex-col items-center justify-center",
                getHandColor(hand),
                selectedHand === hand && "ring-2 ring-primary"
              )}
            >
              <span className="text-foreground">{hand}</span>
              <span className="text-[8px] text-foreground/80">{getHandDisplay(hand)}</span>
            </button>
          ))
        )}
      </div>

      {selectedHand && (
        <div className="p-4 border rounded-lg bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Edit {selectedHand}</h3>
            <Button variant="ghost" size="sm" onClick={() => setSelectedHand(null)}>
              Close
            </Button>
          </div>

          {availableActions.map((action) => {
            const currentValue = hands[selectedHand]?.find(a => a.action === action)?.percentage || 0;
            
            return (
              <div key={action} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className={getActionColor(action)}>{action}</Badge>
                  <span className="text-sm font-medium text-foreground">{currentValue}%</span>
                </div>
                <Slider
                  value={[currentValue]}
                  onValueChange={([value]) => addActionToHand(selectedHand, action, value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            );
          })}

          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Total: {hands[selectedHand]?.reduce((sum, a) => sum + a.percentage, 0) || 0}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
