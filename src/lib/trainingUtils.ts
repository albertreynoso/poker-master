import { Card, Flop, FlopTexture, CBetRecommendation, ActionLine, RangeAdvantage, RANKS, SUITS } from '@/types/training';

export function analyzeFlop(flop: Flop): FlopTexture {
  const ranks = flop.map(card => card.rank);
  const suits = flop.map(card => card.suit);
  
  // Check for paired board
  const pairedBoard = new Set(ranks).size < 3;
  
  // Check flush potential (2+ same suit)
  const suitCounts = suits.reduce((acc, suit) => {
    acc[suit] = (acc[suit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const flushPotential = Object.values(suitCounts).some(count => count >= 2);
  
  // Calculate connectedness
  const rankValues = ranks.map(r => {
    const idx = RANKS.findIndex(rank => rank === r);
    return idx === -1 ? 0 : idx;
  });
  const sortedValues = [...rankValues].sort((a, b) => a - b);
  const maxGap = Math.max(sortedValues[1] - sortedValues[0], sortedValues[2] - sortedValues[1]);
  const connectedness = Math.max(0, 1 - (maxGap / 8));
  
  // Check for straight potential
  const straightPotential = maxGap <= 4;
  
  // Calculate dryness (opposite of connectedness and draws)
  const dryness = pairedBoard ? 0.7 : Math.max(0, 1 - connectedness - (flushPotential ? 0.3 : 0));
  
  // Determine texture type
  let type: FlopTexture['type'] = 'dry';
  let description = '';
  
  if (pairedBoard) {
    type = 'paired';
    description = 'Paired board reduces action. C-bet with polarized range.';
  } else if (ranks.includes('A')) {
    type = 'ace-high';
    description = 'Ace-high board favors pre-flop aggressor. High c-bet frequency recommended.';
  } else if (flushPotential && straightPotential) {
    type = 'volatile';
    description = 'Highly coordinated board with multiple draws. Use larger bet sizes with value hands.';
  } else if (connectedness > 0.6) {
    type = 'connected';
    description = 'Connected board favors calling ranges. Bet larger with strong hands, check often with air.';
  } else {
    type = 'dry';
    description = 'Dry board favors aggressor. High c-bet frequency with small sizes works well.';
  }
  
  return {
    type,
    dryness,
    connectedness,
    flushPotential,
    straightPotential,
    pairedBoard,
    description,
  };
}

export function generateCBetRecommendation(texture: FlopTexture, position: 'IP' | 'OOP'): CBetRecommendation {
  let frequency = 65;
  let size = '50%';
  let ev = 5.0;
  let reasoning = '';
  
  if (texture.type === 'dry') {
    frequency = position === 'IP' ? 88 : 78;
    size = '33%';
    ev = 12.5;
    reasoning = 'Dry boards favor the aggressor. Use high frequency c-bets with small sizing to capitalize on fold equity.';
  } else if (texture.type === 'ace-high') {
    frequency = position === 'IP' ? 85 : 75;
    size = '40%';
    ev = 10.8;
    reasoning = 'Ace-high boards strongly favor your range. C-bet frequently with medium sizing to extract value and deny equity.';
  } else if (texture.type === 'connected') {
    frequency = position === 'IP' ? 62 : 55;
    size = '66%';
    ev = 6.2;
    reasoning = 'Connected boards hit calling ranges well. Bet larger with value hands and strong draws, check back weak holdings.';
  } else if (texture.type === 'volatile') {
    frequency = position === 'IP' ? 58 : 48;
    size = '75%';
    ev = 4.5;
    reasoning = 'Highly coordinated board requires caution. Bet large with strong hands to charge draws, check often otherwise.';
  } else if (texture.type === 'paired') {
    frequency = position === 'IP' ? 70 : 60;
    size = '33%';
    ev = 8.0;
    reasoning = 'Paired boards reduce action. Use polarized c-betting strategy with small sizing to win uncontested pots.';
  }
  
  return { frequency, size, ev, reasoning };
}

export function generateActionLines(texture: FlopTexture, recommendation: CBetRecommendation): ActionLine[] {
  const lines: ActionLine[] = [];
  
  // Primary line
  if (recommendation.frequency > 70) {
    lines.push({
      flop: `C-Bet ${recommendation.size}`,
      turn: 'Double Barrel 75%',
      river: 'Value Bet / Check',
      description: 'Main line with strong hands and equity. Continue aggression on good turn cards.',
      hands: ['AK', 'KQ', 'QJ', 'JT', 'A5s', 'K9s'],
      priority: 'primary',
    });
  }
  
  // Alternative line
  lines.push({
    flop: 'Check',
    turn: 'Check',
    river: 'Bet 66%',
    description: 'Pot control line with medium strength hands. Evaluate river for thin value or bluff.',
    hands: ['A8', 'KT', 'Q9', 'J8', 'middle pairs'],
    priority: 'alternative',
  });
  
  // Exploitative line based on texture
  if (texture.type === 'dry' || texture.type === 'ace-high') {
    lines.push({
      flop: `C-Bet ${recommendation.size}`,
      turn: 'Barrel any card 80%',
      river: 'Triple Barrel Bluff',
      description: 'Aggressive bluffing line vs weak-tight opponents. High fold equity on all streets.',
      hands: ['A2s-A5s', '76s', '65s', 'overcards'],
      priority: 'exploitative',
    });
  } else if (texture.type === 'connected') {
    lines.push({
      flop: 'C-Bet 75% with draws',
      turn: 'Barrel or Check-Raise',
      river: 'Value Bet / Give Up',
      description: 'Semi-bluff line with strong draws. Apply pressure and realize equity.',
      hands: ['flush draws', 'OESD', 'combo draws'],
      priority: 'exploitative',
    });
  }
  
  return lines;
}

export function calculateRangeAdvantage(texture: FlopTexture, position: 'IP' | 'OOP'): RangeAdvantage {
  let hero = 50;
  let villain = 50;
  
  // Adjust based on texture and position
  if (texture.type === 'dry' || texture.type === 'ace-high') {
    hero = position === 'IP' ? 62 : 58;
  } else if (texture.type === 'connected') {
    hero = position === 'IP' ? 48 : 45;
  } else if (texture.type === 'volatile') {
    hero = position === 'IP' ? 45 : 42;
  } else if (texture.type === 'paired') {
    hero = position === 'IP' ? 55 : 52;
  }
  
  villain = 100 - hero;
  
  return { hero, villain };
}

export function generateRandomFlop(): Flop {
  const usedCards = new Set<string>();
  const flop: Card[] = [];
  
  while (flop.length < 3) {
    const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const cardKey = `${rank}${suit}`;
    
    if (!usedCards.has(cardKey)) {
      usedCards.add(cardKey);
      flop.push({ rank, suit });
    }
  }
  
  return flop as Flop;
}
