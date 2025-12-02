// types/cashGame.ts
export type CashPosition = 'EP' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB';

export type SequenceType = 
  | 'OPEN_RAISE' 
  | '3BET' 
  | 'SQUEEZE' 
  | 'COLD_4BET' 
  | 'RAISE_OVER_LIMP';

// Acciones por secuencia
export type OpenRaiseAction = 'OR-4BET-ALL-IN' | 'OR-4BET-FOLD' | 'OR-CALL 3BET' | 'OR-FOLD';
export type ThreeBetAction = '3BET-ALL-IN' | '3BET-CALL 4BET' | '3BET-FOLD';
export type Cold4BetAction = '4BET-CALL' | '4BET-FOLD';
export type SqueezeAction = 'SQZ-ALL-IN' | 'SQZ-FOLD' | 'COLD-CALL';
export type RaiseOverLimpAction = 'ROL-4BET-ALL-IN' | 'ROL-4BET-FOLD' | 'ROL-CALL 3BET' | 'ROL-FOLD';

export type CashAction = 
  | OpenRaiseAction 
  | ThreeBetAction 
  | Cold4BetAction 
  | SqueezeAction 
  | RaiseOverLimpAction;

export interface HandAction {
  action: CashAction;
  percentage: number;
}

export type CashHandMatrix = Record<string, HandAction[]>;

export interface CashRange {
  id: string;
  name: string;
  sequence: SequenceType;
  hands: CashHandMatrix;
  positions: Record<string, CashPosition>;
  totalPercentage: number;
  combinations: number;
  createdAt: string;
  updatedAt: string;
}

// Función para obtener el color de cada acción según la nueva nomenclatura
export function getActionColor(action: CashAction): string {
  // OPEN RAISE
  if (action === 'OR-4BET-ALL-IN') return 'bg-red-500';
  if (action === 'OR-4BET-FOLD') return 'bg-orange-500';
  if (action === 'OR-CALL 3BET') return 'bg-green-500';
  if (action === 'OR-FOLD') return 'bg-cyan-500';

  // 3BET
  if (action === '3BET-ALL-IN') return 'bg-red-500';
  if (action === '3BET-CALL 4BET') return 'bg-green-500';
  if (action === '3BET-FOLD') return 'bg-cyan-500';

  // COLD 4BET
  if (action === '4BET-CALL') return 'bg-red-500';
  if (action === '4BET-FOLD') return 'bg-cyan-500';

  // SQUEEZE
  if (action === 'SQZ-ALL-IN') return 'bg-red-500';
  if (action === 'SQZ-FOLD') return 'bg-cyan-500';
  if (action === 'COLD-CALL') return 'bg-green-500';

  // RAISE OVER LIMP
  if (action === 'ROL-4BET-ALL-IN') return 'bg-red-500';
  if (action === 'ROL-4BET-FOLD') return 'bg-orange-500';
  if (action === 'ROL-CALL 3BET') return 'bg-green-500';
  if (action === 'ROL-FOLD') return 'bg-cyan-500';

  return 'bg-gray-500';
}

export function calculateCashCombinations(hands: CashHandMatrix): number {
  let total = 0;
  Object.entries(hands).forEach(([hand, actions]) => {
    const handTotal = actions.reduce((sum, a) => sum + a.percentage, 0);
    const combos = hand.includes('s') ? 4 : hand[0] === hand[1] ? 6 : 16;
    total += (combos * handTotal) / 100;
  });
  return Math.round(total * 10) / 10;
}

export function calculateCashPercentage(hands: CashHandMatrix): number {
  const totalCombos = calculateCashCombinations(hands);
  return Math.round((totalCombos / 1326) * 1000) / 10;
}
