"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createUserProfile, getUserProfile } from "@/server/repositories/users";
import { homePathForRole } from "@/lib/auth";

export type AuthState = {
  error?: string;
  message?: string;
  values?: { nome?: string; turma?: string; email?: string };
};

const ROLES = ["ALUNO", "PRECEPTOR"] as const;

export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const turma = String(formData.get("turma") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");

  const values = { nome, turma, email };
  if (!nome) return { error: "Informe seu nome.", values };
  if (!email) return { error: "Informe um email.", values };
  if (password.length < 6)
    return { error: "A senha deve ter ao menos 6 caracteres.", values };
  if (!ROLES.includes(role as (typeof ROLES)[number]))
    return { error: "Selecione um perfil válido.", values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome, turma, role } },
  });

  if (error) return { error: error.message, values };
  if (!data.user) return { error: "Não foi possível criar a conta.", values };

  // Cria o perfil na tabela users (server-side, via Drizzle).
  try {
    const existing = await getUserProfile(data.user.id);
    if (!existing) {
      await createUserProfile({
        id: data.user.id,
        nome,
        email,
        role: role as (typeof ROLES)[number],
        turma: turma || null,
      });
    }
  } catch {
    return { error: "Conta criada, mas falhou ao salvar o perfil.", values };
  }

  // Sem sessão = confirmação de email exigida pelo Supabase.
  if (!data.session) {
    redirect("/login?confirm=1");
  }

  redirect(homePathForRole(role as (typeof ROLES)[number]));
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password)
    return { error: "Informe email e senha.", values: { email } };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: "Email ou senha inválidos.", values: { email } };

  const profile = await getUserProfile(data.user.id);
  redirect(profile ? homePathForRole(profile.role) : "/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
