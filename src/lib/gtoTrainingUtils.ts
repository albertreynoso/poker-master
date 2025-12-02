import { Card, RANKS, SUITS } from '@/types/training';
import { GTOSpot, GTOPosition, GTOScenario, GTOFeedback, GTOAction, Street } from '@/types/gtoTraining';

// Generate random card not in used cards
function generateRandomCard(usedCards: Set<string>): Card {
  let card: Card;
  let cardKey: string;
  
  do {
    const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    cardKey = `${rank}${suit}`;
    card = { rank, suit };
  } while (usedCards.has(cardKey));
  
  usedCards.add(cardKey);
  return card;
}

// Get opening range hands based on position
function getOpeningRangeHands(position: GTOPosition): string[] {
  const ranges: Record<GTOPosition, string[]> = {
    'EP': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'KQs'],
    'MP': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'KQs', 'KJs', 'QJs'],
    'CO': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'KQs', 'KQo', 'KJs', 'QJs', 'JTs'],
    'BTN': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'A9s', 'KQs', 'KQo', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s'],
    'SB': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs'],
    'BB': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'KQs', 'KJs', 'QJs']
  };
  
  return ranges[position] || ranges['CO'];
}

// Convert hand notation to actual cards
function handNotationToCards(handNotation: string, usedCards: Set<string>): [Card, Card] {
  const isSuited = handNotation.includes('s');
  const isPair = handNotation[0] === handNotation[1];
  
  const rank1 = handNotation[0];
  const rank2 = handNotation[1];
  
  if (isPair) {
    const card1 = generateRandomCard(usedCards);
    usedCards.delete(`${card1.rank}${card1.suit}`);
    
    let card2: Card;
    do {
      const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
      card2 = { rank: rank1, suit };
    } while (usedCards.has(`${card2.rank}${card2.suit}`));
    
    usedCards.add(`${card1.rank}${card1.suit}`);
    usedCards.add(`${card2.rank}${card2.suit}`);
    return [card1, card2];
  }
  
  let card1: Card, card2: Card;
  if (isSuited) {
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    card1 = { rank: rank1, suit };
    card2 = { rank: rank2, suit };
  } else {
    const suit1 = SUITS[Math.floor(Math.random() * SUITS.length)];
    let suit2: string;
    do {
      suit2 = SUITS[Math.floor(Math.random() * SUITS.length)];
    } while (suit2 === suit1);
    card1 = { rank: rank1, suit: suit1 };
    card2 = { rank: rank2, suit: suit2 };
  }
  
  if (!usedCards.has(`${card1.rank}${card1.suit}`) && !usedCards.has(`${card2.rank}${card2.suit}`)) {
    usedCards.add(`${card1.rank}${card1.suit}`);
    usedCards.add(`${card2.rank}${card2.suit}`);
    return [card1, card2];
  }
  
  return handNotationToCards(handNotation, usedCards);
}

export function generateScenario(
  spot: GTOSpot,
  street: Street,
  heroPosition: GTOPosition,
  villainPosition: GTOPosition
): GTOScenario {
  const usedCards = new Set<string>();
  
  // Generate hero hand from opening range
  const openingRange = getOpeningRangeHands(heroPosition);
  const randomHand = openingRange[Math.floor(Math.random() * openingRange.length)];
  const heroHand = handNotationToCards(randomHand, usedCards);
  
  // Generate board based on street
  const board: Card[] = [];
  const boardSize = street === 'flop' ? 3 : street === 'turn' ? 4 : 5;
  
  for (let i = 0; i < boardSize; i++) {
    board.push(generateRandomCard(usedCards));
  }
  
  return {
    spot,
    street,
    heroPosition,
    villainPosition,
    heroHand,
    board,
    potSize: 100
  };
}

