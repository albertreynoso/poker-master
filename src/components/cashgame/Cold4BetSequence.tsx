import { useState } from 'react';
import { CashPosition, Cold4BetAction, CashHandMatrix, getPositionsAfter } from '@/types/cashGame';
import { CashGameGrid } from './CashGameGrid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { calculateCashCombinations, calculateCashPercentage } from '@/types/cashGame';
import { toast } from 'sonner';

interface Cold4BetSequenceProps {
  onSave: (name: string, hands: CashHandMatrix, positions: any) => void;
}

export function Cold4BetSequence({ onSave }: Cold4BetSequenceProps) {
  const [orPosition, setOrPosition] = useState<CashPosition>('MP');
  const [threeBetPosition, setThreeBetPosition] = useState<CashPosition>('CO');
  const [heroPosition, setHeroPosition] = useState<CashPosition>('BTN');
  const [hands, setHands] = useState<CashHandMatrix>({});

  const orPositions: CashPosition[] = ['EP', 'MP', 'CO', 'BTN', 'SB'];

  const availableActions: Cold4BetAction[] = [
    'COLD4BET-VALUE',
    'COLD4BET-BLUFF'
  ];

  const getAvailable3BetPositions = (): CashPosition[] => {
    return getPositionsAfter(orPosition);
  };

  const getAvailableHeroPositions = (): CashPosition[] => {
    return getPositionsAfter(threeBetPosition).filter(pos => pos !== orPosition);
  };

  const handleSave = () => {
    if (!getAvailable3BetPositions().includes(threeBetPosition)) {
      toast.error('Invalid 3bet position');
      return;
    }
    if (!getAvailableHeroPositions().includes(heroPosition)) {
      toast.error('Invalid cold 4bet position');
      return;
    }
    
    const name = `COLD4BET_${heroPosition}_vs_${orPosition}_Open_${threeBetPosition}_3Bet`;
    onSave(name, hands, { 
      hero: heroPosition,
      villain: orPosition,
      threeBetter: threeBetPosition
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
                    const new3BetPositions = getPositionsAfter(pos);
                    if (new3BetPositions.length > 0) {
                      const new3Bet = new3BetPositions[0];
                      setThreeBetPosition(new3Bet);
                      const newHeroPositions = getPositionsAfter(new3Bet).filter(p => p !== pos);
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
              3Better Position
            </label>
            <div className="flex flex-col gap-2">
              {getAvailable3BetPositions().map((pos) => (
                <Button
                  key={pos}
                  variant={threeBetPosition === pos ? 'default' : 'outline'}
                  onClick={() => {
                    setThreeBetPosition(pos);
                    const newHeroPositions = getAvailableHeroPositions();
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
              Your Position (Cold 4Bet)
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
