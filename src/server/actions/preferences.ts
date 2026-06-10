"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { getRotationForStudent } from "@/server/repositories/student-rotations";
import { getSlotsByRotation } from "@/server/repositories/slots";
import {
  getSubmission,
  submitStudentPreferences,
  type Preference,
} from "@/server/repositories/preferences";

const PREFS: Preference[] = ["QUERO", "POSSO", "IMPOSSIVEL"];

export type SubmitResult = { ok?: boolean; error?: string };

/** Valida e persiste as preferências do aluno (apenas vagas não-obrigatórias). */
export async function submitPreferencesAction(
  rotationId: string,
  prefs: { slotId: string; preference: Preference }[],
): Promise<SubmitResult> {
  const user = await requireRole("ALUNO");

  const rotation = await getRotationForStudent(rotationId, user.id);
  if (!rotation) return { error: "Escala não encontrada." };

  if (await getSubmission(rotationId, user.id))
    return { error: "Você já enviou suas preferências." };

  const allSlots = await getSlotsByRotation(rotationId);
  const required = new Set(
    allSlots.filter((s) => !s.obrigatorio).map((s) => s.id),
  );

  const byId = new Map<string, Preference>();
  for (const p of prefs) {
    if (required.has(p.slotId) && PREFS.includes(p.preference))
      byId.set(p.slotId, p.preference);
  }

  if (byId.size !== required.size)
    return { error: "Avalie todas as vagas antes de enviar." };

  try {
    await submitStudentPreferences(
      rotationId,
      user.id,
      [...byId.entries()].map(([slotId, preference]) => ({
        slotId,
        preference,
      })),
    );
  } catch {
    return { error: "Falha ao enviar. Tente novamente." };
  }

  revalidatePath(`/aluno/escalas/${rotationId}`);
  revalidatePath("/aluno");
  return { ok: true };
}
