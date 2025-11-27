import { useState } from 'react';
import { CashPosition, RaiseOverLimpAction, CashHandMatrix, getPositionsAfter } from '@/types/cashGame';
import { CashGameGrid } from './CashGameGrid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { calculateCashCombinations, calculateCashPercentage } from '@/types/cashGame';
import { toast } from 'sonner';

interface RaiseOverLimpSequenceProps {
  onSave: (name: string, hands: CashHandMatrix, positions: any) => void;
}

export function RaiseOverLimpSequence({ onSave }: RaiseOverLimpSequenceProps) {
  const [limperPosition, setLimperPosition] = useState<CashPosition>('MP');
  const [limper2Position, setLimper2Position] = useState<CashPosition | null>(null);
  const [heroPosition, setHeroPosition] = useState<CashPosition>('CO');
  const [hands, setHands] = useState<CashHandMatrix>({});

  const limperPositions: CashPosition[] = ['EP', 'MP', 'CO', 'BTN', 'SB'];

  const availableActions: RaiseOverLimpAction[] = [
    'ROL-ALL-IN',
    'ROL-CALL',
    'ROL-FOLD'
  ];

  const getAvailableHeroPositions = (): CashPosition[] => {
    const basePositions = getPositionsAfter(limperPosition);
    if (limper2Position) {
      return getPositionsAfter(limper2Position).filter(pos => pos !== limperPosition);
    }
    return basePositions;
  };

  const getAvailableLimper2Positions = (): CashPosition[] => {
    return getPositionsAfter(limperPosition);
  };

  const handleSave = () => {
    if (!getAvailableHeroPositions().includes(heroPosition)) {
      toast.error('Invalid position configuration');
      return;
    }
    
    const limper2Part = limper2Position ? `_${limper2Position}` : '';
    const name = `ROL_${heroPosition}_vs_${limperPosition}${limper2Part}_Limp`;
    onSave(name, hands, { 
      hero: heroPosition, 
      limper: limperPosition,
      limper2: limper2Position 
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
              Limper Position
            </label>
            <div className="flex flex-col gap-2">
              {limperPositions.map((pos) => (
                <Button
                  key={pos}
                  variant={limperPosition === pos ? 'default' : 'outline'}
                  onClick={() => {
                    setLimperPosition(pos);
                    setLimper2Position(null);
                    const newAvailable = getPositionsAfter(pos);
                    if (!newAvailable.includes(heroPosition)) {
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
              Second Limper (Optional)
            </label>
            <div className="flex flex-col gap-2">
              <Button
                variant={limper2Position === null ? 'default' : 'outline'}
                onClick={() => setLimper2Position(null)}
                className="w-full"
              >
                None
              </Button>
              {getAvailableLimper2Positions().map((pos) => (
                <Button
                  key={pos}
                  variant={limper2Position === pos ? 'default' : 'outline'}
                  onClick={() => setLimper2Position(pos)}
                  className="w-full"
                >
                  {pos}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Your Position (ROL)
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
