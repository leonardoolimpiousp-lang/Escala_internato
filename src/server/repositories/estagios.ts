import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { estagios, estagioCampos, estagioCampoSlots } from "@/db/schema";

/** Lista os estágios (templates) disponíveis. */
export async function listEstagios() {
  return db
    .select({
      id: estagios.id,
      nome: estagios.nome,
      descricao: estagios.descricao,
    })
    .from(estagios)
    .orderBy(asc(estagios.nome));
}

export type TemplateCampo = {
  nome: string;
  ordem: number;
  obrigatorio: boolean;
  slots: { weekday: number; turno: "MANHA" | "TARDE" | "NOITE"; capacidade: number }[];
};

/** Campos + padrão semanal de um estágio (para expandir na criação da escala). */
export async function getEstagioCampos(
  estagioId: string,
): Promise<TemplateCampo[]> {
  const campos = await db
    .select({
      id: estagioCampos.id,
      nome: estagioCampos.nome,
      ordem: estagioCampos.ordem,
      obrigatorio: estagioCampos.obrigatorio,
    })
    .from(estagioCampos)
    .where(eq(estagioCampos.estagioId, estagioId))
    .orderBy(asc(estagioCampos.ordem));

  if (campos.length === 0) return [];

  const slotRows = await db
    .select({
      campoId: estagioCampoSlots.campoId,
      weekday: estagioCampoSlots.weekday,
      turno: estagioCampoSlots.turno,
      capacidade: estagioCampoSlots.capacidade,
    })
    .from(estagioCampoSlots)
    .where(
      inArray(
        estagioCampoSlots.campoId,
        campos.map((c) => c.id),
      ),
    );

  return campos.map((c) => ({
    nome: c.nome,
    ordem: c.ordem,
    obrigatorio: c.obrigatorio,
    slots: slotRows
      .filter((s) => s.campoId === c.id)
      .map((s) => ({
        weekday: s.weekday,
        turno: s.turno,
        capacidade: s.capacidade,
      })),
  }));
}
