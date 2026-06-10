/**
 * Interface agnóstica ao motor de geração de escalas.
 * Permite trocar a heurística por OR-Tools no futuro sem reescrever o resto.
 */
import type { Turno } from "@/lib/calendar";

export type { Turno };

export type Preference = "QUERO" | "POSSO" | "IMPOSSIVEL";
export type Variante = "A" | "B" | "C";

export type SchedSlot = {
  id: string;
  campoId: string;
  obrigatorio: boolean;
  data: string; // ISO YYYY-MM-DD
  turno: Turno;
  capacidade: number;
};

export type SchedulerInput = {
  studentIds: string[];
  slots: SchedSlot[];
  /** chave `${studentId}|${slotId}` → preferência (apenas vagas avaliadas). */
  prefs: Map<string, Preference>;
  config?: { maxConsecutiveNights?: number };
};

export type Assignment = { slotId: string; studentId: string };

export type GeneratedSchedule = {
  variante: Variante;
  label: string;
  assignments: Assignment[];
};

export interface SchedulerEngine {
  generate(input: SchedulerInput): GeneratedSchedule[];
}

export const SCORE: Record<Exclude<Preference, "IMPOSSIVEL">, number> = {
  QUERO: 100,
  POSSO: 20,
};
