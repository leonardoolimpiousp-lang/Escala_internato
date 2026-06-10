import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  schedules,
  scheduleAssignments,
  slots,
  campos,
  users,
} from "@/db/schema";
import type { GeneratedSchedule } from "@/lib/scheduler";

/** Substitui as escalas geradas da rotação pelas novas (transação). */
export async function saveGeneratedSchedules(
  rotationId: string,
  results: GeneratedSchedule[],
) {
  await db.transaction(async (tx) => {
    await tx.delete(schedules).where(eq(schedules.rotationId, rotationId));
    for (const r of results) {
      const [sched] = await tx
        .insert(schedules)
        .values({
          rotationId,
          variante: r.variante,
          label: r.label,
        })
        .returning();
      if (r.assignments.length)
        await tx.insert(scheduleAssignments).values(
          r.assignments.map((a) => ({
            scheduleId: sched.id,
            slotId: a.slotId,
            studentId: a.studentId,
          })),
        );
    }
  });
}

/** Escalas geradas de uma rotação. */
export async function getSchedulesForRotation(rotationId: string) {
  return db
    .select({
      id: schedules.id,
      variante: schedules.variante,
      label: schedules.label,
      selected: schedules.selected,
      createdAt: schedules.createdAt,
    })
    .from(schedules)
    .where(eq(schedules.rotationId, rotationId))
    .orderBy(asc(schedules.variante));
}

/** Alocações de uma escala gerada. */
export async function getScheduleAssignments(scheduleId: string) {
  return db
    .select({
      slotId: scheduleAssignments.slotId,
      studentId: scheduleAssignments.studentId,
    })
    .from(scheduleAssignments)
    .where(eq(scheduleAssignments.scheduleId, scheduleId));
}

/** Alocações de uma escala com o nome do aluno. */
export async function getAssignmentsWithNames(scheduleId: string) {
  return db
    .select({
      slotId: scheduleAssignments.slotId,
      studentId: scheduleAssignments.studentId,
      nome: users.nome,
    })
    .from(scheduleAssignments)
    .innerJoin(users, eq(users.id, scheduleAssignments.studentId))
    .where(eq(scheduleAssignments.scheduleId, scheduleId));
}

/** Escala marcada como oficial (ou null). */
export async function getSelectedSchedule(rotationId: string) {
  const [row] = await db
    .select({
      id: schedules.id,
      variante: schedules.variante,
      label: schedules.label,
    })
    .from(schedules)
    .where(
      and(eq(schedules.rotationId, rotationId), eq(schedules.selected, true)),
    )
    .limit(1);
  return row ?? null;
}

/** Vagas atribuídas a um aluno numa escala (para a visão do aluno). */
export async function getStudentScheduleSlots(
  scheduleId: string,
  studentId: string,
) {
  return db
    .select({
      slotId: scheduleAssignments.slotId,
      campoNome: campos.nome,
      obrigatorio: campos.obrigatorio,
      data: slots.data,
      turno: slots.turno,
    })
    .from(scheduleAssignments)
    .innerJoin(slots, eq(slots.id, scheduleAssignments.slotId))
    .innerJoin(campos, eq(campos.id, slots.campoId))
    .where(
      and(
        eq(scheduleAssignments.scheduleId, scheduleId),
        eq(scheduleAssignments.studentId, studentId),
      ),
    )
    .orderBy(asc(slots.data), asc(slots.turno));
}

/** Marca uma variante como escolhida (e desmarca as demais). */
export async function selectSchedule(rotationId: string, scheduleId: string) {
  await db.transaction(async (tx) => {
    await tx
      .update(schedules)
      .set({ selected: false })
      .where(eq(schedules.rotationId, rotationId));
    await tx
      .update(schedules)
      .set({ selected: true })
      .where(
        and(
          eq(schedules.id, scheduleId),
          eq(schedules.rotationId, rotationId),
        ),
      );
  });
}
