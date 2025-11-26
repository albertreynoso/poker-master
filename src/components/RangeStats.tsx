import { HandMatrix, calculateCombinations, calculatePercentage } from '@/types/poker';
import { Card } from './ui/card';

interface RangeStatsProps {
  hands: HandMatrix;
}

export function RangeStats({ hands }: RangeStatsProps) {
  const combinations = calculateCombinations(hands);
  const percentage = calculatePercentage(hands);

  const countByType = () => {
    let pairs = 0;
    let suited = 0;
    let offsuit = 0;

    Object.entries(hands).forEach(([hand, weight]) => {
      if (weight > 0) {
        if (hand[0] === hand[1]) pairs++;
        else if (hand.endsWith('s')) suited++;
        else offsuit++;
      }
    });

    return { pairs, suited, offsuit };
  };

  const { pairs, suited, offsuit } = countByType();

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4 text-foreground">Range Statistics</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-bold text-primary">{percentage}%</div>
          <div className="text-xs text-muted-foreground">Total Range</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-primary">{combinations}</div>
          <div className="text-xs text-muted-foreground">Combinations</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-foreground">{pairs}</div>
          <div className="text-xs text-muted-foreground">Pocket Pairs</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-foreground">{suited}</div>
          <div className="text-xs text-muted-foreground">Suited Hands</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-foreground">{offsuit}</div>
          <div className="text-xs text-muted-foreground">Offsuit Hands</div>
        </div>
      </div>
    </Card>
  );
}
