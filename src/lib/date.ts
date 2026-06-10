/**
 * Utilitários de data baseados em strings ISO (YYYY-MM-DD), sem fuso horário,
 * para casar com as colunas `date` do Postgres/Drizzle.
 */

const DAY_MS = 86_400_000;

function toUTC(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Soma `n` dias a uma data ISO e retorna ISO. */
export function addDaysISO(iso: string, n: number): string {
  return new Date(toUTC(iso).getTime() + n * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Lista todas as datas ISO de `startISO` a `endISO` (inclusive). */
export function enumerateDates(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  const end = toUTC(endISO).getTime();
  for (let t = toUTC(startISO).getTime(); t <= end; t += DAY_MS) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/** Calcula data final (inclusive) a partir do início e nº de semanas. */
export function endFromWeeks(startISO: string, weeks: number): string {
  return addDaysISO(startISO, weeks * 7 - 1);
}

/** Formata ISO como DD/MM/YYYY. */
export function formatBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Dia da semana (0=Dom … 6=Sáb) de uma data ISO. */
export function weekdayISO(iso: string): number {
  return toUTC(iso).getUTCDay();
}

export const WEEKDAYS_PT = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export const WEEKDAYS_PT_SHORT = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;
