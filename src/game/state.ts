import { assertInvariants } from "./invariants";
import type { MatchConfig, MatchState, PlayerId, Street } from "./types";
import { SCHEMA_VERSION, TOTAL_CHIPS } from "./types";

const other = (player: PlayerId): PlayerId => player === 0 ? 1 : 0;
const post = (stack: number, blind: number) => Math.min(stack, blind);

export function createMatch(config: MatchConfig): MatchState {
  const total = config.startingStacks[0] + config.startingStacks[1];
  if (total !== TOTAL_CHIPS) throw new Error(`Starting stacks must total ${TOTAL_CHIPS}`);
  if (config.smallBlind <= 0 || config.bigBlind <= config.smallBlind) throw new Error("Invalid blinds");
  return {
    schemaVersion: SCHEMA_VERSION, config, players: [
      { stack: config.startingStacks[0], folded: false, allIn: false },
      { stack: config.startingStacks[1], folded: false, allIn: false },
    ], handNumber: 0, street: "preflop", status: "settled", dealer: config.dealer,
    actingPlayer: null, pot: 0, committed: [0, 0], streetCommitted: [0, 0], currentBet: 0,
    lastRaiseSize: config.bigBlind, raiseRights: [true, true], actionCount: 0,
    handCompleteReason: null, winner: null, undo: null, matchStatus: "setup",
  };
}

function nextStreet(street: Street): Street { return street === "preflop" ? "flop" : street === "flop" ? "turn" : "river"; }

export function startHand(previous: MatchState): MatchState {
  if (previous.matchStatus === "complete") throw new Error("Match is complete");
  const dealer = previous.handNumber === 0 ? previous.dealer : other(previous.dealer);
  const players = previous.players.map((p) => ({ ...p, folded: false, allIn: p.stack === 0 })) as MatchState["players"];
  const committed: [number, number] = [0, 0];
  const postBlind = (id: PlayerId, amount: number) => { const paid = post(players[id].stack, amount); players[id].stack -= paid; players[id].allIn = players[id].stack === 0; committed[id] = paid; };
  postBlind(dealer, previous.config.smallBlind); postBlind(other(dealer), previous.config.bigBlind);
  const state: MatchState = {
    ...previous, players, handNumber: previous.handNumber + 1, dealer, street: "preflop", status: "betting",
    actingPlayer: dealer, pot: committed[0] + committed[1], committed, streetCommitted: [...committed],
    currentBet: committed[0] > committed[1] ? committed[0] : committed[1], lastRaiseSize: previous.config.bigBlind,
    raiseRights: [true, true], actionCount: 0, handCompleteReason: null, winner: null, undo: null,
    matchStatus: "active",
  };
  // Heads-up: dealer/small blind acts first preflop. If the blind is all-in, the other player acts.
  const actor = state.actingPlayer;
  if (actor !== null && state.players[actor].allIn) state.actingPlayer = other(actor);
  if (state.players[0].allIn && state.players[1].allIn) {
    const excess = Math.max(0, state.streetCommitted[1] - state.streetCommitted[0]);
    if (excess > 0) {
      state.players[1].stack += excess;
      state.committed[1] -= excess;
      state.streetCommitted[1] -= excess;
      state.pot -= excess;
    }
    state.status = "awaiting-flop";
    state.handCompleteReason = null;
    state.actingPlayer = null;
  }
  assertInvariants(state); return state;
}

export function transitionToNextStreet(state: MatchState): MatchState {
  if (state.status !== "awaiting-flop" && state.status !== "awaiting-turn" && state.status !== "awaiting-river") throw new Error("No street transition pending");
  const street = nextStreet(state.street);
  const first = state.dealer === 0 ? 1 : 0;
  const next: MatchState = { ...state, street, status: "betting", actingPlayer: first, currentBet: 0, streetCommitted: [0, 0], lastRaiseSize: state.config.bigBlind, raiseRights: [true, true], undo: state };
  if (next.players.some((player) => player.allIn)) {
    next.status = street === "river" ? "showdown" : `awaiting-${street === "flop" ? "turn" : "river"}` as MatchState["status"];
    next.actingPlayer = null;
  } else if (next.players[first].allIn) next.actingPlayer = other(first);
  assertInvariants(next); return next;
}
