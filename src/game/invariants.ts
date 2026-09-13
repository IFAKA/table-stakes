import type { MatchState } from "./types";
import { TOTAL_CHIPS } from "./types";

export function assertInvariants(state: MatchState): void {
  const allNumbers = [
    state.pot, ...state.players.map((p) => p.stack), ...state.committed, ...state.streetCommitted,
    state.currentBet, state.lastRaiseSize,
  ];
  if (allNumbers.some((n) => !Number.isSafeInteger(n) || n < 0)) throw new Error("Invalid chip value");
  if (state.pot !== state.committed[0] + state.committed[1]) throw new Error("Pot and commitments diverged");
  if (state.streetCommitted[0] > state.committed[0] || state.streetCommitted[1] > state.committed[1]) throw new Error("Street commitment exceeded total");
  if (state.players[0].stack + state.players[1].stack + state.pot !== TOTAL_CHIPS) throw new Error("Chip supply invariant failed");
  if (state.status === "betting" && state.actingPlayer === null) throw new Error("Betting needs an actor");
  if (state.status !== "betting" && state.actingPlayer !== null) throw new Error("Paused state cannot have an actor");
  if (state.players.some((p) => p.stack === 0 && !p.folded && !p.allIn && state.matchStatus !== "setup")) throw new Error("Zero stack must be all-in");
}
