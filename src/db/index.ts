import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

/**
 * Singleton do client `postgres-js` cacheado em globalThis.
 *
 * Em dev, o HMR do Turbopack reavalia este módulo a cada alteração; sem o cache,
 * um novo `postgres()` seria criado a cada reload e as conexões antigas vazariam,
 * abertas e ociosas, até esgotar o pool do pgbouncer (transaction pooler do
 * Supabase). Quando o pool enche, novos connects ficam pendurados e estouram o
 * `connect_timeout` (CONNECT_TIMEOUT). `idle_timeout` devolve conexões ociosas
 * ao pooler; `max` limita o uso simultâneo.
 */
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.pgClient ??
  postgres(connectionString, {
    prepare: false, // obrigatório com pgbouncer em transaction mode
    max: 5,
    idle_timeout: 20, // fecha conexões ociosas após 20s
    connect_timeout: 15, // falha mais rápido se o pooler não responder
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
