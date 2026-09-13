import type { LegalAction, MatchState, PlayerId } from "./types";

export function getLegalActions(state: MatchState, player: PlayerId = state.actingPlayer ?? 0): LegalAction[] {
  if (state.status !== "betting" || state.actingPlayer !== player) return [];
  const p = state.players[player]; if (p.folded || p.allIn) return [];
  const toCall = Math.max(0, state.currentBet - state.streetCommitted[player]);
  const actions: LegalAction[] = [{ type: "fold" }];
  if (toCall === 0) actions.push({ type: "check" }); else if (p.stack > 0) actions.push({ type: "call", amount: Math.min(toCall, p.stack) });
  const maxTo = state.streetCommitted[player] + p.stack;
  const minTo = state.currentBet === 0 ? state.config.bigBlind : state.currentBet + state.lastRaiseSize;
  const canRaise = state.raiseRights[player] && maxTo > state.currentBet && maxTo >= minTo;
  if (canRaise) actions.push({ type: state.currentBet === 0 ? "bet" : "raise", minTo, maxTo });
  if (maxTo > state.currentBet) actions.push({ type: "all-in", to: maxTo, isRaise: maxTo > state.currentBet });
  return actions;
}