export function evaluateAction(scenario: GTOScenario, userAction: GTOAction): GTOFeedback {
  // Simplified GTO evaluation logic
  const { spot, heroHand, board, heroPosition } = scenario;
  
  // Calculate basic equity (simplified)
  const equity = calculateSimplifiedEquity(heroHand, board);
  
  // Determine GTO action based on spot and equity
  let correctAction: GTOAction;
  let gtoFrequency: GTOFeedback['gtoFrequency'] = {};
  let explanation = '';
  let actionDistribution = '';
  
  if (spot === 'cbet-single') {
    if (equity > 60) {
      correctAction = 'cbet';
      gtoFrequency = { cbet: 85, check: 15 };
      explanation = `Con ${equity.toFixed(1)}% equity y ventaja de rango, debes c-betear con alta frecuencia. Tu mano tiene suficiente equity para apostar por valor o como semi-bluff.`;
      actionDistribution = '85% c-bet (valor + bluffs), 15% check (pot control)';
    } else if (equity > 40) {
      correctAction = 'cbet';
      gtoFrequency = { cbet: 65, check: 35 };
      explanation = `Con ${equity.toFixed(1)}% equity, tu mano tiene suficiente showdown value. En GTO, c-beteas ~65% en esta textura para mantener balance entre valor y bluffs.`;
      actionDistribution = '65% c-bet (valor + semi-bluffs), 35% check (showdown value)';
    } else {
      correctAction = 'check';
      gtoFrequency = { cbet: 30, check: 70 };
      explanation = `Con solo ${equity.toFixed(1)}% equity, tu mano es débil. GTO sugiere check con alta frecuencia para controlar el bote y llegar a showdown barato.`;
      actionDistribution = '30% c-bet (bluffs puros), 70% check (dar up o pot control)';
    }
  } else if (spot === 'cbet-multiway') {
    if (equity > 55) {
      correctAction = 'cbet';
      gtoFrequency = { cbet: 60, check: 40 };
      explanation = `En bote multiway con ${equity.toFixed(1)}% equity, reduce tu frecuencia de c-bet. Solo apuesta manos fuertes y draws premium.`;
      actionDistribution = '60% c-bet (manos fuertes), 40% check (pot control)';
    } else {
      correctAction = 'check';
      gtoFrequency = { cbet: 25, check: 75 };
      explanation = `En multiway con ${equity.toFixed(1)}% equity, check con alta frecuencia. Los botes multiway requieren manos más fuertes para apostar.`;
      actionDistribution = '25% c-bet (nuts), 75% check (dar up o esperar mejora)';
    }
  } else if (spot === '3bet-single') {
    if (equity > 55) {
      correctAction = '3bet';
      gtoFrequency = { '3bet': 75, call: 20, fold: 5 };
      explanation = `Con ${equity.toFixed(1)}% equity desde ${heroPosition}, tu mano es fuerte para 3bet. Construye el bote con ventaja.`;
      actionDistribution = '75% 3bet (valor), 20% call (trapping), 5% fold (nunca con esta mano)';
    } else if (equity > 40) {
      correctAction = 'call';
      gtoFrequency = { '3bet': 30, call: 60, fold: 10 };
      explanation = `Con ${equity.toFixed(1)}% equity, tu mano tiene buen playability. Call es óptimo para ver flop en posición.`;
      actionDistribution = '30% 3bet (semi-bluff), 60% call (playability), 10% fold (vs aggression)';
    } else {
      correctAction = 'fold';
      gtoFrequency = { '3bet': 10, call: 15, fold: 75 };
      explanation = `Con ${equity.toFixed(1)}% equity, tu mano es débil vs rango de open raise desde ${scenario.villainPosition}. Fold es correcto.`;
      actionDistribution = '10% 3bet (bluffs), 15% call (especulativo), 75% fold';
    }
  } else if (spot === 'blind-defense') {
    if (equity > 50) {
      correctAction = '3bet';
      gtoFrequency = { '3bet': 70, call: 25, fold: 5 };
      explanation = `Defendiendo desde ${heroPosition} con ${equity.toFixed(1)}% equity, 3bet es óptimo para construir el bote con ventaja.`;
      actionDistribution = '70% 3bet (valor + semi-bluff), 25% call (trapping), 5% fold';
    } else if (equity > 35) {
      correctAction = 'call';
      gtoFrequency = { '3bet': 20, call: 70, fold: 10 };
      explanation = `Con ${equity.toFixed(1)}% equity y buen precio desde ${heroPosition}, call es correcto para defender tu ciega.`;
      actionDistribution = '20% 3bet (bluffs), 70% call (defensa), 10% fold (manos débiles)';
    } else {
      correctAction = 'fold';
      gtoFrequency = { '3bet': 5, call: 20, fold: 75 };
      explanation = `Con ${equity.toFixed(1)}% equity, incluso desde ${heroPosition} con buen precio, fold es la opción correcta vs este rango de apertura.`;
      actionDistribution = '5% 3bet (bluffs puros), 20% call (especulativo), 75% fold';
    }
  } else {
    correctAction = 'check';
    gtoFrequency = { cbet: 50, check: 50 };
    explanation = 'Escenario no implementado completamente.';
    actionDistribution = 'Distribución en desarrollo';
  }
  
  const isCorrect = userAction === correctAction;
  
  return {
    correctAction,
    userAction,
    isCorrect,
    equity,
    gtoFrequency,
    explanation,
    actionDistribution
  };
}

function calculateSimplifiedEquity(hand: [Card, Card], board: Card[]): number {
  // Very simplified equity calculation
  const handRanks = hand.map(c => RANKS.indexOf(c.rank as any));
  const boardRanks = board.map(c => RANKS.indexOf(c.rank as any));
  
  // High card equity
  const highCardValue = Math.min(...handRanks);
  let equity = 30 + (12 - highCardValue) * 2;
  
  // Pair bonus
  if (hand[0].rank === hand[1].rank) {
    equity += 20;
  }
  
  // Board connection bonus
  const hasTopPair = handRanks.some(hr => hr === Math.min(...boardRanks));
  if (hasTopPair) equity += 25;
  
  // Suited bonus
  if (hand[0].suit === hand[1].suit) {
    const flushDraw = board.filter(c => c.suit === hand[0].suit).length;
    if (flushDraw >= 2) equity += 15;
  }
  
  return Math.min(95, Math.max(5, equity));
}

export function getAvailablePositions(spot: GTOSpot): { hero: GTOPosition[], villain: GTOPosition[] } {
  if (spot === 'blind-defense') {
    return {
      hero: ['SB', 'BB'],
      villain: ['EP', 'MP', 'CO', 'BTN', 'SB']
    };
  }
  
  return {
    hero: ['EP', 'MP', 'CO', 'BTN', 'SB', 'BB'],
    villain: ['EP', 'MP', 'CO', 'BTN', 'SB', 'BB']
  };
}
