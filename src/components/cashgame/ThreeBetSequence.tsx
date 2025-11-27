import { useState } from 'react';
import { CashPosition, ThreeBetAction, CashHandMatrix, getPositionsAfter } from '@/types/cashGame';
import { CashGameGrid } from './CashGameGrid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { calculateCashCombinations, calculateCashPercentage } from '@/types/cashGame';
import { toast } from 'sonner';

interface ThreeBetSequenceProps {
  onSave: (name: string, hands: CashHandMatrix, positions: any) => void;
}

export function ThreeBetSequence({ onSave }: ThreeBetSequenceProps) {
  const [orPosition, setOrPosition] = useState<CashPosition>('CO');
  const [heroPosition, setHeroPosition] = useState<CashPosition>('BTN');
  const [hands, setHands] = useState<CashHandMatrix>({});

  const orPositions: CashPosition[] = ['EP', 'MP', 'CO', 'BTN', 'SB'];
  const threeBetPositions: CashPosition[] = ['MP', 'CO', 'BTN', 'SB', 'BB'];

  const availableActions: ThreeBetAction[] = [
    '3BET-ALL-IN',
    '3BET-CALL',
    '3BET-FOLD'
  ];

  const getAvailableHeroPositions = (): CashPosition[] => {
    return getPositionsAfter(orPosition).filter(pos => 
      threeBetPositions.includes(pos)
    );
  };

  const handleSave = () => {
    if (!getAvailableHeroPositions().includes(heroPosition)) {
      toast.error('Invalid 3bet position - must be after open raiser');
      return;
    }
    
    const name = `3BET_${heroPosition}_vs_${orPosition}_Open`;
    onSave(name, hands, { 
      hero: heroPosition, 
      villain: orPosition 
    });
  };

  const combinations = calculateCashCombinations(hands);
  const percentage = calculateCashPercentage(hands);

  return (
    <div className="flex gap-6">
      {/* Left: Position Selectors */}
      <div className="w-64 flex-shrink-0">
        <Card className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Open Raiser Position
            </label>
            <div className="flex flex-col gap-2">
              {orPositions.map((pos) => (
                <Button
                  key={pos}
                  variant={orPosition === pos ? 'default' : 'outline'}
                  onClick={() => {
                    setOrPosition(pos);
                    const newAvailable = getAvailableHeroPositions();
                    if (newAvailable.length > 0 && !newAvailable.includes(heroPosition)) {
                      setHeroPosition(newAvailable[0]);
                    }
                  }}
                  className="w-full"
                >
                  {pos}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Your Position (3Bet)
            </label>
            <div className="flex flex-col gap-2">
              {getAvailableHeroPositions().map((pos) => (
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
