import { FlopTexture } from '@/types/training';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TextureAnalysisProps {
  texture: FlopTexture | null;
}

export function TextureAnalysis({ texture }: TextureAnalysisProps) {
  if (!texture) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Texture Analysis</h3>
        <p className="text-muted-foreground text-center py-8">Select a flop to see texture analysis</p>
      </Card>
    );
  }

  const getTextureColor = (type: string) => {
    const colors = {
      dry: 'bg-blue-500/20 text-blue-300',
      connected: 'bg-yellow-500/20 text-yellow-300',
      volatile: 'bg-red-500/20 text-red-300',
      'ace-high': 'bg-purple-500/20 text-purple-300',
      paired: 'bg-green-500/20 text-green-300',
    };
    return colors[type as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Texture Analysis</h3>
      
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-24">Type:</span>
          <Badge className={cn("text-sm", getTextureColor(texture.type))}>
            {texture.type.toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-24">Dryness:</span>
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${texture.dryness * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-foreground w-12 text-right">
              {Math.round(texture.dryness * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-24">Connected:</span>
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${texture.connectedness * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-foreground w-12 text-right">
              {Math.round(texture.connectedness * 100)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className={cn(
            "p-2 rounded border text-center text-sm",
            texture.flushPotential ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"
          )}>
            Flush Draw {texture.flushPotential ? '✓' : '✗'}
          </div>
          <div className={cn(
            "p-2 rounded border text-center text-sm",
            texture.straightPotential ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"
          )}>
            Straight Draw {texture.straightPotential ? '✓' : '✗'}
          </div>
          <div className={cn(
            "p-2 rounded border text-center text-sm col-span-2",
            texture.pairedBoard ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"
          )}>
            Paired Board {texture.pairedBoard ? '✓' : '✗'}
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">{texture.description}</p>
        </div>
      </div>
    </Card>
  );
}
