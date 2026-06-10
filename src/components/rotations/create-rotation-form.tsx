"use client";

import { useActionState, useState } from "react";
import {
  createRotationAction,
  type RotationFormState,
} from "@/server/actions/rotations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: RotationFormState = {};
const WEEKS = [2, 3, 6] as const;

type Estagio = { id: string; nome: string };

export function CreateRotationForm({ estagios }: { estagios: Estagio[] }) {
  const [state, formAction, pending] = useActionState(
    createRotationAction,
    initial,
  );
  const [weeks, setWeeks] = useState<number>(2);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="weeks" value={weeks} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="estagioId">Estágio</Label>
        <select
          id="estagioId"
          name="estagioId"
          required
          defaultValue={state.values?.estagioId ?? ""}
          className="h-11 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-green-primary focus:outline-none focus:ring-1 focus:ring-green-primary"
        >
          <option value="" disabled>
            Selecione um estágio…
          </option>
          {estagios.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nome">Nome da escala</Label>
        <Input
          id="nome"
          name="nome"
          placeholder="Ex.: Clínica Médica — Maio 2027"
          required
          defaultValue={state.values?.nome}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dataInicio">Data de início</Label>
        <Input
          id="dataInicio"
          name="dataInicio"
          type="date"
          required
          defaultValue={state.values?.dataInicio}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Duração</Label>
        <div className="grid grid-cols-3 gap-2">
          {WEEKS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWeeks(w)}
              className={
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors " +
                (weeks === w
                  ? "border-green-primary bg-green-light text-green-dark"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50")
              }
            >
              {w} semanas
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="numeroAlunos">Quantidade de alunos</Label>
        <Input
          id="numeroAlunos"
          name="numeroAlunos"
          type="number"
          min={1}
          required
          defaultValue={state.values?.numeroAlunos}
        />
      </div>

      {state.error && (
        <p className="rounded-md bg-error-bg px-3 py-2 text-sm text-error">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? "Criando escala…" : "Criar escala"}
      </Button>
    </form>
  );
}
