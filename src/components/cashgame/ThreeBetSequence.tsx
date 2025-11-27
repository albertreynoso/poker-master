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
    <div className="space-y-6">
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Open Raiser Position
            </label>
            <div className="flex flex-wrap gap-2">
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
                >
                  {pos}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Your Position (3Bet)
            </label>
            <div className="flex flex-wrap gap-2">
              {getAvailableHeroPositions().map((pos) => (
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
