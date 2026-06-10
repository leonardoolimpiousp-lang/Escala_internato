import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  rotations,
  studentRotations,
  submittedPreferences,
  users,
} from "@/db/schema";

/** Rotações em que o aluno participa, com status de submissão. */
export async function listRotationsForStudent(studentId: string) {
  return db
    .select({
      id: rotations.id,
      nome: rotations.nome,
      dataInicio: rotations.dataInicio,
      dataFim: rotations.dataFim,
      submittedAt: submittedPreferences.submittedAt,
    })
    .from(studentRotations)
    .innerJoin(rotations, eq(rotations.id, studentRotations.rotationId))
    .leftJoin(
      submittedPreferences,
      and(
        eq(submittedPreferences.rotationId, rotations.id),
        eq(submittedPreferences.studentId, studentId),
      ),
    )
    .where(eq(studentRotations.studentId, studentId))
    .orderBy(desc(rotations.createdAt));
}

/** Busca uma rotação garantindo que o aluno participa dela. */
export async function getRotationForStudent(
  rotationId: string,
  studentId: string,
) {
  const [row] = await db
    .select({
      id: rotations.id,
      nome: rotations.nome,
      dataInicio: rotations.dataInicio,
      dataFim: rotations.dataFim,
      numeroAlunos: rotations.numeroAlunos,
    })
    .from(rotations)
    .innerJoin(
      studentRotations,
      and(
        eq(studentRotations.rotationId, rotations.id),
        eq(studentRotations.studentId, studentId),
      ),
    )
    .where(eq(rotations.id, rotationId))
    .limit(1);
  return row ?? null;
}

/** Alunos associados a uma rotação. */
export async function getStudentsByRotation(rotationId: string) {
  return db
    .select({
      studentRotationId: studentRotations.id,
      id: users.id,
      nome: users.nome,
      email: users.email,
      turma: users.turma,
    })
    .from(studentRotations)
    .innerJoin(users, eq(users.id, studentRotations.studentId))
    .where(eq(studentRotations.rotationId, rotationId))
    .orderBy(asc(users.nome));
}

/** Verifica se um aluno já está na rotação. */
export async function isStudentInRotation(
  rotationId: string,
  studentId: string,
) {
  const [row] = await db
    .select({ id: studentRotations.id })
    .from(studentRotations)
    .where(
      and(
        eq(studentRotations.rotationId, rotationId),
        eq(studentRotations.studentId, studentId),
      ),
    )
    .limit(1);
  return !!row;
}

/** Adiciona um aluno à rotação. */
export async function addStudentToRotation(
  rotationId: string,
  studentId: string,
) {
  await db.insert(studentRotations).values({ rotationId, studentId });
}

/** Remove um aluno da rotação. */
export async function removeStudentFromRotation(
  rotationId: string,
  studentId: string,
) {
  await db
    .delete(studentRotations)
    .where(
      and(
        eq(studentRotations.rotationId, rotationId),
        eq(studentRotations.studentId, studentId),
      ),
    );
}
