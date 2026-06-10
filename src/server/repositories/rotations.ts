import "server-only";
import { and, eq, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { rotations, campos, slots } from "@/db/schema";
import { endFromWeeks, enumerateDates } from "@/lib/date";
import { mondayIndex } from "@/lib/calendar";
import { getEstagioCampos } from "@/server/repositories/estagios";

export type NewRotation = {
  nome: string;
  estagioId: string;
  dataInicio: string; // ISO YYYY-MM-DD
  weeks: number; // 2 | 3 | 6
  numeroAlunos: number;
  createdBy: string;
};

/**
 * Cria a rotação e expande os campos/vagas do estágio template:
 * para cada campo, gera os slots nas datas cujo dia-da-semana casa com o padrão.
 */
export async function createRotation(input: NewRotation) {
  const dataFim = endFromWeeks(input.dataInicio, input.weeks);
  const dias = enumerateDates(input.dataInicio, dataFim);
  const templateCampos = await getEstagioCampos(input.estagioId);

  return await db.transaction(async (tx) => {
    const [rotation] = await tx
      .insert(rotations)
      .values({
        nome: input.nome,
        estagioId: input.estagioId,
        dataInicio: input.dataInicio,
        dataFim,
        numeroAlunos: input.numeroAlunos,
        createdBy: input.createdBy,
      })
      .returning();

    let ordem = 0;
    for (const tc of templateCampos) {
      const [campo] = await tx
        .insert(campos)
        .values({
          rotationId: rotation.id,
          nome: tc.nome,
          ordem: ordem++,
          obrigatorio: tc.obrigatorio,
        })
        .returning();

      const slotRows = [];
      for (const dia of dias) {
        const wd = mondayIndex(dia);
        for (const pat of tc.slots)
          if (pat.weekday === wd)
            slotRows.push({
              rotationId: rotation.id,
              campoId: campo.id,
              data: dia,
              turno: pat.turno,
              capacidade: pat.capacidade,
            });
      }
      if (slotRows.length) await tx.insert(slots).values(slotRows);
    }

    return rotation;
  });
}

/** Lista as rotações criadas por um preceptor, com contagem de vagas. */
export async function listRotationsByPreceptor(preceptorId: string) {
  return db
    .select({
      id: rotations.id,
      nome: rotations.nome,
      dataInicio: rotations.dataInicio,
      dataFim: rotations.dataFim,
      numeroAlunos: rotations.numeroAlunos,
      createdAt: rotations.createdAt,
      totalSlots: sql<number>`count(${slots.id})::int`,
    })
    .from(rotations)
    .leftJoin(slots, eq(slots.rotationId, rotations.id))
    .where(eq(rotations.createdBy, preceptorId))
    .groupBy(rotations.id)
    .orderBy(desc(rotations.createdAt));
}

/** Busca uma rotação garantindo que pertence ao preceptor. */
export async function getRotationForPreceptor(
  rotationId: string,
  preceptorId: string,
) {
  const [row] = await db
    .select()
    .from(rotations)
    .where(
      and(eq(rotations.id, rotationId), eq(rotations.createdBy, preceptorId)),
    )
    .limit(1);
  return row ?? null;
}

/** Conta as vagas (slots) de uma rotação. */
export async function countSlots(rotationId: string) {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(slots)
    .where(eq(slots.rotationId, rotationId));
  return row?.total ?? 0;
}
