"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signupAction, type AuthState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthState = {};

type Role = "ALUNO" | "PRECEPTOR";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initial);
  const [role, setRole] = useState<Role>("ALUNO");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="role" value={role} />

      <div className="flex flex-col gap-1.5">
        <Label>Eu sou</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["ALUNO", "PRECEPTOR"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors " +
                (role === r
                  ? "border-green-primary bg-green-light text-green-dark"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50")
              }
            >
              {r === "ALUNO" ? "Aluno" : "Preceptor"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nome">Nome completo</Label>
        <Input
          id="nome"
          name="nome"
          required
          autoComplete="name"
          defaultValue={state.values?.nome}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="turma">Turma</Label>
        <Input
          id="turma"
          name="turma"
          placeholder="Ex.: 96ª turma"
          defaultValue={state.values?.turma}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.values?.email}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      {state.error && (
        <p className="rounded-md bg-error-bg px-3 py-2 text-sm text-error">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? "Criando conta…" : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-gray-500">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-green-primary hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
