import { CBetRecommendation as CBetRec, RangeAdvantage } from '@/types/training';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';

interface CBetRecommendationProps {
  recommendation: CBetRec | null;
  rangeAdvantage: RangeAdvantage | null;
}

export function CBetRecommendation({ recommendation, rangeAdvantage }: CBetRecommendationProps) {
  if (!recommendation || !rangeAdvantage) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">C-Bet Recommendation</h3>
        <p className="text-muted-foreground text-center py-8">Analyze a flop to see recommendations</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-lg font-semibold text-foreground">C-Bet Recommendation</h3>

      <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
        <div className="text-center flex-1">
          <div className="text-sm text-muted-foreground mb-1">Hero</div>
          <div className="text-2xl font-bold text-primary">{rangeAdvantage.hero}%</div>
        </div>
        <div className="text-muted-foreground">vs</div>
        <div className="text-center flex-1">
          <div className="text-sm text-muted-foreground mb-1">Villain</div>
          <div className="text-2xl font-bold text-foreground">{rangeAdvantage.villain}%</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Percent className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">Frequency</div>
            <div className="text-xl font-bold text-foreground">{recommendation.frequency}%</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">Optimal Size</div>
            <div className="text-xl font-bold text-foreground">{recommendation.size}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-green-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">Expected Value</div>
            <div className="text-xl font-bold text-green-400">+{recommendation.ev}BB</div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <div className="flex items-start gap-2">
          <Badge className="mt-0.5 bg-primary/20 text-primary">Analysis</Badge>
          <p className="text-sm text-muted-foreground flex-1">{recommendation.reasoning}</p>
        </div>
      </div>
    </Card>
  );
}
