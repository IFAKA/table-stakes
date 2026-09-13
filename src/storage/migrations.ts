import type { MatchState } from "../game/types";
import { SCHEMA_VERSION } from "../game/types";

export class IncompatibleMatchError extends Error { constructor(version: unknown) { super(`Saved match schema ${String(version)} is not supported by this build.`); this.name = "IncompatibleMatchError"; } }

export function migrateMatch(value: unknown): MatchState | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") throw new IncompatibleMatchError("unknown");
  const version = (value as { schemaVersion?: unknown }).schemaVersion;
  if (version !== SCHEMA_VERSION) throw new IncompatibleMatchError(version);
  return value as MatchState;
}
