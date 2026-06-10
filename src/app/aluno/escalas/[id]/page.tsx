import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { getRotationForStudent } from "@/server/repositories/student-rotations";
import { getSlotsByRotation } from "@/server/repositories/slots";
import {
  getSubmission,
  getStudentSlotPreferences,
  type Preference,
} from "@/server/repositories/preferences";
import {
  getSelectedSchedule,
  getStudentScheduleSlots,
} from "@/server/repositories/schedules";
import { buildDateWeeks } from "@/lib/calendar";
import { formatBR } from "@/lib/date";
import { StudentCalendar } from "@/components/calendar-grid/student-calendar";
import { StudentSchedule } from "@/components/schedule/student-schedule";

export default async function AlunoEscalaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("ALUNO");
  const rotation = await getRotationForStudent(id, user.id);
  if (!rotation) notFound();

  const [slots, submission, prefRows] = await Promise.all([
    getSlotsByRotation(rotation.id),
    getSubmission(rotation.id, user.id),
    getStudentSlotPreferences(rotation.id, user.id),
  ]);

  const weeks = buildDateWeeks(rotation.dataInicio, rotation.dataFim);
  const initialPrefs: Record<string, Preference> = {};
  for (const p of prefRows) initialPrefs[p.slotId] = p.preference;

  // Escala oficial (se já gerada/escolhida pelo preceptor) → vagas do aluno.
  const selected = await getSelectedSchedule(rotation.id);
  const myAssignments = selected
    ? await getStudentScheduleSlots(selected.id, user.id)
    : [];

  return (
    <>
      <AppHeader nome={user.nome} roleLabel="Aluno" />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <Link
          href="/aluno"
          className="text-sm text-gray-500 hover:text-green-primary"
        >
          ← Voltar
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          {rotation.nome}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {formatBR(rotation.dataInicio)} – {formatBR(rotation.dataFim)}
        </p>

        {selected && (
          <section className="mt-8 rounded-[--radius-lg] border border-green-primary/30 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-green-dark">
              Sua escala definida
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Escala oficial publicada pelo preceptor. Estes são os seus turnos.
            </p>
            {myAssignments.length ? (
              <StudentSchedule weeks={weeks} assignments={myAssignments} />
            ) : (
              <p className="text-sm text-gray-500">
                Você não recebeu turnos nesta escala.
              </p>
            )}
          </section>
        )}

        <section className="mt-8 rounded-[--radius-lg] border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">
            Minhas preferências
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Para cada vaga (local × dia × turno), escolha Quero, Posso ou
            Impossível. Avalie todas antes de enviar — não dá para editar depois.
          </p>
          <StudentCalendar
            rotationId={rotation.id}
            slots={slots}
            weeks={weeks}
            submitted={!!submission}
            initialPrefs={initialPrefs}
          />
        </section>
      </main>
    </>
  );
}
