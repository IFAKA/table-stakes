"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Plus, Settings, Undo2 } from "lucide-react";
import { applyAction } from "@/src/game/actions";
import { getLegalActions } from "@/src/game/legal-actions";
import { createMatch, startHand } from "@/src/game/state";
import type { GameAction, LegalAction, MatchState, PlayerId } from "@/src/game/types";
import { loadMatch, saveMatch } from "@/src/storage/repository";
import { DEFAULT_CONFIG } from "@/src/ui/config";

const money = (value: number) => value.toLocaleString("en-US");
const NEW_MATCH_HOLD_MS = 1500;

export function Table() {
  const [state, setState] = useState<MatchState | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [raiseTo, setRaiseTo] = useState(0);
  const [pendingWinner, setPendingWinner] = useState<PlayerId | "split" | null>(null);
  const [wake, setWake] = useState<WakeLockSentinel | null>(null);
  const [newMatchFlash, setNewMatchFlash] = useState(false);
  const newMatchFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { void loadMatch().then((saved) => { setState(saved ? (saved.matchStatus === "setup" ? startHand(saved) : saved) : startHand(createMatch(DEFAULT_CONFIG))); }).catch((error: unknown) => { setStorageError(error instanceof Error ? error.message : "Saved match could not be opened."); }); }, []);
  useEffect(() => { if (state) void saveMatch(state); }, [state]);
  useEffect(() => () => { if (newMatchFlashTimer.current) clearTimeout(newMatchFlashTimer.current); }, []);
  useEffect(() => { let active = true; const acquire = async () => { if (!active || !state || state.matchStatus !== "active" || !("wakeLock" in navigator)) return; try { setWake(await navigator.wakeLock.request("screen")); } catch { /* optional capability */ } }; void acquire(); const onVisible = () => { if (document.visibilityState === "visible") void acquire(); }; document.addEventListener("visibilitychange", onVisible); return () => { active = false; document.removeEventListener("visibilitychange", onVisible); void wake?.release(); }; }, [state, wake]);
  const act = useCallback((action: GameAction) => { setState((current) => current ? applyAction(current, action) : current); setRaiseOpen(false); setPendingWinner(null); }, []);
  const newMatch = useCallback(() => {
    setState((current) => current ? startHand(createMatch(current.config)) : current);
    setRaiseOpen(false);
    setPendingWinner(null);
    setNewMatchFlash(true);
    if (newMatchFlashTimer.current) clearTimeout(newMatchFlashTimer.current);
    newMatchFlashTimer.current = setTimeout(() => setNewMatchFlash(false), 760);
  }, []);
  if (storageError) return <section className="boot" aria-labelledby="storage-error-title"><div className="message-stage" role="alert"><h1 id="storage-error-title">Saved match unavailable</h1><p className="intro">{storageError}</p><p className="note">Your saved data was not deleted. Keep this app version available or export the browser data before trying a migration.</p></div></section>;
  if (!state) return <section className="boot" aria-label="Loading table"><div className="message-stage"><h1>Loading table</h1></div></section>;
  const active = state.actingPlayer;
  const actions = active === null ? [] : getLegalActions(state, active);
  const openRaise = () => { const option = actions.find((action) => action.type === "bet" || action.type === "raise"); if (option) { setRaiseTo(option.minTo); setRaiseOpen(true); } };
  return <section className={`instrument ${newMatchFlash ? "new-match-flash" : ""}`} aria-label="Heads-up Hold’em table"><header className="table-toolbar" aria-label="Table controls"><NewMatchHold onComplete={newMatch} statusId="new-game-hold-status" /><span className="control-spacer">{state.undo && <button type="button" className="icon-button" onClick={() => setState(state.undo)} aria-label="Undo last action" title="Undo last action"><Undo2 aria-hidden="true" /></button>}</span><a className="icon-button" href="/settings/" aria-label="Settings" title="Settings"><Settings aria-hidden="true" /></a></header><div className="table-grid" aria-label="Two-player tabletop controller"><PlayerSide id={1} state={state} active={active === 1} actions={active === 1 ? actions : []} onAction={act} onRaise={openRaise} onActionCenter={act} pendingWinner={pendingWinner} onWinner={setPendingWinner} /><PlayerSide id={0} state={state} active={active === 0} actions={active === 0 ? actions : []} onAction={act} onRaise={openRaise} onActionCenter={act} pendingWinner={pendingWinner} onWinner={setPendingWinner} /></div>{raiseOpen && active !== null && <RaiseControls player={active} state={state} value={raiseTo} setValue={setRaiseTo} onCancel={() => setRaiseOpen(false)} onConfirm={() => act({ type: "raise-to", amount: raiseTo })} />}</section>;
}

