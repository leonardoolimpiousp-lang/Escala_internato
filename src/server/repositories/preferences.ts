import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  slotPreferences,
  slots,
  submittedPreferences,
  type preferenceEnum,
} from "@/db/schema";

export type Preference = (typeof preferenceEnum.enumValues)[number];

/** Marca de submissão do aluno numa rotação (ou null). */
export async function getSubmission(rotationId: string, studentId: string) {
  const [row] = await db
    .select({ submittedAt: submittedPreferences.submittedAt })
    .from(submittedPreferences)
    .where(
      and(
        eq(submittedPreferences.rotationId, rotationId),
        eq(submittedPreferences.studentId, studentId),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Preferências já enviadas pelo aluno (slotId → preference). */
export async function getStudentSlotPreferences(
  rotationId: string,
  studentId: string,
) {
  return db
    .select({
      slotId: slotPreferences.slotId,
      preference: slotPreferences.preference,
    })
    .from(slotPreferences)
    .innerJoin(slots, eq(slots.id, slotPreferences.slotId))
    .where(
      and(
        eq(slots.rotationId, rotationId),
        eq(slotPreferences.studentId, studentId),
      ),
    );
}

/** Todas as preferências enviadas na rotação (entrada do gerador). */
export async function getAllSlotPreferences(rotationId: string) {
  return db
    .select({
      studentId: slotPreferences.studentId,
      slotId: slotPreferences.slotId,
      preference: slotPreferences.preference,
    })
    .from(slotPreferences)
    .innerJoin(slots, eq(slots.id, slotPreferences.slotId))
    .where(eq(slots.rotationId, rotationId));
}

/** Persiste as preferências por vaga e marca a submissão (transação). */
export async function submitStudentPreferences(
  rotationId: string,
  studentId: string,
  prefs: { slotId: string; preference: Preference }[],
) {
  await db.transaction(async (tx) => {
    if (prefs.length)
      await tx.insert(slotPreferences).values(
        prefs.map((p) => ({
          slotId: p.slotId,
          studentId,
          preference: p.preference,
        })),
      );
    await tx.insert(submittedPreferences).values({ rotationId, studentId });
  });
}
