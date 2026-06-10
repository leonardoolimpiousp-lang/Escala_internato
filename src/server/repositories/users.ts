import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, roleEnum } from "@/db/schema";

export type Role = (typeof roleEnum.enumValues)[number];

export type NewUser = {
  id: string;
  nome: string;
  email: string;
  role: Role;
  turma: string | null;
};

/** Cria o perfil do usuário (chamado após o signUp no Supabase Auth). */
export async function createUserProfile(data: NewUser) {
  const [row] = await db.insert(users).values(data).returning();
  return row;
}

/** Busca o perfil pelo id (= id em auth.users). */
export async function getUserProfile(id: string) {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

/** Busca um perfil pelo email (normalizado em minúsculas). */
export async function getUserByEmail(email: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  return row ?? null;
}
