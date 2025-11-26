import { ActionLine } from '@/types/training';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Lightbulb, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestedLinesProps {
  lines: ActionLine[];
}

export function SuggestedLines({ lines }: SuggestedLinesProps) {
  if (lines.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Suggested Lines</h3>
        <p className="text-muted-foreground text-center py-8">No lines available yet</p>
      </Card>
    );
  }

  const getLineIcon = (priority: string) => {
    switch (priority) {
      case 'primary':
        return <Target className="h-5 w-5 text-green-400" />;
      case 'alternative':
        return <Lightbulb className="h-5 w-5 text-yellow-400" />;
      case 'exploitative':
        return <AlertTriangle className="h-5 w-5 text-orange-400" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'primary':
        return 'border-green-500/50 bg-green-500/10';
      case 'alternative':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'exploitative':
        return 'border-orange-500/50 bg-orange-500/10';
      default:
        return 'border-border';
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Suggested Lines</h3>
      
      <div className="space-y-4">
        {lines.map((line, index) => (
          <div 
            key={index}
            className={cn(
              "p-4 rounded-lg border-2 transition-colors",
              getPriorityColor(line.priority)
            )}
          >
            <div className="flex items-start gap-3 mb-3">
              {getLineIcon(line.priority)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {line.priority.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{line.description}</p>
              </div>
            </div>

            <div className="space-y-2 pl-8">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-foreground">Flop:</span>
                <span className="text-muted-foreground">{line.flop}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-foreground">Turn:</span>
                <span className="text-muted-foreground">{line.turn}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-foreground">River:</span>
                <span className="text-muted-foreground">{line.river}</span>
              </div>
              
              {line.hands.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Example hands:</div>
                  <div className="flex flex-wrap gap-1">
                    {line.hands.slice(0, 8).map((hand, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {hand}
                      </Badge>
                    ))}
                    {line.hands.length > 8 && (
                      <Badge variant="secondary" className="text-xs">
                        +{line.hands.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
