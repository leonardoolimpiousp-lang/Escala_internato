"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { getRotationForPreceptor } from "@/server/repositories/rotations";
import { applySlotEdits, type SlotEdits } from "@/server/repositories/slots";

export type SaveSlotsResult = { ok?: boolean; error?: string };

/** Salva edições de vagas do calendário do preceptor (capacidade/exceções). */
export async function saveSlots(
  rotationId: string,
  edits: SlotEdits,
): Promise<SaveSlotsResult> {
  const user = await requireRole("PRECEPTOR");
  const rotation = await getRotationForPreceptor(rotationId, user.id);
  if (!rotation) return { error: "Escala não encontrada." };

  // sanidade: capacidades > 0
  const updates = edits.updates.filter(
    (u) => Number.isInteger(u.capacidade) && u.capacidade > 0,
  );
  const adds = edits.adds.filter(
    (a) => Number.isInteger(a.capacidade) && a.capacidade > 0,
  );

  try {
    await applySlotEdits(rotationId, {
      updates,
      removes: edits.removes,
      adds,
    });
  } catch {
    return { error: "Falha ao salvar as vagas." };
  }

  revalidatePath(`/preceptor/escalas/${rotationId}`);
  return { ok: true };
}
