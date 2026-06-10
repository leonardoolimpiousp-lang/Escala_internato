CREATE TYPE "public"."preference" AS ENUM('QUERO', 'POSSO', 'IMPOSSIVEL');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ALUNO', 'PRECEPTOR');--> statement-breakpoint
CREATE TYPE "public"."tipo" AS ENUM('PLANTAO', 'AULA', 'PROVA');--> statement-breakpoint
CREATE TYPE "public"."turno" AS ENUM('MANHA', 'TARDE', 'NOITE');--> statement-breakpoint
CREATE TABLE "draft_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"preference" "preference" NOT NULL,
	CONSTRAINT "draft_preferences_shift_id_student_id_unique" UNIQUE("shift_id","student_id")
);
--> statement-breakpoint
ALTER TABLE "draft_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"data_inicio" date NOT NULL,
	"data_fim" date NOT NULL,
	"numero_alunos" integer NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rotations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "shift_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"preference" "preference" NOT NULL,
	CONSTRAINT "shift_preferences_shift_id_student_id_unique" UNIQUE("shift_id","student_id")
);
--> statement-breakpoint
ALTER TABLE "shift_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rotation_id" uuid NOT NULL,
	"data" date NOT NULL,
	"turno" "turno" NOT NULL,
	"tipo" "tipo" DEFAULT 'PLANTAO' NOT NULL,
	CONSTRAINT "shifts_rotation_id_data_turno_unique" UNIQUE("rotation_id","data","turno")
);
--> statement-breakpoint
ALTER TABLE "shifts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "student_rotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rotation_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	CONSTRAINT "student_rotations_rotation_id_student_id_unique" UNIQUE("rotation_id","student_id")
);
--> statement-breakpoint
ALTER TABLE "student_rotations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "submitted_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rotation_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submitted_preferences_rotation_id_student_id_unique" UNIQUE("rotation_id","student_id")
);
--> statement-breakpoint
ALTER TABLE "submitted_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"role" "role" NOT NULL,
	"turma" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "draft_preferences" ADD CONSTRAINT "draft_preferences_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_preferences" ADD CONSTRAINT "draft_preferences_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rotations" ADD CONSTRAINT "rotations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_preferences" ADD CONSTRAINT "shift_preferences_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_preferences" ADD CONSTRAINT "shift_preferences_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_rotation_id_rotations_id_fk" FOREIGN KEY ("rotation_id") REFERENCES "public"."rotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_rotations" ADD CONSTRAINT "student_rotations_rotation_id_rotations_id_fk" FOREIGN KEY ("rotation_id") REFERENCES "public"."rotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_rotations" ADD CONSTRAINT "student_rotations_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submitted_preferences" ADD CONSTRAINT "submitted_preferences_rotation_id_rotations_id_fk" FOREIGN KEY ("rotation_id") REFERENCES "public"."rotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submitted_preferences" ADD CONSTRAINT "submitted_preferences_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;