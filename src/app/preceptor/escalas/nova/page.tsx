import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { CreateRotationForm } from "@/components/rotations/create-rotation-form";
import { listEstagios } from "@/server/repositories/estagios";

export default async function NovaEscalaPage() {
  const user = await requireRole("PRECEPTOR");
  const estagios = await listEstagios();

  return (
    <>
      <AppHeader nome={user.nome} roleLabel="Preceptor" />
      <main className="mx-auto w-full max-w-xl px-6 py-10">
        <Link
          href="/preceptor"
          className="text-sm text-gray-500 hover:text-green-primary"
        >
          ← Voltar
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Criar escala</h1>
        <p className="mt-1 mb-6 text-sm text-gray-500">
          Escolha o estágio: os campos de prática e as vagas serão preenchidos
          automaticamente para todo o período (você pode ajustar depois).
        </p>

        <div className="rounded-[--radius-lg] border border-gray-200 bg-white p-6 shadow-sm">
          <CreateRotationForm estagios={estagios} />
        </div>
      </main>
    </>
  );
}
