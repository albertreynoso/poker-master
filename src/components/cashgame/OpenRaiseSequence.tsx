import { useState } from 'react';
import { CashPosition, OpenRaiseAction, CashHandMatrix, getPositionsAfter } from '@/types/cashGame';
import { CashGameGrid } from './CashGameGrid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { calculateCashCombinations, calculateCashPercentage } from '@/types/cashGame';

// En OpenRaiseSequence.tsx - agregar estos imports
import { FrequenciesPanel } from './FrequenciesPanel';
import { RangeEditorSidebar } from './RangeEditorSidebar';

// En la definición del componente OpenRaiseSequence
interface OpenRaiseSequenceProps {
  onSave: (name: string, hands: CashHandMatrix, positions: any) => void;
  isEditing: boolean;
  onEditToggle: () => void;
  onCancel: () => void; // ← Agregar esta línea
}

export function OpenRaiseSequence({ onSave }: OpenRaiseSequenceProps) {
  const [heroPosition, setHeroPosition] = useState<CashPosition>('CO');
  const [hands, setHands] = useState<CashHandMatrix>({});

  const openRaisePositions: CashPosition[] = ['EP', 'MP', 'CO', 'BTN', 'SB'];

  const availableActions: OpenRaiseAction[] = [
    'OR-ALL-IN',
    'OR-4BET-ALL-IN',
    'OR-4BET-FOLD',
    'OR-CALL',
    'OR-FOLD'
  ];

  const handleSave = () => {
    const name = `OR_${heroPosition}`;
    onSave(name, hands, { hero: heroPosition });
  };

  const combinations = calculateCashCombinations(hands);
  const percentage = calculateCashPercentage(hands);

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Your Position (Open Raise)
            </label>
            <div className="flex flex-wrap gap-2">
              {openRaisePositions.map((pos) => (
                <Button
                  key={pos}
                  variant={heroPosition === pos ? 'default' : 'outline'}
                  onClick={() => setHeroPosition(pos)}
                >
                  {pos}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-2xl font-bold text-primary">{percentage}%</div>
              <div className="text-xs text-muted-foreground">Range %</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{combinations}</div>
              <div className="text-xs text-muted-foreground">Combos</div>
            </div>
            <div>
              <Button onClick={handleSave} className="w-full">
                Save Range
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <CashGameGrid
        hands={hands}
        onChange={setHands}
        availableActions={availableActions}
      />
    </div>
  );
}