import { Card } from './training';

export type GTOSpot = 
  | 'cbet-single' 
  | 'cbet-multiway' 
  | '3bet-single' 
  | '3bet-multiway' 
  | 'blind-defense';

export type Street = 'flop' | 'turn' | 'river';

export type GTOPosition = 'EP' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB';

export type GTOAction = 'cbet' | 'check' | 'fold' | '3bet' | 'call';

export interface GTOScenario {
  spot: GTOSpot;
  street: Street;
  heroPosition: GTOPosition;
  villainPosition: GTOPosition;
  heroHand: [Card, Card];
  board: Card[];
  potSize: number;
}

export interface GTOFeedback {
  correctAction: GTOAction;
  userAction: GTOAction;
  isCorrect: boolean;
  equity: number;
  gtoFrequency: {
    cbet?: number;
    check?: number;
    fold?: number;
    '3bet'?: number;
    call?: number;
  };
  explanation: string;
  actionDistribution: string;
}

export const SPOT_DESCRIPTIONS: Record<GTOSpot, string> = {
  'cbet-single': 'C-Bet en bote heads-up',
  'cbet-multiway': 'C-Bet en bote multiway',
  '3bet-single': '3Bet spot heads-up',
  '3bet-multiway': '3Bet spot multiway',
  'blind-defense': 'Defensa de ciegas'
};
