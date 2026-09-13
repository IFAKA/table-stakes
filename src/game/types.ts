export type PlayerId = 0 | 1;
export type Street = "preflop" | "flop" | "turn" | "river";
export type HandStatus = "betting" | "awaiting-flop" | "awaiting-turn" | "awaiting-river" | "showdown" | "settled";

export type PlayerState = { stack: number; folded: boolean; allIn: boolean };

export type MatchConfig = {
  startingStacks: [number, number];
  smallBlind: number;
  bigBlind: number;
  dealer: PlayerId;
};

export type MatchState = {
  schemaVersion: 1;
  config: MatchConfig;
  players: [PlayerState, PlayerState];
  handNumber: number;
  street: Street;
  status: HandStatus;
  dealer: PlayerId;
  actingPlayer: PlayerId | null;
  pot: number;
  committed: [number, number];
  streetCommitted: [number, number];
  currentBet: number;
  lastRaiseSize: number;
  raiseRights: [boolean, boolean];
  actionCount: number;
  handCompleteReason: "fold" | "showdown" | null;
  winner: PlayerId | "split" | null;
  undo: MatchState | null;
  matchStatus: "setup" | "active" | "complete";
};

export type LegalAction =
  | { type: "fold" }
  | { type: "check" }
  | { type: "call"; amount: number }
  | { type: "bet"; minTo: number; maxTo: number }
  | { type: "raise"; minTo: number; maxTo: number }
  | { type: "all-in"; to: number; isRaise: boolean };

export type GameAction =
  | { type: "check" }
  | { type: "fold" }
  | { type: "call" }
  | { type: "raise-to"; amount: number }
  | { type: "continue-street" }
  | { type: "settle"; winner: PlayerId | "split" }
  | { type: "next-hand" };

export const TOTAL_CHIPS = 2000;
export const SCHEMA_VERSION = 1;
