"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addStudentAction,
  removeStudentAction,
  type StudentActionState,
} from "@/server/actions/students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Student = {
  id: string;
  nome: string;
  email: string;
  turma: string | null;
};

const initial: StudentActionState = {};

export function StudentManager({
  rotationId,
  students,
  numeroAlunos,
}: {
  rotationId: string;
  students: Student[];
  numeroAlunos: number;
}) {
  const router = useRouter();
  const addBound = addStudentAction.bind(null, rotationId);
  const [state, formAction, pending] = useActionState(addBound, initial);
  const [removing, startRemoving] = useTransition();

  // Após adicionar com sucesso, atualiza a lista (vinda do servidor).
  useEffect(() => {
    if (state.message) router.refresh();
  }, [state.message, router]);

  function remove(studentId: string) {
    startRemoving(async () => {
      await removeStudentAction(rotationId, studentId);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Alunos</h2>
        <span className="text-sm text-gray-500">
          {students.length} de {numeroAlunos}
        </span>
      </div>

      <form action={formAction} className="flex items-start gap-2">
        <div className="flex-1">
          <Input
            name="email"
            type="email"
            placeholder="email do aluno"
            required
          />
          {state.error && (
            <p className="mt-1 text-sm text-error">{state.error}</p>
          )}
          {state.message && (
            <p className="mt-1 text-sm text-green-primary">{state.message}</p>
          )}
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Adicionando…" : "Adicionar"}
        </Button>
      </form>

      {students.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">
          Nenhum aluno adicionado ainda.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-gray-100">
          {students.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{s.nome}</p>
                <p className="text-xs text-gray-500">
                  {s.email}
                  {s.turma ? ` · ${s.turma}` : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={removing}
                onClick={() => remove(s.id)}
              >
                Remover
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
