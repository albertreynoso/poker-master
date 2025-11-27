import { useState } from 'react';
import { CashPosition, OpenRaiseAction, CashHandMatrix, getPositionsAfter } from '@/types/cashGame';
import { CashGameGrid } from './CashGameGrid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { calculateCashCombinations, calculateCashPercentage } from '@/types/cashGame';

interface OpenRaiseSequenceProps {
  onSave: (name: string, hands: CashHandMatrix, positions: any) => void;
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
    <div className="flex gap-6">
      {/* Left: Position Selector */}
      <div className="w-64 flex-shrink-0">
        <Card className="p-4">
          <label className="text-sm font-medium text-foreground mb-3 block">
            Your Position (Open Raise)
          </label>
          <div className="flex flex-col gap-2">
            {openRaisePositions.map((pos) => (
              <Button
                key={pos}
                variant={heroPosition === pos ? 'default' : 'outline'}
                onClick={() => setHeroPosition(pos)}
                className="w-full"
              >
                {pos}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Center: Grid */}
      <div className="flex-1">
        <CashGameGrid
          hands={hands}
          onChange={setHands}
          availableActions={availableActions}
          combinations={combinations}
          percentage={percentage}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