function CenterFace({ state, onAction, seat, pendingWinner, onWinner }: { state: MatchState; onAction: (action: GameAction) => void; seat: "top" | "bottom"; pendingWinner: PlayerId | "split" | null; onWinner: (winner: PlayerId | "split" | null) => void }) {
  const message = state.status === "showdown" ? "Inspect the physical cards, then record the result" : state.status.startsWith("awaiting") ? "Deal the next street physically" : state.winner === "split" ? "Split pot" : state.winner !== null ? `Player ${state.winner + 1} wins` : "";
  const street = state.status.startsWith("awaiting") ? state.status.slice(9) : null;
  const dealer = state.dealer + 1;
  const smallBlind = state.dealer + 1;
  const bigBlind = state.dealer === 0 ? 2 : 1;
  return <div className={`center-face center-face-${seat}`}><p className="hand-protocol">Hand {String(state.handNumber).padStart(2, "0")} · P{dealer} deals · P{smallBlind} small blind {money(state.config.smallBlind)} · P{bigBlind} big blind {money(state.config.bigBlind)}</p><div className="pot"><span className="pot-label">Pot</span><strong>{money(state.pot)}</strong><span className="current-bet">Highest bet this round {money(state.currentBet)}</span></div>{message && <p className="physical secondary-message" role="status" aria-live="polite">{message}</p>}{state.status === "showdown" && <Showdown seat={seat} pendingWinner={pendingWinner} onSelect={onWinner} onSettle={(winner) => onAction({ type: "settle", winner })} />}{street && <button type="button" className="primary center-button" onClick={() => onAction({ type: "continue-street" })}>Deal {street}</button>}{state.status === "settled" && state.matchStatus !== "complete" && <button type="button" className="primary center-button" onClick={() => onAction({ type: "next-hand" })}>Start hand {state.handNumber + 1}</button>}{state.matchStatus === "complete" && <p className="match-end">Match complete</p>}</div>;
}

function NewMatchHold({ onComplete, statusId }: { onComplete: () => void; statusId: string }) {
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const held = useRef(false);
  const clearHold = useCallback(() => { held.current = false; if (timer.current) clearTimeout(timer.current); if (interval.current) clearInterval(interval.current); timer.current = null; interval.current = null; setProgress(0); setCompleted(false); }, []);
  const finish = useCallback(() => { if (!held.current) return; held.current = false; if (interval.current) clearInterval(interval.current); interval.current = null; setProgress(1); setCompleted(true); onComplete(); timer.current = setTimeout(clearHold, 1200); }, [clearHold, onComplete]);
  const startHold = useCallback(() => {
    if (held.current) return;
    held.current = true;
    const startedAt = performance.now();
    setProgress(0.01);
    interval.current = setInterval(() => setProgress(Math.min(1, (performance.now() - startedAt) / NEW_MATCH_HOLD_MS)), 40);
    timer.current = setTimeout(finish, NEW_MATCH_HOLD_MS);
  }, [finish]);
  useEffect(() => () => clearHold(), [clearHold]);
  useEffect(() => { const cancel = () => clearHold(); window.addEventListener("blur", cancel); return () => window.removeEventListener("blur", cancel); }, [clearHold]);
  const release = useCallback(() => { if (held.current) clearHold(); }, [clearHold]);
  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => { if (event.key !== "Enter" && event.key !== " ") return; event.preventDefault(); startHold(); };
  const onKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); release(); } };
  return <span className="new-match-control"><button className={`icon-button hold-button ${completed ? "completed" : ""}`} type="button" aria-label="Hold to start a new game" aria-describedby={statusId} style={{ "--hold-progress": `${progress * 360}deg` } as React.CSSProperties} onPointerDown={(event) => { try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer capture is unavailable for synthetic events. */ } startHold(); }} onPointerUp={release} onPointerCancel={release} onKeyDown={onKeyDown} onKeyUp={onKeyUp} onBlur={release} onContextMenu={(event) => event.preventDefault()} disabled={progress === 1} title="Hold to start a new game">{completed ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}</button><span id={statusId} className="sr-only" role="status" aria-live="polite">{progress > 0 && progress < 1 ? `New game ${Math.round(progress * 100)}% complete` : completed ? "New game started" : "Hold to start a new game"}</span></span>;
}

