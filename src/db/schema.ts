/**
 * Schema Drizzle — Escala Internato FMUSP.
 * Ver CLAUDE.md → "Modelo de Dados" e o plano de Campos de Prática.
 *
 * Modelo: estágios (templates) → campos de prática → vagas (slots por
 * data/turno/capacidade). Alunos avaliam slots de campos não-obrigatórios.
 *
 * RLS habilitado em todas as tabelas (deny-by-default). Acesso da aplicação
 * é server-side via Drizzle (contorna RLS); autorização em server/repositories.
 */
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  date,
  integer,
  smallint,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

/* ----------------------------- Enums ----------------------------- */

export const roleEnum = pgEnum("role", ["ALUNO", "PRECEPTOR"]);
export const turnoEnum = pgEnum("turno", ["MANHA", "TARDE", "NOITE"]);
export const preferenceEnum = pgEnum("preference", [
  "QUERO",
  "POSSO",
  "IMPOSSIVEL",
]);
export const varianteEnum = pgEnum("variante", ["A", "B", "C"]);

/* --------------------- Templates de estágio ---------------------- */

/** Estágio padrão da FMUSP (template reutilizável). */
export const estagios = pgTable("estagios", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}).enableRLS();

/** Campo de prática (local/atividade) de um template. */
export const estagioCampos = pgTable("estagio_campos", {
  id: uuid("id").primaryKey().defaultRandom(),
  estagioId: uuid("estagio_id")
    .notNull()
    .references(() => estagios.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  ordem: integer("ordem").notNull().default(0),
  obrigatorio: boolean("obrigatorio").notNull().default(false),
}).enableRLS();

/** Padrão semanal de um campo do template (dia-da-semana × turno × vagas). */
export const estagioCampoSlots = pgTable("estagio_campo_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  campoId: uuid("campo_id")
    .notNull()
    .references(() => estagioCampos.id, { onDelete: "cascade" }),
  weekday: smallint("weekday").notNull(), // 0=Seg … 6=Dom
  turno: turnoEnum("turno").notNull(),
  capacidade: integer("capacidade").notNull(),
}).enableRLS();

/* ----------------------------- Usuários -------------------------- */

/** Perfil do usuário. `id` = id em auth.users (Supabase Auth). */
export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  role: roleEnum("role").notNull(),
  turma: text("turma"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}).enableRLS();

/* ----------------------------- Escalas --------------------------- */

/** Escala de internato criada pelo preceptor. */
export const rotations = pgTable("rotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  estagioId: uuid("estagio_id").references(() => estagios.id, {
    onDelete: "set null",
  }),
  dataInicio: date("data_inicio").notNull(),
  dataFim: date("data_fim").notNull(),
  numeroAlunos: integer("numero_alunos").notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}).enableRLS();

/** Alunos participantes de uma escala. */
export const studentRotations = pgTable(
  "student_rotations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rotationId: uuid("rotation_id")
      .notNull()
      .references(() => rotations.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [unique().on(t.rotationId, t.studentId)],
).enableRLS();

/** Campo de prática de uma escala (copiado do template, editável). */
export const campos = pgTable("campos", {
  id: uuid("id").primaryKey().defaultRandom(),
  rotationId: uuid("rotation_id")
    .notNull()
    .references(() => rotations.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  ordem: integer("ordem").notNull().default(0),
  obrigatorio: boolean("obrigatorio").notNull().default(false),
}).enableRLS();

/** Vaga concreta: campo × data × turno × capacidade. */
export const slots = pgTable(
  "slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rotationId: uuid("rotation_id")
      .notNull()
      .references(() => rotations.id, { onDelete: "cascade" }),
    campoId: uuid("campo_id")
      .notNull()
      .references(() => campos.id, { onDelete: "cascade" }),
    data: date("data").notNull(),
    turno: turnoEnum("turno").notNull(),
    capacidade: integer("capacidade").notNull(),
  },
  (t) => [unique().on(t.campoId, t.data, t.turno)],
).enableRLS();

/** Preferência do aluno por uma vaga (só campos não-obrigatórios). */
export const slotPreferences = pgTable(
  "slot_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => slots.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    preference: preferenceEnum("preference").notNull(),
  },
  (t) => [unique().on(t.slotId, t.studentId)],
).enableRLS();

/** Marca de submissão das preferências de um aluno numa escala. */
export const submittedPreferences = pgTable(
  "submitted_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rotationId: uuid("rotation_id")
      .notNull()
      .references(() => rotations.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.rotationId, t.studentId)],
).enableRLS();

/* ----------------------- Escalas geradas ------------------------- */

/** Uma variante de escala gerada (A satisfação, B carga, C equidade). */
export const schedules = pgTable("schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  rotationId: uuid("rotation_id")
    .notNull()
    .references(() => rotations.id, { onDelete: "cascade" }),
  variante: varianteEnum("variante").notNull(),
  label: text("label").notNull(),
  selected: boolean("selected").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}).enableRLS();

/** Alocação de um aluno a uma vaga dentro de uma escala gerada. */
export const scheduleAssignments = pgTable(
  "schedule_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => schedules.id, { onDelete: "cascade" }),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => slots.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [unique().on(t.scheduleId, t.slotId, t.studentId)],
).enableRLS();
