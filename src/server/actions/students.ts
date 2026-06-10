"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { getRotationForPreceptor } from "@/server/repositories/rotations";
import { getUserByEmail } from "@/server/repositories/users";
import {
  addStudentToRotation,
  isStudentInRotation,
  removeStudentFromRotation,
} from "@/server/repositories/student-rotations";

export type StudentActionState = { error?: string; message?: string };

/** Adiciona um aluno (por email) à rotação. */
export async function addStudentAction(
  rotationId: string,
  _prev: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const user = await requireRole("PRECEPTOR");
  const rotation = await getRotationForPreceptor(rotationId, user.id);
  if (!rotation) return { error: "Escala não encontrada." };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "Informe o email do aluno." };

  const student = await getUserByEmail(email);
  if (!student) return { error: "Nenhum usuário com esse email." };
  if (student.role !== "ALUNO")
    return { error: "Esse usuário não é um aluno." };

  if (await isStudentInRotation(rotationId, student.id))
    return { error: "Aluno já está nesta escala." };

  await addStudentToRotation(rotationId, student.id);
  revalidatePath(`/preceptor/escalas/${rotationId}`);
  return { message: `${student.nome} adicionado.` };
}

/** Remove um aluno da rotação. */
export async function removeStudentAction(
  rotationId: string,
  studentId: string,
): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireRole("PRECEPTOR");
  const rotation = await getRotationForPreceptor(rotationId, user.id);
  if (!rotation) return { error: "Escala não encontrada." };

  await removeStudentFromRotation(rotationId, studentId);
  revalidatePath(`/preceptor/escalas/${rotationId}`);
  return { ok: true };
}
