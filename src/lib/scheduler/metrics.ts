import type { Assignment, Preference, SchedSlot, Turno } from "./types";

/** Horas nominais por turno (configurável; usadas no cálculo de carga). */
export const TURNO_HORAS: Record<Turno, number> = {
  MANHA: 6,
  TARDE: 6,
  NOITE: 12,
};

export type StudentMetrics = {
  studentId: string;
  total: number; // turnos alocados (inclui obrigatórios)
  quero: number;
  posso: number;
  impossivel: number; // deve ser 0
  obrigatorios: number;
  horas: number; // horas totais (TURNO_HORAS)
  satisfacao: number; // 0..100
};

export type ScheduleMetrics = {
  filled: number; // vagas de plantão preenchidas
  totalCapacity: number; // soma das capacidades de plantão
  coverage: number; // 0..1
  quero: number;
  posso: number;
  impossivel: number; // deve ser 0
  satisfacao: number; // 0..100 (média ponderada)
  cargaMin: number;
  cargaMax: number;
  cargaMedia: number;
  horasMedia: number;
  perStudent: StudentMetrics[];
};

/** Calcula métricas de uma escala gerada a partir das alocações. */
export function computeScheduleMetrics(
  assignments: Assignment[],
  slots: SchedSlot[],
  prefs: Map<string, Preference>,
  studentIds: string[],
): ScheduleMetrics {
  const slotsById = new Map(slots.map((s) => [s.id, s]));
  const totalCapacity = slots
    .filter((s) => !s.obrigatorio)
    .reduce((a, s) => a + s.capacidade, 0);

  const per = new Map<string, StudentMetrics>();
  for (const id of studentIds)
    per.set(id, {
      studentId: id,
      total: 0,
      quero: 0,
      posso: 0,
      impossivel: 0,
      obrigatorios: 0,
      horas: 0,
      satisfacao: 0,
    });

  let filled = 0;
  let score = 0;
  let quero = 0;
  let posso = 0;
  let impossivel = 0;

  for (const a of assignments) {
    const slot = slotsById.get(a.slotId);
    if (!slot) continue;
    const m = per.get(a.studentId);
    if (!m) continue;
    m.total++;
    m.horas += TURNO_HORAS[slot.turno];
    if (slot.obrigatorio) {
      m.obrigatorios++;
      continue;
    }
    filled++;
    const p = prefs.get(`${a.studentId}|${a.slotId}`);
    if (p === "QUERO") {
      quero++;
      m.quero++;
      score += 100;
    } else if (p === "POSSO") {
      posso++;
      m.posso++;
      score += 20;
    } else if (p === "IMPOSSIVEL") {
      impossivel++;
      m.impossivel++;
    }
  }

  for (const m of per.values()) {
    const base = m.quero + m.posso;
    m.satisfacao = base ? Math.round((m.quero * 100 + m.posso * 20) / base) : 0;
  }

  const cargas = [...per.values()].map((m) => m.total);
  const cargaMin = cargas.length ? Math.min(...cargas) : 0;
  const cargaMax = cargas.length ? Math.max(...cargas) : 0;
  const cargaMedia = cargas.length
    ? Math.round((cargas.reduce((a, b) => a + b, 0) / cargas.length) * 10) / 10
    : 0;
  const horas = [...per.values()].map((m) => m.horas);
  const horasMedia = horas.length
    ? Math.round((horas.reduce((a, b) => a + b, 0) / horas.length) * 10) / 10
    : 0;

  return {
    filled,
    totalCapacity,
    coverage: totalCapacity ? filled / totalCapacity : 0,
    quero,
    posso,
    impossivel,
    satisfacao: filled ? Math.round(score / filled) : 0,
    cargaMin,
    cargaMax,
    cargaMedia,
    horasMedia,
    perStudent: [...per.values()],
  };
}

/**
 * Horas por aluno em cada semana (seg–dom) da escala.
 * Retorna { studentId: [horasSemana0, horasSemana1, ...] }.
 */
export function computeWeeklyHoras(
  assignments: Assignment[],
  slots: SchedSlot[],
  dateToWeek: Map<string, number>,
  studentIds: string[],
  numWeeks: number,
): Record<string, number[]> {
  const slotsById = new Map(slots.map((s) => [s.id, s]));
  const out: Record<string, number[]> = {};
  for (const id of studentIds) out[id] = new Array(numWeeks).fill(0);
  for (const a of assignments) {
    const slot = slotsById.get(a.slotId);
    if (!slot) continue;
    const wi = dateToWeek.get(slot.data);
    if (wi === undefined || !out[a.studentId]) continue;
    out[a.studentId][wi] += TURNO_HORAS[slot.turno];
  }
  return out;
}
