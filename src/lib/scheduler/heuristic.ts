import { addDaysISO } from "@/lib/date";
import {
  SCORE,
  type Assignment,
  type GeneratedSchedule,
  type Preference,
  type SchedSlot,
  type SchedulerEngine,
  type SchedulerInput,
} from "./types";

const TURNO_ORDER: Record<string, number> = { MANHA: 0, TARDE: 1, NOITE: 2 };

function bySlot(a: SchedSlot, b: SchedSlot) {
  return (
    a.data.localeCompare(b.data) ||
    TURNO_ORDER[a.turno] - TURNO_ORDER[b.turno] ||
    a.campoId.localeCompare(b.campoId) ||
    a.id.localeCompare(b.id)
  );
}

/** Estado mutável de uma execução (uma variante). */
class Run {
  assignments: Assignment[] = [];
  slotCount = new Map<string, number>();
  occupied = new Set<string>(); // `${studentId}|${data}|${turno}`
  load = new Map<string, number>();
  nights = new Map<string, Set<string>>(); // studentId → datas com NOITE
  maxNights: number;

  constructor(maxNights: number) {
    this.maxNights = maxNights;
  }

  countIn(slotId: string) {
    return this.slotCount.get(slotId) ?? 0;
  }
  loadOf(studentId: string) {
    return this.load.get(studentId) ?? 0;
  }
  isFree(studentId: string, s: SchedSlot) {
    return !this.occupied.has(`${studentId}|${s.data}|${s.turno}`);
  }

  /** Respeita o máximo de noites consecutivas se este slot for adicionado. */
  nightsOk(studentId: string, s: SchedSlot) {
    if (s.turno !== "NOITE") return true;
    const set = this.nights.get(studentId);
    if (!set) return true;
    let run = 1;
    let d = s.data;
    while (set.has(addDaysISO(d, -1))) {
      run++;
      d = addDaysISO(d, -1);
    }
    d = s.data;
    while (set.has(addDaysISO(d, 1))) {
      run++;
      d = addDaysISO(d, 1);
    }
    return run <= this.maxNights;
  }

  canAssign(studentId: string, s: SchedSlot) {
    return (
      this.countIn(s.id) < s.capacidade &&
      this.isFree(studentId, s) &&
      this.nightsOk(studentId, s)
    );
  }

  assign(studentId: string, s: SchedSlot) {
    this.assignments.push({ slotId: s.id, studentId });
    this.slotCount.set(s.id, this.countIn(s.id) + 1);
    this.occupied.add(`${studentId}|${s.data}|${s.turno}`);
    this.load.set(studentId, this.loadOf(studentId) + 1);
    if (s.turno === "NOITE") {
      const set = this.nights.get(studentId) ?? new Set<string>();
      set.add(s.data);
      this.nights.set(studentId, set);
    }
  }
}

function scoreOf(
  prefs: Map<string, Preference>,
  studentId: string,
  slotId: string,
): number {
  const p = prefs.get(`${studentId}|${slotId}`);
  if (p === "QUERO") return SCORE.QUERO;
  if (p === "POSSO") return SCORE.POSSO;
  return -1; // sem preferência ou IMPOSSIVEL → não alocável
}

/** Aloca os slots obrigatórios: todos os alunos participam (atividade fixa). */
function assignObrigatorios(run: Run, input: SchedulerInput, students: string[]) {
  const obrig = input.slots.filter((s) => s.obrigatorio).sort(bySlot);
  for (const s of obrig)
    for (const st of students)
      if (run.isFree(st, s)) run.assign(st, s);
}

const LAMBDA = 15; // peso da equidade na variante C

/**
 * Motor determinístico. Gera 3 variantes:
 * A = máx. satisfação · B = carga equilibrada · C = satisfação + equidade.
 */
export const heuristicEngine: SchedulerEngine = {
  generate(input: SchedulerInput): GeneratedSchedule[] {
    const maxNights = input.config?.maxConsecutiveNights ?? 2;
    const students = [...input.studentIds].sort();
    const plantao = input.slots.filter((s) => !s.obrigatorio).sort(bySlot);

    // ---- Variante A: máxima satisfação (greedy por score) ----
    const A = new Run(maxNights);
    assignObrigatorios(A, input, students);
    const cands: { s: SchedSlot; st: string; score: number }[] = [];
    for (const s of plantao)
      for (const st of students) {
        const score = scoreOf(input.prefs, st, s.id);
        if (score > 0) cands.push({ s, st, score });
      }
    cands.sort(
      (a, b) =>
        b.score - a.score ||
        bySlot(a.s, b.s) ||
        A.loadOf(a.st) - A.loadOf(b.st) ||
        a.st.localeCompare(b.st),
    );
    for (const c of cands) if (A.canAssign(c.st, c.s)) A.assign(c.st, c.s);

    // ---- Variante B: carga equilibrada ----
    const B = new Run(maxNights);
    assignObrigatorios(B, input, students);
    fillByStudentPicker(B, plantao, students, input.prefs, (a, bb, s) => {
      const la = B.loadOf(a);
      const lb = B.loadOf(bb);
      if (la !== lb) return la - lb;
      const sa = scoreOf(input.prefs, a, s.id);
      const sb = scoreOf(input.prefs, bb, s.id);
      return sb - sa || a.localeCompare(bb);
    });

    // ---- Variante C: satisfação + equidade ----
    const C = new Run(maxNights);
    assignObrigatorios(C, input, students);
    fillByStudentPicker(C, plantao, students, input.prefs, (a, bb, s) => {
      const va = scoreOf(input.prefs, a, s.id) - LAMBDA * C.loadOf(a);
      const vb = scoreOf(input.prefs, bb, s.id) - LAMBDA * C.loadOf(bb);
      return vb - va || a.localeCompare(bb);
    });

    return [
      { variante: "A", label: "Máxima satisfação", assignments: A.assignments },
      { variante: "B", label: "Carga equilibrada", assignments: B.assignments },
      {
        variante: "C",
        label: "Satisfação + equidade",
        assignments: C.assignments,
      },
    ];
  },
};

/** Preenche cada slot escolhendo o "melhor" aluno disponível por `compare`. */
function fillByStudentPicker(
  run: Run,
  plantao: SchedSlot[],
  students: string[],
  prefs: Map<string, Preference>,
  compare: (a: string, b: string, s: SchedSlot) => number,
) {
  for (const s of plantao) {
    while (run.countIn(s.id) < s.capacidade) {
      const willing = students.filter(
        (st) => scoreOf(prefs, st, s.id) > 0 && run.canAssign(st, s),
      );
      if (willing.length === 0) break;
      willing.sort((a, b) => compare(a, b, s));
      run.assign(willing[0], s);
    }
  }
}
