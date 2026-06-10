import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import {
  getRotationForPreceptor,
  countSlots,
} from "@/server/repositories/rotations";
import {
  getCamposByRotation,
  getSlotsByRotation,
} from "@/server/repositories/slots";
import { getStudentsByRotation } from "@/server/repositories/student-rotations";
import { buildDateWeeks } from "@/lib/calendar";
import { formatBR } from "@/lib/date";
import { CamposManager } from "@/components/calendar-grid/campos-manager";
import { StudentManager } from "@/components/students/student-manager";
import { buttonVariants } from "@/components/ui/button";

export default async function EscalaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("PRECEPTOR");
  const rotation = await getRotationForPreceptor(id, user.id);
  if (!rotation) notFound();

  const [campos, slots, students, totalSlots] = await Promise.all([
    getCamposByRotation(rotation.id),
    getSlotsByRotation(rotation.id),
    getStudentsByRotation(rotation.id),
    countSlots(rotation.id),
  ]);

  const weeks = buildDateWeeks(rotation.dataInicio, rotation.dataFim);

  return (
    <>
      <AppHeader nome={user.nome} roleLabel="Preceptor" />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <Link
          href="/preceptor"
          className="text-sm text-gray-500 hover:text-green-primary"
        >
          ← Voltar
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{rotation.nome}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {formatBR(rotation.dataInicio)} – {formatBR(rotation.dataFim)} ·{" "}
              {campos.length} campos · {totalSlots} vagas
            </p>
          </div>
          <Link
            href={`/preceptor/escalas/${rotation.id}/resultados`}
            className={buttonVariants()}
          >
            Gerar / ver escalas
          </Link>
        </div>

        <section className="mt-8 rounded-[--radius-lg] border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Campos de prática e vagas
          </h2>
          <CamposManager
            rotationId={rotation.id}
            campos={campos}
            slots={slots}
            weeks={weeks}
          />
        </section>

        <section className="mt-6 rounded-[--radius-lg] border border-gray-200 bg-white p-6 shadow-sm">
          <StudentManager
            rotationId={rotation.id}
            students={students}
            numeroAlunos={rotation.numeroAlunos}
          />
        </section>
      </main>
    </>
  );
}
