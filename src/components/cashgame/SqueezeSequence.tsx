import { useState } from 'react';
import { CashPosition, SqueezeAction, CashHandMatrix, getPositionsAfter } from '@/types/cashGame';
import { CashGameGrid } from './CashGameGrid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { calculateCashCombinations, calculateCashPercentage } from '@/types/cashGame';
import { toast } from 'sonner';

interface SqueezeSequenceProps {
  onSave: (name: string, hands: CashHandMatrix, positions: any) => void;
}

export function SqueezeSequence({ onSave }: SqueezeSequenceProps) {
  const [orPosition, setOrPosition] = useState<CashPosition>('CO');
  const [callerPosition, setCallerPosition] = useState<CashPosition>('BTN');
  const [heroPosition, setHeroPosition] = useState<CashPosition>('SB');
  const [hands, setHands] = useState<CashHandMatrix>({});

  const orPositions: CashPosition[] = ['EP', 'MP', 'CO', 'BTN', 'SB'];

  const availableActions: SqueezeAction[] = [
    'SQUEEZE-VALUE',
    'SQUEEZE-BLUFF',
    'SQUEEZE-FOLD'
  ];

  const getAvailableCallerPositions = (): CashPosition[] => {
    return getPositionsAfter(orPosition);
  };

  const getAvailableHeroPositions = (): CashPosition[] => {
    return getPositionsAfter(callerPosition);
  };

  const handleSave = () => {
    if (!getAvailableCallerPositions().includes(callerPosition)) {
      toast.error('Invalid caller position');
      return;
    }
    if (!getAvailableHeroPositions().includes(heroPosition)) {
      toast.error('Invalid squeeze position');
      return;
    }
    
    const name = `SQUEEZE_${heroPosition}_vs_${orPosition}_Open_${callerPosition}_Call`;
    onSave(name, hands, { 
      hero: heroPosition,
      villain: orPosition,
      caller: callerPosition
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
                    const newCallerPositions = getPositionsAfter(pos);
                    if (newCallerPositions.length > 0) {
                      const newCaller = newCallerPositions[0];
                      setCallerPosition(newCaller);
                      const newHeroPositions = getPositionsAfter(newCaller);
                      if (newHeroPositions.length > 0) {
                        setHeroPosition(newHeroPositions[0]);
                      }
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
              Caller Position
            </label>
            <div className="flex flex-col gap-2">
              {getAvailableCallerPositions().map((pos) => (
                <Button
                  key={pos}
                  variant={callerPosition === pos ? 'default' : 'outline'}
                  onClick={() => {
                    setCallerPosition(pos);
                    const newHeroPositions = getPositionsAfter(pos);
                    if (newHeroPositions.length > 0 && !newHeroPositions.includes(heroPosition)) {
                      setHeroPosition(newHeroPositions[0]);
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
              Your Position (Squeeze)
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
