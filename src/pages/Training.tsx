import { useState } from 'react';
import { Card as CardType, Flop, FlopTexture, CBetRecommendation as CBetRec, ActionLine, RangeAdvantage, Position } from '@/types/training';
import { FlopSelector } from '@/components/training/FlopSelector';
import { TextureAnalysis } from '@/components/training/TextureAnalysis';
import { CBetRecommendation } from '@/components/training/CBetRecommendation';
import { SuggestedLines } from '@/components/training/SuggestedLines';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { analyzeFlop, generateCBetRecommendation, generateActionLines, calculateRangeAdvantage, generateRandomFlop } from '@/lib/trainingUtils';
import { toast } from 'sonner';

const Training = () => {
  const [selectedCards, setSelectedCards] = useState<(CardType | null)[]>([null, null, null]);
  const [position, setPosition] = useState<Position>('IP');
  const [texture, setTexture] = useState<FlopTexture | null>(null);
  const [recommendation, setRecommendation] = useState<CBetRec | null>(null);
  const [lines, setLines] = useState<ActionLine[]>([]);
  const [rangeAdvantage, setRangeAdvantage] = useState<RangeAdvantage | null>(null);

  const handleCardSelect = (card: CardType, position: number) => {
    const newCards = [...selectedCards];
    newCards[position] = card;
    setSelectedCards(newCards);
    
    if (newCards.every(c => c !== null)) {
      analyzeCurrentFlop(newCards as Flop);
    }
  };

  const handleClear = () => {
    setSelectedCards([null, null, null]);
    setTexture(null);
    setRecommendation(null);
    setLines([]);
    setRangeAdvantage(null);
  };

  const handleRandomFlop = () => {
    const flop = generateRandomFlop();
    setSelectedCards(flop);
    analyzeCurrentFlop(flop);
    toast.success('Random flop generated');
  };

  const analyzeCurrentFlop = (flop: Flop) => {
    const analysis = analyzeFlop(flop);
    const rec = generateCBetRecommendation(analysis, position);
    const actionLines = generateActionLines(analysis, rec);
    const advantage = calculateRangeAdvantage(analysis, position);
    
    setTexture(analysis);
    setRecommendation(rec);
    setLines(actionLines);
    setRangeAdvantage(advantage);
    
    toast.success('Flop analyzed successfully');
  };

  const handlePositionToggle = () => {
    const newPosition: Position = position === 'IP' ? 'OOP' : 'IP';
    setPosition(newPosition);
    
    if (selectedCards.every(c => c !== null)) {
      analyzeCurrentFlop(selectedCards as Flop);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training: C-Bet Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Analyze flop textures and get optimal c-betting recommendations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Position:</span>
          <Button
            variant={position === 'IP' ? 'default' : 'outline'}
            size="sm"
            onClick={handlePositionToggle}
          >
            {position === 'IP' ? 'In Position' : 'Out of Position'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <FlopSelector
            selectedCards={selectedCards}
            onCardSelect={handleCardSelect}
            onClear={handleClear}
            onRandomFlop={handleRandomFlop}
          />
          
          <TextureAnalysis texture={texture} />
        </div>

        <div className="space-y-6">
          <CBetRecommendation 
            recommendation={recommendation}
            rangeAdvantage={rangeAdvantage}
          />
        </div>
      </div>

      <SuggestedLines lines={lines} />
    </div>
  );
};

export default Training;
