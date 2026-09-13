import { describe, expect, it } from "vitest";
import { applyAction } from "./actions";
import { getLegalActions } from "./legal-actions";
import { createMatch, startHand } from "./state";
import { assertInvariants } from "./invariants";
import type { MatchState } from "./types";

const config = { startingStacks: [1000, 1000] as [number, number], smallBlind: 10, bigBlind: 20, dealer: 0 as const };
const fresh = () => startHand(createMatch(config));

function act(state: MatchState, type: "check" | "call" | "fold" | "raise-to", amount?: number) {
  return applyAction(state, type === "raise-to" ? { type, amount: amount ?? 0 } : { type });
}

describe("heads-up Hold'em engine", () => {
  it("initializes heads-up blinds and preflop order", () => {
    const state = fresh();
    expect(state.dealer).toBe(0); expect(state.actingPlayer).toBe(0);
    expect(state.committed).toEqual([10, 20]); expect(state.pot).toBe(30);
    expect(getLegalActions(state)).toEqual(expect.arrayContaining([{ type: "call", amount: 10 }]));
    assertInvariants(state);
  });

  it("supports check-check, physical street pause, and postflop order", () => {
    let state = fresh(); state = act(state, "call"); state = act(state, "check");
    expect(state.status).toBe("awaiting-flop"); expect(state.actingPlayer).toBeNull();
    state = applyAction(state, { type: "continue-street" });
    expect(state.street).toBe("flop"); expect(state.actingPlayer).toBe(1);
  });

  it("handles bet, raise, call and showdown", () => {
    let state = fresh(); state = act(state, "raise-to", 60); state = act(state, "raise-to", 120); state = act(state, "call");
    expect(state.status).toBe("awaiting-flop"); expect(state.pot).toBe(240);
  });

  it("handles a raise followed by a fold", () => {
    let state = fresh();
    state = act(state, "raise-to", 60);
    expect(getLegalActions(state, 1)).toEqual(expect.arrayContaining([{ type: "fold" }, { type: "call", amount: 40 }]));
    state = act(state, "fold");
    expect(state.status).toBe("settled");
    expect(state.players[0].stack).toBe(1020);
    expect(state.players[1].stack).toBe(980);
    expect(state.players[0].stack + state.players[1].stack + state.pot).toBe(2000);
  });

  it("handles a bet followed by a call", () => {
    let state = fresh();
    state = act(state, "call");
    state = act(state, "check");
    state = applyAction(state, { type: "continue-street" });
    state = act(state, "check");
    state = act(state, "raise-to", 40);
    expect(getLegalActions(state, 1)).toEqual(expect.arrayContaining([{ type: "call", amount: 40 }]));
    state = act(state, "call");
    expect(state.status).toBe("awaiting-turn");
    expect(state.pot).toBe(120);
    expect(state.players[0].stack + state.players[1].stack + state.pot).toBe(2000);
  });

  it("rejects undersized raises and awards a fold", () => {
    let state = fresh(); expect(() => act(state, "raise-to", 25)).toThrow("Raise");
    state = act(state, "fold"); expect(state.status).toBe("settled"); expect(state.pot).toBe(0); expect(state.players[1].stack).toBe(1010);
  });

  it("restores the complete prior state through undo", () => {
    const state = fresh(); const changed = act(state, "call");
    expect(changed.undo).toEqual(expect.objectContaining({ actionCount: 0 }));
    expect(changed.undo?.committed).toEqual(state.committed);
  });

  it("keeps the chip invariant through deterministic random legal walks", () => {
    let seed = 48291;
    for (let trial = 0; trial < 100; trial += 1) {
      let state = fresh();
      for (let step = 0; step < 80 && state.matchStatus !== "complete"; step += 1) {
        assertInvariants(state);
        if (state.status === "betting") {
          const legal = getLegalActions(state); const choice = legal[(seed = (seed * 1664525 + 1013904223) >>> 0) % legal.length];
          state = choice.type === "fold" ? act(state, "fold") : choice.type === "check" ? act(state, "check") : choice.type === "call" ? act(state, "call") : act(state, "raise-to", choice.type === "all-in" ? choice.to : choice.minTo);
        } else if (state.status === "showdown") state = applyAction(state, { type: "settle", winner: "split" });
        else if (state.status.startsWith("awaiting")) state = applyAction(state, { type: "continue-street" });
        else if (state.status === "settled") state = applyAction(state, { type: "next-hand" });
      }
    }
  });

  it("allows a short all-in call and runs the board to showdown", () => {
    let state = startHand(createMatch({ startingStacks: [30, 1970], smallBlind: 10, bigBlind: 20, dealer: 0 }));
    state = act(state, "call");
    state = act(state, "raise-to", 100);
    expect(getLegalActions(state, 0)).toEqual(expect.arrayContaining([{ type: "call", amount: 10 }]));
    state = act(state, "call");
    expect(state.status).toBe("awaiting-flop");
    state = applyAction(state, { type: "continue-street" });
    expect(state.status).toBe("awaiting-turn");
    state = applyAction(state, { type: "continue-street" });
    expect(state.status).toBe("awaiting-river");
    state = applyAction(state, { type: "continue-street" });
    expect(state.status).toBe("showdown");
    expect(state.pot).toBe(60);
    assertInvariants(state);
  });

  it("exposes an all-in option after a short raise that does not reopen raising", () => {
    let state = startHand(createMatch({ startingStacks: [1870, 130], smallBlind: 10, bigBlind: 20, dealer: 0 }));
    state = act(state, "raise-to", 80);
    state = act(state, "raise-to", 130);
    const legal = getLegalActions(state, 0);
    expect(legal).toEqual(expect.arrayContaining([{ type: "all-in", to: 1870, isRaise: true }]));
    expect(legal.some((action) => action.type === "raise")).toBe(false);
  });

  it("starts in showdown when both blind posts consume the stacks", () => {
    let state = startHand(createMatch({ startingStacks: [900, 1100], smallBlind: 900, bigBlind: 1100, dealer: 0 }));
    expect(state.status).toBe("awaiting-flop");
    state = applyAction(state, { type: "continue-street" });
    state = applyAction(state, { type: "continue-street" });
    state = applyAction(state, { type: "continue-street" });
    expect(state.status).toBe("showdown");
    expect(state.actingPlayer).toBeNull();
    expect(state.pot).toBe(1800);
    assertInvariants(state);
  });

  it("completes a checked hand, splits the pot, and rotates the button", () => {
    let state = fresh();
    state = act(state, "call"); state = act(state, "check");
    state = applyAction(state, { type: "continue-street" });
    state = act(state, "check"); state = act(state, "check");
    state = applyAction(state, { type: "continue-street" });
    state = act(state, "check"); state = act(state, "check");
    state = applyAction(state, { type: "continue-street" });
    state = act(state, "check"); state = act(state, "check");
    expect(state.status).toBe("showdown");
    expect(state.pot).toBe(40);
    state = applyAction(state, { type: "settle", winner: "split" });
    expect(state.players).toEqual([{ stack: 1000, folded: false, allIn: false }, { stack: 1000, folded: false, allIn: false }]);
    state = applyAction(state, { type: "next-hand" });
    expect(state.dealer).toBe(1); expect(state.actingPlayer).toBe(1); expect(state.committed).toEqual([20, 10]);
    assertInvariants(state);
  });

  it("handles an all-in shove followed by a fold", () => {
    let state = startHand(createMatch({ startingStacks: [100, 1900], smallBlind: 10, bigBlind: 20, dealer: 0 }));
    state = act(state, "raise-to", 100);
    expect(getLegalActions(state, 1)).toEqual(expect.arrayContaining([{ type: "call", amount: 80 }]));
    state = act(state, "fold");
    expect(state.status).toBe("settled"); expect(state.players[0].stack).toBe(120); expect(state.players[1].stack).toBe(1880);
    assertInvariants(state);
  });

  it("rejects result entry before showdown", () => {
    expect(() => applyAction(fresh(), { type: "settle", winner: 0 })).toThrow("Result");
  });

  it("runs repeated hands with alternating button ownership", () => {
    let state = fresh();
    for (let hand = 1; hand <= 4; hand += 1) {
      state = act(state, "call"); state = act(state, "check");
      state = applyAction(state, { type: "continue-street" });
      state = act(state, "check"); state = act(state, "check");
      state = applyAction(state, { type: "continue-street" });
      state = act(state, "check"); state = act(state, "check");
      state = applyAction(state, { type: "continue-street" });
      state = act(state, "check"); state = act(state, "check");
      state = applyAction(state, { type: "settle", winner: 0 });
      if (hand < 4) state = applyAction(state, { type: "next-hand" });
    }
    expect(state.handNumber).toBe(4); expect(state.dealer).toBe(1); expect(state.players[0].stack + state.players[1].stack).toBe(2000);
    assertInvariants(state);
  });

  it("ends a match on a busted stack and permits a fresh rematch", () => {
    let state = startHand(createMatch({ startingStacks: [100, 1900], smallBlind: 10, bigBlind: 20, dealer: 0 }));
    state = act(state, "raise-to", 100); state = act(state, "call");
    state = applyAction(state, { type: "continue-street" });
    state = applyAction(state, { type: "continue-street" });
    state = applyAction(state, { type: "continue-street" });
    state = applyAction(state, { type: "settle", winner: 1 });
    expect(state.matchStatus).toBe("complete"); expect(state.players[0].stack).toBe(0); expect(state.players[1].stack).toBe(2000);
    expect(() => applyAction(state, { type: "next-hand" })).toThrow("complete");
    const rematch = startHand(createMatch(config));
    expect(rematch.handNumber).toBe(1); expect(rematch.dealer).toBe(0); assertInvariants(rematch);
  });
});
