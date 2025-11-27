export type CashPosition = 'EP' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB';

export type SequenceType = 
  | 'OPEN_RAISE' 
  | 'RAISE_OVER_LIMP' 
  | '3BET' 
  | 'SQUEEZE' 
  | 'COLD_4BET';

export type OpenRaiseAction = 
  | 'OR-ALL-IN'
  | 'OR-4BET-ALL-IN' 
  | 'OR-4BET-FOLD' 
  | 'OR-CALL' 
  | 'OR-FOLD';

export type RaiseOverLimpAction = 
  | 'ROL-ALL-IN' 
  | 'ROL-CALL' 
  | 'ROL-FOLD';

export type ThreeBetAction = 
  | '3BET-ALL-IN' 
  | '3BET-CALL' 
  | '3BET-FOLD';

export type SqueezeAction = 
  | 'SQUEEZE-VALUE' 
  | 'SQUEEZE-BLUFF' 
  | 'SQUEEZE-FOLD';

export type Cold4BetAction = 
  | 'COLD4BET-VALUE' 
  | 'COLD4BET-BLUFF';

export type CashAction = 
  | OpenRaiseAction 
  | RaiseOverLimpAction 
  | ThreeBetAction 
  | SqueezeAction 
  | Cold4BetAction;

export type HandAction = {
  action: CashAction;
  percentage: number;
};

export type CashHandMatrix = Record<string, HandAction[]>;

export type CashRange = {
  id: string;
  name: string;
  sequence: SequenceType;
  hands: CashHandMatrix;
  positions: {
    hero?: CashPosition;
    villain?: CashPosition;
    caller?: CashPosition;
    limper?: CashPosition;
    limper2?: CashPosition;
    threeBetter?: CashPosition;
  };
  totalPercentage: number;
  combinations: number;
  createdAt: string;
  updatedAt: string;
};

export const CASH_POSITIONS: CashPosition[] = ['EP', 'MP', 'CO', 'BTN', 'SB', 'BB'];

export const POSITION_ORDER: Record<CashPosition, number> = {
  'EP': 1,
  'MP': 2,
  'CO': 3,
  'BTN': 4,
  'SB': 5,
  'BB': 6
};

export function getPositionsAfter(position: CashPosition): CashPosition[] {
  const currentOrder = POSITION_ORDER[position];
  return CASH_POSITIONS.filter(pos => POSITION_ORDER[pos] > currentOrder);
}

export function getActionColor(action: CashAction): string {
  // Open Raise actions
  if (action === 'OR-ALL-IN') return 'bg-red-500';
  if (action === 'OR-4BET-ALL-IN') return 'bg-red-400';
  if (action === 'OR-4BET-FOLD') return 'bg-orange-400';
  if (action === 'OR-CALL') return 'bg-green-400';
  if (action === 'OR-FOLD') return 'bg-gray-400';
  
  // Raise Over Limp actions
  if (action === 'ROL-ALL-IN') return 'bg-red-500';
  if (action === 'ROL-CALL') return 'bg-green-400';
  if (action === 'ROL-FOLD') return 'bg-gray-400';
  
  // 3Bet actions
  if (action === '3BET-ALL-IN') return 'bg-red-500';
  if (action === '3BET-CALL') return 'bg-green-400';
  if (action === '3BET-FOLD') return 'bg-gray-400';
  
  // Squeeze actions
  if (action === 'SQUEEZE-VALUE') return 'bg-blue-500';
  if (action === 'SQUEEZE-BLUFF') return 'bg-purple-400';
  if (action === 'SQUEEZE-FOLD') return 'bg-gray-400';
  
  // Cold 4Bet actions
  if (action === 'COLD4BET-VALUE') return 'bg-blue-500';
  if (action === 'COLD4BET-BLUFF') return 'bg-purple-400';
  
  return 'bg-muted/20';
}

export function calculateCashCombinations(hands: CashHandMatrix): number {
  let total = 0;
  Object.entries(hands).forEach(([hand, actions]) => {
    const isPair = hand[0] === hand[1] && hand.length === 2;
    const isSuited = hand.endsWith('s') && hand.length === 3;
    const combos = isPair ? 6 : (isSuited ? 4 : 12);
    
    const totalPercentage = actions.reduce((sum, a) => sum + a.percentage, 0);
    total += (combos * totalPercentage) / 100;
  });
  return Math.round(total * 10) / 10;
}

export function calculateCashPercentage(hands: CashHandMatrix): number {
  const combos = calculateCashCombinations(hands);
  return Math.round((combos / 1326) * 1000) / 10;
}
