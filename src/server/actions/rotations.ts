"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createRotation } from "@/server/repositories/rotations";

export type RotationFormState = {
  error?: string;
  values?: {
    nome?: string;
    estagioId?: string;
    dataInicio?: string;
    numeroAlunos?: string;
  };
};

const WEEKS_ALLOWED = [2, 3, 6];

export async function createRotationAction(
  _prev: RotationFormState,
  formData: FormData,
): Promise<RotationFormState> {
  const user = await requireRole("PRECEPTOR");

  const nome = String(formData.get("nome") ?? "").trim();
  const estagioId = String(formData.get("estagioId") ?? "").trim();
  const dataInicio = String(formData.get("dataInicio") ?? "").trim();
  const weeks = Number(formData.get("weeks"));
  const numeroAlunos = Number(formData.get("numeroAlunos"));

  const values = {
    nome,
    estagioId,
    dataInicio,
    numeroAlunos: formData.get("numeroAlunos")?.toString(),
  };

  if (!nome) return { error: "Informe um nome para a escala.", values };
  if (!estagioId) return { error: "Selecione o estágio.", values };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataInicio))
    return { error: "Informe uma data de início válida.", values };
  if (!WEEKS_ALLOWED.includes(weeks))
    return { error: "Selecione a duração (2, 3 ou 6 semanas).", values };
  if (!Number.isInteger(numeroAlunos) || numeroAlunos < 1)
    return { error: "Informe a quantidade de alunos (mínimo 1).", values };

  let rotationId: string;
  try {
    const rotation = await createRotation({
      nome,
      estagioId,
      dataInicio,
      weeks,
      numeroAlunos,
      createdBy: user.id,
    });
    rotationId = rotation.id;
  } catch {
    return { error: "Falha ao criar a escala. Tente novamente.", values };
  }

  redirect(`/preceptor/escalas/${rotationId}`);
}
