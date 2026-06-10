"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { getRotationForPreceptor } from "@/server/repositories/rotations";
import { getStudentsByRotation } from "@/server/repositories/student-rotations";
import { getSlotsByRotation } from "@/server/repositories/slots";
import { getAllSlotPreferences } from "@/server/repositories/preferences";
import {
  saveGeneratedSchedules,
  selectSchedule,
} from "@/server/repositories/schedules";
import { scheduler, type Preference } from "@/lib/scheduler";

export type GenerateResult = { ok?: boolean; error?: string };

/** Gera as 3 variantes de escala para a rotação e persiste. */
export async function generateSchedulesAction(
  rotationId: string,
): Promise<GenerateResult> {
  const user = await requireRole("PRECEPTOR");
  const rotation = await getRotationForPreceptor(rotationId, user.id);
  if (!rotation) return { error: "Escala não encontrada." };

  const [students, slots, prefRows] = await Promise.all([
    getStudentsByRotation(rotationId),
    getSlotsByRotation(rotationId),
    getAllSlotPreferences(rotationId),
  ]);

  if (students.length === 0)
    return { error: "Adicione alunos à escala antes de gerar." };
  if (slots.length === 0)
    return { error: "A escala não tem vagas." };

  const prefs = new Map<string, Preference>(
    prefRows.map((p) => [`${p.studentId}|${p.slotId}`, p.preference]),
  );

  const results = scheduler.generate({
    studentIds: students.map((s) => s.id),
    slots: slots.map((s) => ({
      id: s.id,
      campoId: s.campoId,
      obrigatorio: s.obrigatorio,
      data: s.data,
      turno: s.turno,
      capacidade: s.capacidade,
    })),
    prefs,
    config: { maxConsecutiveNights: 2 },
  });

  try {
    await saveGeneratedSchedules(rotationId, results);
  } catch {
    return { error: "Falha ao salvar as escalas geradas." };
  }

  revalidatePath(`/preceptor/escalas/${rotationId}`);
  revalidatePath(`/preceptor/escalas/${rotationId}/resultados`);
  return { ok: true };
}

/** Marca uma variante como a escala oficial. */
export async function selectScheduleAction(
  rotationId: string,
  scheduleId: string,
): Promise<GenerateResult> {
  const user = await requireRole("PRECEPTOR");
  const rotation = await getRotationForPreceptor(rotationId, user.id);
  if (!rotation) return { error: "Escala não encontrada." };
  await selectSchedule(rotationId, scheduleId);
  revalidatePath(`/preceptor/escalas/${rotationId}/resultados`);
  return { ok: true };
}
