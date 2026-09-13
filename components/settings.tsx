"use client";

import { useEffect, useState } from "react";
import { createMatch, startHand } from "@/src/game/state";
import type { MatchConfig } from "@/src/game/types";
import { loadMatch, saveMatch } from "@/src/storage/repository";
import { DEFAULT_CONFIG } from "@/src/ui/config";

export function Settings() {
  const [config, setConfig] = useState<MatchConfig>(DEFAULT_CONFIG);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void loadMatch().then((saved) => { setConfig(saved?.config ?? DEFAULT_CONFIG); setReady(true); }).catch(() => setError("Saved settings could not be opened.")); }, []);
  if (error) return <section className="boot" role="alert"><div className="message-stage"><h1>Settings unavailable</h1><p className="intro">{error}</p><a className="nav-link" href="/">Return to table</a></div></section>;
  if (!ready) return <section className="boot" aria-label="Loading settings"><div className="message-stage"><h1>Loading settings</h1></div></section>;
  const updateStack = (value: number) => setConfig((current) => ({ ...current, startingStacks: [value, value] }));
  return <section className="settings" aria-labelledby="settings-title"><h1 id="settings-title">Settings</h1><form onSubmit={async (event) => { event.preventDefault(); const saved = await loadMatch(); if (saved && saved.matchStatus !== "setup" && !window.confirm("Start a new match and discard the current match?")) return; const next = startHand(createMatch(config)); await saveMatch(next); window.location.assign("/"); }}><fieldset className="form-group"><legend>Table settings</legend><div className="form-row"><label htmlFor="starting-stack">Starting stack</label><input id="starting-stack" required type="number" min="40" max="1000" step="10" value={config.startingStacks[0]} onChange={(event) => updateStack(Number(event.target.value))} /></div><div className="form-row"><label htmlFor="small-blind">Small blind <span className="label-detail">Big blind {config.bigBlind}</span></label><input id="small-blind" required type="number" min="1" max="500" step="1" value={config.smallBlind} onChange={(event) => setConfig((current) => ({ ...current, smallBlind: Number(event.target.value), bigBlind: Number(event.target.value) * 2 }))} /></div></fieldset><button className="primary start" type="submit">Start new match</button></form></section>;
}
