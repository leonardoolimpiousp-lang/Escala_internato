"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthState = {};

export function LoginForm({ showConfirm }: { showConfirm?: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {showConfirm && (
        <p className="rounded-md bg-green-light px-3 py-2 text-sm text-green-dark">
          Conta criada! Confirme seu email antes de entrar.
        </p>
      )}

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
          autoComplete="current-password"
        />
      </div>

      {state.error && (
        <p className="rounded-md bg-error-bg px-3 py-2 text-sm text-error">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? "Entrando…" : "Entrar"}
      </Button>

      <p className="text-center text-sm text-gray-500">
        Não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-green-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
