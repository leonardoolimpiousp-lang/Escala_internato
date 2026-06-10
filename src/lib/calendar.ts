import { addDaysISO, weekdayISO } from "@/lib/date";

export type Turno = "MANHA" | "TARDE" | "NOITE";

export const TURNOS: Turno[] = ["MANHA", "TARDE", "NOITE"];
export const TURNO_LABEL: Record<Turno, string> = {
  MANHA: "Manhã",
  TARDE: "Tarde",
  NOITE: "Noite",
};

export const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

/** Índice do dia na semana iniciando na segunda (0=Seg … 6=Dom). */
export function mondayIndex(iso: string): number {
  return (weekdayISO(iso) + 6) % 7;
}

export type DateCell = { date: string; inRange: boolean };
export type DateWeek = { weekIndex: number; cells: DateCell[] };

/** Semanas alinhadas Seg–Dom cobrindo [dataInicio, dataFim]. */
export function buildDateWeeks(
  dataInicio: string,
  dataFim: string,
): DateWeek[] {
  const startMonday = addDaysISO(dataInicio, -mondayIndex(dataInicio));
  const weeks: DateWeek[] = [];
  let cursor = startMonday;
  let wi = 0;
  while (cursor <= dataFim) {
    const cells: DateCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDaysISO(cursor, d);
      cells.push({ date, inRange: date >= dataInicio && date <= dataFim });
    }
    weeks.push({ weekIndex: wi++, cells });
    cursor = addDaysISO(cursor, 7);
  }
  return weeks;
}

/** Chave de agrupamento de slots por data+turno. */
export function slotKey(date: string, turno: Turno): string {
  return `${date}|${turno}`;
}

export function ddmm(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
