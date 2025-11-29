import { useState } from 'react';
import { HAND_LABELS, isPocketPair, isSuited, isBroadway } from '@/types/poker';
import { CashHandMatrix, CashAction, getActionColor } from '@/types/cashGame';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CashGameGridProps {
  hands: CashHandMatrix;
  onChange: (hands: CashHandMatrix) => void;
  availableActions: CashAction[];
  isEditing?: boolean; // ← Agregar esta línea
}

export function CashGameGrid({ hands, onChange, availableActions }: CashGameGridProps) {
  const [selectedHand, setSelectedHand] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [currentAction, setCurrentAction] = useState<CashAction>(availableActions[0]);

  // ---------------------------------------
  // Hand interaction
  // ---------------------------------------

  const toggleHand = (hand: string) => {
    const current = hands[hand] || [];

    // si la acción actual ya existe al 100, la borra
    const exists = current.find(a => a.action === currentAction);
    const newValue = exists?.percentage === 100 ? 0 : 100;

    updateHandAction(hand, currentAction, newValue);
  };

  const updateHandAction = (hand: string, action: CashAction, percentage: number) => {
    const newHands = { ...hands };
    const actions = newHands[hand] ? [...newHands[hand]] : [];

    const idx = actions.findIndex(a => a.action === action);

    if (percentage === 0) {
      if (idx >= 0) actions.splice(idx, 1);
    } else {
      if (idx >= 0) actions[idx].percentage = percentage;
      else actions.push({ action, percentage });
    }

    newHands[hand] = actions;
    onChange(newHands);
  };

  const handleCellClick = (hand: string) => setSelectedHand(hand);

  const handleMouseDown = (hand: string) => {
    setIsSelecting(true);
    toggleHand(hand);
  };

  const handleMouseEnter = (hand: string) => {
    if (isSelecting) toggleHand(hand);
  };

  const handleMouseUp = () => setIsSelecting(false);

  // ---------------------------------------
  // Display & Coloring
  // ---------------------------------------

  const getTotalPercentage = (hand: string) => {
    return hands[hand]?.reduce((s, a) => s + a.percentage, 0) ?? 0;
  };

  const getPrimaryColor = (hand: string) => {
    const acts = hands[hand];
    if (!acts || acts.length === 0) return "bg-muted/20";

    const top = acts.reduce((max, a) => a.percentage > max.percentage ? a : max);
    return getActionColor(top.action);
  };

  // ---------------------------------------
  // Bulk Selectors
  // ---------------------------------------

  const clearAll = () => onChange({});

  const selectAll = () => {
    const newHands: CashHandMatrix = {};
    HAND_LABELS.flat().forEach(hand => {
      newHands[hand] = [{ action: currentAction, percentage: 100 }];
    });
    onChange(newHands);
  };

  const applyFilter = (filterFn: (hand: string) => boolean) => {
    const newHands = { ...hands };
    HAND_LABELS.flat().forEach(hand => {
      if (filterFn(hand)) {
        newHands[hand] = [{ action: currentAction, percentage: 100 }];
      }
    });
    onChange(newHands);
  };

  // ---------------------------------------

  return (
    <div className="h-full flex flex-col" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Matrix */}
      <div className="flex-1 grid grid-cols-13 gap-1 select-none" style={{ gridTemplateRows: 'repeat(13, 1fr)' }}>
        {HAND_LABELS.map((row, rowIndex) =>
          row.map((hand, colIndex) => {
            const total = getTotalPercentage(hand);
            const primaryColor = getPrimaryColor(hand);

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center text-[10px] font-medium transition-all border rounded",
                  primaryColor,
                  selectedHand === hand && "ring-2 ring-primary ring-offset-1",
                  total > 0 ? "border-foreground/20" : "border-border"
                )}
                onClick={() => handleCellClick(hand)}
                onMouseDown={() => handleMouseDown(hand)}
                onMouseEnter={() => handleMouseEnter(hand)}
              >
                <span>{hand}</span>
                <span className="text-[8px] opacity-80">{total}%</span>
              </button>
            );
          })
        )}
      </div>

      {/* Editor Panel */}
      {selectedHand && (
        <div className="p-4 border rounded-lg bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{selectedHand}</h3>
            <Button variant="ghost" size="sm" onClick={() => setSelectedHand(null)}>Close</Button>
          </div>

          {(hands[selectedHand] || []).map(act => (
            <div key={act.action} className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge className={getActionColor(act.action)}>{act.action}</Badge>
                <span>{act.percentage}%</span>
              </div>
              <Slider
                value={[act.percentage]}
                max={100}
                step={5}
                onValueChange={([v]) => updateHandAction(selectedHand, act.action, v)}
              />
            </div>
          ))}

          {/* Add missing actions */}
          {availableActions
            .filter(a => !hands[selectedHand]?.some(x => x.action === a))
            .map(a => (
              <div key={a} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className={getActionColor(a)}>{a}</Badge>
                  <span>0%</span>
                </div>
                <Slider
                  value={[0]}
                  max={100}
                  step={5}
                  onValueChange={([v]) => updateHandAction(selectedHand, a, v)}
                />
              </div>
            ))}

          <div className="pt-2 border-t">
            Total: {getTotalPercentage(selectedHand)}%
          </div>
        </div>
      )}


    </div>
  );
}
