import { assertInvariants } from "./invariants";
import { getLegalActions } from "./legal-actions";
import type { GameAction, MatchState, PlayerId } from "./types";

const other = (id: PlayerId): PlayerId => id === 0 ? 1 : 0;
const clone = (state: MatchState): MatchState => ({ ...state, players: state.players.map((p) => ({ ...p })) as MatchState["players"], committed: [...state.committed] as MatchState["committed"], streetCommitted: [...state.streetCommitted] as MatchState["streetCommitted"], raiseRights: [...state.raiseRights] as MatchState["raiseRights"], undo: null });

function commit(state: MatchState, id: PlayerId, amount: number) {
  state.players[id].stack -= amount; state.committed[id] += amount; state.streetCommitted[id] += amount; state.pot += amount;
  if (state.players[id].stack === 0) state.players[id].allIn = true;
}

function closeBetting(state: MatchState): MatchState {
  const active = state.players.filter((p) => !p.folded);
  if (active.length < 2) { state.status = "settled"; state.handCompleteReason = "fold"; state.actingPlayer = null; return state; }
  const allIn = state.players.some((p) => p.allIn);
  if (allIn) {
    const allInId = state.players[0].allIn ? 0 : 1;
    const otherId = other(allInId);
    const excess = Math.max(0, state.streetCommitted[otherId] - state.streetCommitted[allInId]);
    if (excess > 0) { state.players[otherId].stack += excess; state.committed[otherId] -= excess; state.streetCommitted[otherId] -= excess; state.pot -= excess; }
    const nextStreet = state.street === "river" ? null : state.street === "preflop" ? "flop" : state.street === "flop" ? "turn" : "river";
    state.status = nextStreet ? `awaiting-${nextStreet}` as MatchState["status"] : "showdown";
    state.handCompleteReason = nextStreet ? null : "showdown"; state.actingPlayer = null; return state;
  }
  const transition = state.street === "river" ? "showdown" : `awaiting-${state.street === "preflop" ? "flop" : state.street === "flop" ? "turn" : "river"}`;
  state.status = transition as MatchState["status"]; state.actingPlayer = null; return state;
}

export function applyAction(previous: MatchState, action: GameAction): MatchState {
  if (action.type === "continue-street") return finalize(previous, transitionToNextStreet(previous));
  if (action.type === "settle") return settle(previous, action.winner);
  if (action.type === "next-hand") return startNext(previous);
  if (previous.status !== "betting" || previous.actingPlayer === null) throw new Error("Action is not available now");
  const id = previous.actingPlayer; const legal = getLegalActions(previous, id); const next = clone(previous);
  const toCall = Math.max(0, next.currentBet - next.streetCommitted[id]);
  if (action.type === "fold") { const winner = other(id); next.players[id].folded = true; next.winner = winner; next.players[winner].stack += next.pot; next.pot = 0; next.committed = [0, 0]; next.streetCommitted = [0, 0]; next.status = "settled"; next.handCompleteReason = "fold"; next.actingPlayer = null; next.matchStatus = next.players[id].stack === 0 ? "complete" : "active"; return finalize(previous, next); }
  if (action.type === "check" && !legal.some((a) => a.type === "check")) throw new Error("Illegal check");
  if (action.type === "call" && !legal.some((a) => a.type === "call")) throw new Error("Illegal call");
  if (action.type === "raise-to") {
    const option = legal.find((a) => a.type === "bet" || a.type === "raise");
    const allIn = legal.find((a) => a.type === "all-in");
    if (!option && !(allIn && action.amount === allIn.to)) throw new Error("Illegal raise");
    const max = option?.maxTo ?? allIn?.to ?? 0; const min = option?.minTo ?? max;
    if (action.amount < min || action.amount > max) throw new Error("Raise is outside legal range");
    const raiseSize = action.amount - next.currentBet; commit(next, id, action.amount - next.streetCommitted[id]);
    if (raiseSize >= next.lastRaiseSize || next.currentBet === 0) { next.lastRaiseSize = Math.max(next.config.bigBlind, raiseSize); next.currentBet = action.amount; next.raiseRights = [true, true]; }
    else next.currentBet = Math.max(next.currentBet, action.amount);
  } else if (action.type === "call") commit(next, id, Math.min(toCall, next.players[id].stack));
  next.raiseRights[id] = false;
  const opponent = other(id); next.actingPlayer = next.players[opponent].allIn ? null : opponent; next.actionCount += 1;
  if (next.actingPlayer === null || (action.type === "call" && next.players[id].allIn) || (next.streetCommitted[0] === next.streetCommitted[1] && next.raiseRights[0] === false && next.raiseRights[1] === false)) return finalize(previous, closeBetting(next));
  return finalize(previous, next);
}

function settle(previous: MatchState, winner: PlayerId | "split"): MatchState { if (previous.status !== "showdown") throw new Error("Result is not available now"); const next = clone(previous); next.winner = winner; next.players[0].stack += winner === "split" ? Math.floor(next.pot / 2) : winner === 0 ? next.pot : 0; next.players[1].stack += winner === "split" ? Math.ceil(next.pot / 2) : winner === 1 ? next.pot : 0; next.pot = 0; next.committed = [0, 0]; next.streetCommitted = [0, 0]; next.status = "settled"; next.actingPlayer = null; next.matchStatus = next.players.some((p) => p.stack === 0) ? "complete" : "active"; return finalize(previous, next); }
function startNext(previous: MatchState): MatchState { if (previous.status !== "settled") throw new Error("Hand is not settled"); return finalize(previous, startHand(previous)); }
function finalize(previous: MatchState, next: MatchState): MatchState { next.undo = previous; assertInvariants(next); return next; }
import { startHand, transitionToNextStreet } from "./state";
