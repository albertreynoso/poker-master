import { useState } from 'react';
import { GTOSpot, Street, GTOPosition, GTOScenario, GTOFeedback, GTOAction, SPOT_DESCRIPTIONS } from '@/types/gtoTraining';
import { generateScenario, evaluateAction, getAvailablePositions } from '@/lib/gtoTrainingUtils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TrainingGTO = () => {
  const [spot, setSpot] = useState<GTOSpot>('cbet-single');
  const [street, setStreet] = useState<Street>('flop');
  const [heroPosition, setHeroPosition] = useState<GTOPosition>('BTN');
  const [villainPosition, setVillainPosition] = useState<GTOPosition>('CO');
  const [scenario, setScenario] = useState<GTOScenario | null>(null);
  const [feedback, setFeedback] = useState<GTOFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const getSuitColor = (suit: string) => {
    return suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-foreground';
  };

  const handleStartScenario = () => {
    const newScenario = generateScenario(spot, street, heroPosition, villainPosition);
    setScenario(newScenario);
    setFeedback(null);
    setShowFeedback(false);
    toast.success('Nuevo escenario generado');
  };

  const handleAction = (action: GTOAction) => {
    if (!scenario) return;
    
    const result = evaluateAction(scenario, action);
    setFeedback(result);
    setShowFeedback(true);
    
    if (result.isCorrect) {
      toast.success('¡Correcto!');
    } else {
      toast.error('Incorrecto');
    }
  };

  const handleReset = () => {
    setScenario(null);
    setFeedback(null);
    setShowFeedback(false);
  };

  const availablePositions = getAvailablePositions(spot);
  const availableActions: GTOAction[] = spot.includes('3bet') 
    ? ['3bet', 'call', 'fold'] 
    : ['cbet', 'check', 'fold'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Training GTO</h1>
        <p className="text-muted-foreground mt-1">
          Practica decisiones GTO en diferentes spots y recibe feedback detallado
        </p>
      </div>

      {/* Configuration Section */}
      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Spot</label>
            <Tabs value={spot} onValueChange={(v) => setSpot(v as GTOSpot)}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="cbet-single">C-Bet HU</TabsTrigger>
                <TabsTrigger value="cbet-multiway">C-Bet MW</TabsTrigger>
                <TabsTrigger value="3bet-single">3Bet HU</TabsTrigger>
                <TabsTrigger value="3bet-multiway">3Bet MW</TabsTrigger>
                <TabsTrigger value="blind-defense">Blind Def</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Calle</label>
              <Tabs value={street} onValueChange={(v) => setStreet(v as Street)}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="flop">Flop</TabsTrigger>
                  <TabsTrigger value="turn">Turn</TabsTrigger>
                  <TabsTrigger value="river">River</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Tu Posición</label>
              <Select value={heroPosition} onValueChange={(v) => setHeroPosition(v as GTOPosition)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePositions.hero.map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Villain Posición</label>
              <Select value={villainPosition} onValueChange={(v) => setVillainPosition(v as GTOPosition)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePositions.villain.map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleStartScenario} className="w-full" size="lg">
            <Play className="h-4 w-4 mr-2" />
            Generar Escenario
          </Button>
        </div>
      </Card>

      {/* Scenario Display */}
      {scenario && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Escenario</h3>
              <Badge variant="outline">{SPOT_DESCRIPTIONS[scenario.spot]}</Badge>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tu Mano ({scenario.heroPosition})</p>
                <div className="flex gap-2">
                  {scenario.heroHand.map((card, idx) => (
                    <div key={idx} className="w-20 h-28 border-2 border-primary rounded-lg flex flex-col items-center justify-center bg-card">
                      <div className={cn("text-3xl font-bold", getSuitColor(card.suit))}>
                        {card.rank}
                      </div>
                      <div className={cn("text-2xl", getSuitColor(card.suit))}>
                        {card.suit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Board ({scenario.street})</p>
                <div className="flex gap-2">
                  {scenario.board.map((card, idx) => (
                    <div key={idx} className="w-16 h-24 border-2 border-border rounded-lg flex flex-col items-center justify-center bg-card">
                      <div className={cn("text-2xl font-bold", getSuitColor(card.suit))}>
                        {card.rank}
                      </div>
                      <div className={cn("text-xl", getSuitColor(card.suit))}>
                        {card.suit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Bote: {scenario.potSize} BB</p>
                <p className="text-sm text-muted-foreground">Villain: {scenario.villainPosition}</p>
              </div>
            </div>

            {!showFeedback && (
              <div>
                <p className="text-sm font-medium text-foreground mb-3">¿Qué acción tomas?</p>
                <div className="grid grid-cols-3 gap-2">
                  {availableActions.map(action => (
                    <Button
                      key={action}
                      onClick={() => handleAction(action)}
                      variant="outline"
                      size="lg"
                    >
                      {action.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Feedback Section */}
          {showFeedback && feedback && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Feedback</h3>
                {feedback.isCorrect ? (
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/50">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Correcto
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-500 border-red-500/50">
                    <XCircle className="h-4 w-4 mr-1" />
                    Incorrecto
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Tu Acción</p>
                  <Badge variant="outline" className="text-base">
                    {feedback.userAction.toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Acción GTO Óptima</p>
                  <Badge variant="default" className="text-base">
                    {feedback.correctAction.toUpperCase()}
                  </Badge>
                </div>

                <div className="p-4 bg-accent/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Equity</span>
                    <span className="text-lg font-bold text-foreground">{feedback.equity.toFixed(1)}%</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Frecuencias GTO</p>
                  <div className="space-y-2">
                    {Object.entries(feedback.gtoFrequency).map(([action, freq]) => (
                      <div key={action} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{action}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${freq}%` }}
                            />
                          </div>
                          <span className="text-foreground font-medium w-12 text-right">{freq}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Explicación</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feedback.explanation}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Distribución de Acciones</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feedback.actionDistribution}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleStartScenario} className="flex-1">
                  Siguiente Escenario
                </Button>
                <Button onClick={handleReset} variant="outline">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default TrainingGTO;
