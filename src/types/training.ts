export type Card = {
  rank: string;
  suit: string;
};

export type Flop = [Card, Card, Card];

export type Position = 'IP' | 'OOP';

export type TextureType = 'dry' | 'connected' | 'volatile' | 'ace-high' | 'paired';

export type FlopTexture = {
  type: TextureType;
  dryness: number; // 0-1
  connectedness: number; // 0-1
  flushPotential: boolean;
  straightPotential: boolean;
  pairedBoard: boolean;
  description: string;
};

export type CBetRecommendation = {
  frequency: number; // 0-100
  size: string; // "33%", "50%", "66%", "75%", "100%"
  ev: number;
  reasoning: string;
};

export type ActionLine = {
  flop: string;
  turn: string;
  river: string;
  description: string;
  hands: string[];
  priority: 'primary' | 'alternative' | 'exploitative';
};

export type RangeAdvantage = {
  hero: number; // 0-100
  villain: number; // 0-100
};

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
export const SUITS = ['♠', '♥', '♦', '♣'] as const;
