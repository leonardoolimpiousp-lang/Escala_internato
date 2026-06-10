import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile, type Role } from "@/server/repositories/users";

/** Usuário autenticado do Supabase, ou null. */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Perfil completo (auth + tabela users), ou null. */
export async function getCurrentUser() {
  const authUser = await getAuthUser();
  if (!authUser) return null;
  const profile = await getUserProfile(authUser.id);
  if (!profile) return null;
  return profile;
}

/** Exige usuário logado com perfil; senão redireciona para /login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Exige um papel específico; senão redireciona para a área correta. */
export async function requireRole(role: Role) {
  const user = await requireUser();
  if (user.role !== role) {
    redirect(user.role === "PRECEPTOR" ? "/preceptor" : "/aluno");
  }
  return user;
}

/** Caminho da área inicial conforme o papel. */
export function homePathForRole(role: Role) {
  return role === "PRECEPTOR" ? "/preceptor" : "/aluno";
}