function PlayerSide({ id, state, active, actions, onAction, onRaise, onActionCenter, pendingWinner, onWinner }: { id: PlayerId; state: MatchState; active: boolean; actions: LegalAction[]; onAction: (action: GameAction) => void; onRaise: () => void; onActionCenter: (action: GameAction) => void; pendingWinner: PlayerId | "split" | null; onWinner: (winner: PlayerId | "split" | null) => void }) {
  const player = state.players[id]; const label = `Player ${id + 1}`; const outcome = state.status === "settled" && state.winner !== null && state.winner !== "split" ? (state.winner === id ? "WON" : "LOST") : null; const can = (type: LegalAction["type"]) => actions.some((action) => action.type === type); const call = actions.find((action) => action.type === "call"); const raise = actions.find((action) => action.type === "bet" || action.type === "raise"); const allIn = actions.find((action) => action.type === "all-in");
  const toCall = call && "amount" in call ? call.amount : 0;
  const seat = id === 1 ? "top" : "bottom";
  return <section className={`player-side player-${id} ${active ? "is-active" : ""}`} aria-label={`${label} side`}><div className="player-surface"><div className="player-copy">{outcome && <span className="role outcome">{outcome}</span>}<div className="stack"><span>Stack</span><strong>{money(player.stack)}</strong></div>{active && <p className="to-call">{toCall ? `To call ${money(toCall)}` : "No bet to call"}</p>}</div></div><div className="side-center"><CenterFace state={state} onAction={onActionCenter} seat={seat} pendingWinner={pendingWinner} onWinner={onWinner} /></div>{active && <div className="actions" aria-label={`${label} legal actions`}>{can("fold") && <button type="button" className="danger" onClick={() => onAction({ type: "fold" })}>Fold</button>}{can("check") && <button type="button" className="primary" onClick={() => onAction({ type: "check" })}>Check</button>}{call && <button type="button" className="primary" onClick={() => onAction({ type: "call" })}>Call <small>{money(call.amount)}</small></button>}{raise && <button type="button" className="primary" onClick={onRaise}>Raise</button>}{!raise && allIn && <button type="button" className="danger" onClick={() => onAction({ type: "raise-to", amount: allIn.to })}>All-in <small>{money(allIn.to)}</small></button>}</div>}</section>;
}

function Showdown({ onSettle, onSelect, pendingWinner, seat }: { onSettle: (winner: PlayerId | "split") => void; onSelect: (winner: PlayerId | "split" | null) => void; pendingWinner: PlayerId | "split" | null; seat: "top" | "bottom" }) { const label = (winner: PlayerId | "split") => winner === "split" ? "Split pot" : `Player ${winner + 1} wins`; return <div className="showdown" aria-label={`Choose result (${seat})`}>{([0, "split", 1] as const).map((winner) => <button type="button" key={String(winner)} className={winner === "split" ? "split" : "primary"} onClick={() => pendingWinner === winner ? onSettle(winner) : onSelect(winner)}>{pendingWinner === winner ? `Confirm ${label(winner)}` : label(winner)}</button>)}{pendingWinner !== null && <button type="button" className="quiet" onClick={() => onSelect(null)}>Cancel</button>}</div>; }

function RaiseControls({ player, state, value, setValue, onCancel, onConfirm }: { player: PlayerId; state: MatchState; value: number; setValue: (value: number) => void; onCancel: () => void; onConfirm: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null); const onCancelRef = useRef(onCancel); onCancelRef.current = onCancel; const option = getLegalActions(state, player).find((action) => action.type === "bet" || action.type === "raise"); const allIn = getLegalActions(state, player).find((action) => action.type === "all-in");
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    const closeOnBackdropPointer = (event: PointerEvent) => {
      if (!dialog.open) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onCancelRef.current();
    };
    window.addEventListener("pointerdown", closeOnBackdropPointer, true);
    return () => { window.removeEventListener("pointerdown", closeOnBackdropPointer, true); if (dialog.open) dialog.close(); };
  }, []);
  if (!option) return null; const potShortcut = Math.min(option.maxTo, state.currentBet + state.pot);
  return <dialog ref={dialogRef} className={`raise-panel raise-panel-player-${player}`} aria-labelledby="raise-title" onCancel={(event) => { event.preventDefault(); onCancel(); }} onClick={(event) => { if (event.target === event.currentTarget) onCancel(); }}><h2 id="raise-title">Raise to</h2><output aria-live="polite">{money(value)}</output><div className="stepper"><button type="button" aria-label="Decrease raise by 10" onClick={() => setValue(Math.max(option.minTo, value - 10))}>−10</button><button type="button" aria-label="Increase raise by 10" onClick={() => setValue(Math.min(option.maxTo, value + 10))}>+10</button></div><div className="shortcuts"><button type="button" onClick={() => setValue(option.minTo)}>Minimum</button>{potShortcut > option.minTo && <button type="button" onClick={() => setValue(potShortcut)}>Pot</button>}{allIn && <button type="button" onClick={() => setValue(allIn.to)}>All-in</button>}</div><button type="button" className="primary confirm" onClick={onConfirm}>Confirm {money(value)}</button></dialog>;
}
