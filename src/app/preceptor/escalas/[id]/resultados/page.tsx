import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { getRotationForPreceptor } from "@/server/repositories/rotations";
import { getSlotsByRotation } from "@/server/repositories/slots";
import { getStudentsByRotation } from "@/server/repositories/student-rotations";
import { getAllSlotPreferences } from "@/server/repositories/preferences";
import {
  getSchedulesForRotation,
  getAssignmentsWithNames,
} from "@/server/repositories/schedules";
import {
  computeScheduleMetrics,
  computeWeeklyHoras,
} from "@/lib/scheduler/metrics";
import type { Preference } from "@/lib/scheduler";
import {
  ScheduleViewer,
  type ViewerItem,
} from "@/components/schedule/schedule-viewer";
import { buildDateWeeks } from "@/lib/calendar";
import { formatBR } from "@/lib/date";

export default async function ResultadosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("PRECEPTOR");
  const rotation = await getRotationForPreceptor(id, user.id);
  if (!rotation) notFound();

  const [schedules, slots, prefRows, students] = await Promise.all([
    getSchedulesForRotation(id),
    getSlotsByRotation(id),
    getAllSlotPreferences(id),
    getStudentsByRotation(id),
  ]);

  const prefs = new Map<string, Preference>(
    prefRows.map((p) => [`${p.studentId}|${p.slotId}`, p.preference]),
  );
  const schedSlots = slots.map((s) => ({
    id: s.id,
    campoId: s.campoId,
    obrigatorio: s.obrigatorio,
    data: s.data,
    turno: s.turno,
    capacidade: s.capacidade,
  }));
  const studentIds = students.map((s) => s.id);
  const studentNames: Record<string, string> = {};
  for (const s of students) studentNames[s.id] = s.nome;

  const weeks = buildDateWeeks(rotation.dataInicio, rotation.dataFim);
  const dateToWeek = new Map<string, number>();
  for (const w of weeks)
    for (const c of w.cells) dateToWeek.set(c.date, w.weekIndex);

  const items: ViewerItem[] = await Promise.all(
    schedules.map(async (sch) => {
      const rows = await getAssignmentsWithNames(sch.id);
      const metrics = computeScheduleMetrics(rows, schedSlots, prefs, studentIds);
      const assignmentsBySlot: Record<string, string[]> = {};
      for (const r of rows) {
        (assignmentsBySlot[r.slotId] ??= []).push(r.nome);
      }
      const weeklyHoras = computeWeeklyHoras(
        rows,
        schedSlots,
        dateToWeek,
        studentIds,
        weeks.length,
      );
      return {
        id: sch.id,
        variante: sch.variante,
        label: sch.label,
        selected: sch.selected,
        metrics,
        assignmentsBySlot,
        weeklyHoras,
      };
    }),
  );

  return (
    <>
      <AppHeader nome={user.nome} roleLabel="Preceptor" />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <Link
          href={`/preceptor/escalas/${id}`}
          className="text-sm text-gray-500 hover:text-green-primary"
        >
          ← Voltar à escala
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          Escalas geradas — {rotation.nome}
        </h1>
        <p className="mt-1 mb-8 text-sm text-gray-500">
          {formatBR(rotation.dataInicio)} – {formatBR(rotation.dataFim)} ·{" "}
          {students.length} alunos
        </p>

        <ScheduleViewer
          rotationId={id}
          weeks={weeks}
          slots={slots}
          studentNames={studentNames}
          items={items}
        />
      </main>
    </>
  );
}
