import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { campos, slots } from "@/db/schema";
import type { Turno } from "@/lib/calendar";

/** Campos de uma rotação (ordenados). */
export async function getCamposByRotation(rotationId: string) {
  return db
    .select({
      id: campos.id,
      nome: campos.nome,
      ordem: campos.ordem,
      obrigatorio: campos.obrigatorio,
    })
    .from(campos)
    .where(eq(campos.rotationId, rotationId))
    .orderBy(asc(campos.ordem));
}

export type SlotRow = {
  id: string;
  campoId: string;
  campoNome: string;
  obrigatorio: boolean;
  data: string;
  turno: Turno;
  capacidade: number;
};

/** Vagas de uma rotação, com nome/obrigatoriedade do campo. */
export async function getSlotsByRotation(
  rotationId: string,
): Promise<SlotRow[]> {
  return db
    .select({
      id: slots.id,
      campoId: slots.campoId,
      campoNome: campos.nome,
      obrigatorio: campos.obrigatorio,
      data: slots.data,
      turno: slots.turno,
      capacidade: slots.capacidade,
    })
    .from(slots)
    .innerJoin(campos, eq(campos.id, slots.campoId))
    .where(eq(slots.rotationId, rotationId))
    .orderBy(asc(campos.ordem), asc(slots.data), asc(slots.turno));
}

export type SlotEdits = {
  updates: { id: string; capacidade: number }[];
  removes: string[];
  adds: { campoId: string; data: string; turno: Turno; capacidade: number }[];
};

/** Aplica edições de vagas (capacidade/remoção/adição) numa transação. */
export async function applySlotEdits(rotationId: string, edits: SlotEdits) {
  await db.transaction(async (tx) => {
    for (const u of edits.updates) {
      await tx
        .update(slots)
        .set({ capacidade: u.capacidade })
        .where(and(eq(slots.id, u.id), eq(slots.rotationId, rotationId)));
    }
    if (edits.removes.length) {
      await tx
        .delete(slots)
        .where(
          and(
            eq(slots.rotationId, rotationId),
            inArray(slots.id, edits.removes),
          ),
        );
    }
    if (edits.adds.length) {
      await tx
        .insert(slots)
        .values(
          edits.adds.map((a) => ({ ...a, rotationId })),
        )
        .onConflictDoNothing();
    }
  });
}
