import { heuristicEngine } from "./heuristic";
import type { SchedulerEngine } from "./types";

/** Motor de geração ativo (heurístico). Trocável por OR-Tools no futuro. */
export const scheduler: SchedulerEngine = heuristicEngine;

export * from "./types";
