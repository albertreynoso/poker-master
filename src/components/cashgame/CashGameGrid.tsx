import { useState } from 'react';
import { HAND_LABELS } from '@/types/poker';
import { CashHandMatrix, HandAction, CashAction, getActionColor } from '@/types/cashGame';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CashGameGridProps {
  hands: CashHandMatrix;
  onChange: (hands: CashHandMatrix) => void;
  availableActions: CashAction[];
  combinations: number;
  percentage: number;
  onSave: () => void;
}

export function CashGameGrid({ hands, onChange, availableActions, combinations, percentage, onSave }: CashGameGridProps) {
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
    <div className="flex gap-6">
      {/* Main Grid Area */}
      <div className="flex-1 space-y-4">
        {/* Action Legend */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-foreground mr-2">Actions:</span>
          {availableActions.map((action) => (
            <Badge key={action} className={cn(getActionColor(action), "text-xs")}>
              {action}
            </Badge>
          ))}
        </div>

        {/* 13x13 Grid */}
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
      </div>

      {/* Right Sidebar */}
      <div className="w-80 flex-shrink-0 space-y-4">
        {/* Action Selector */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 text-foreground">Select Action</h3>
          <div className="flex flex-col gap-2">
            {availableActions.map((action) => (
              <Button
                key={action}
                variant={currentAction === action ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentAction(action)}
                className="w-full justify-start"
              >
                <span className={cn("w-3 h-3 rounded-full mr-2", getActionColor(action))} />
                {action}
              </Button>
            ))}
            <Button variant="destructive" size="sm" onClick={clearAll} className="w-full mt-2">
              Clear All
            </Button>
          </div>
        </Card>

        {/* Combo Editor */}
        {selectedHand && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Edit {selectedHand}</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedHand(null)}>
                ×
              </Button>
            </div>

            <div className="space-y-3">
              {availableActions.map((action) => {
                const currentValue = hands[selectedHand]?.find(a => a.action === action)?.percentage || 0;
                
                return (
                  <div key={action} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">{action}</span>
                      <span className="text-xs font-semibold text-foreground">{currentValue}%</span>
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

              <div className="pt-2 border-t mt-3">
                <p className="text-xs text-muted-foreground">
                  Total: {hands[selectedHand]?.reduce((sum, a) => sum + a.percentage, 0) || 0}%
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Statistics */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 text-foreground">Statistics</h3>
          <div className="space-y-3">
            <div>
              <div className="text-2xl font-bold text-primary">{percentage}%</div>
              <div className="text-xs text-muted-foreground">Range Percentage</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{combinations}</div>
              <div className="text-xs text-muted-foreground">Total Combinations</div>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Button onClick={onSave} className="w-full" size="lg">
          Save Range
        </Button>
      </div>
    </div>
  );
}
