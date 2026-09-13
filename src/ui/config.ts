import type { MatchConfig } from "@/src/game/types";

export const DEFAULT_CONFIG: MatchConfig = {
  startingStacks: [1000, 1000],
  smallBlind: 10,
  bigBlind: 20,
  dealer: 0,
};
