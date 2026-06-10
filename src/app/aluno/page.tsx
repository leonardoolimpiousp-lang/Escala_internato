import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { listRotationsForStudent } from "@/server/repositories/student-rotations";
import { formatBR } from "@/lib/date";

export default async function AlunoPage() {
  const user = await requireRole("ALUNO");
  const escalas = await listRotationsForStudent(user.id);

  return (
    <>
      <AppHeader nome={user.nome} roleLabel="Aluno" />
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {user.nome.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Escalas em que você foi incluído.
        </p>

        {escalas.length === 0 ? (
          <div className="mt-8 rounded-[--radius-lg] border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
            Você ainda não foi incluído em nenhuma escala.
          </div>
        ) : (
          <ul className="mt-8 flex flex-col gap-3">
            {escalas.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/aluno/escalas/${e.id}`}
                  className="flex items-center justify-between gap-4 rounded-[--radius-lg] border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-green-primary/40"
                >
                  <div>
                    <h2 className="font-semibold text-gray-900">{e.nome}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatBR(e.dataInicio)} – {formatBR(e.dataFim)}
                    </p>
                  </div>
                  {e.submittedAt ? (
                    <span className="rounded-full bg-green-light px-3 py-1 text-xs font-medium text-green-dark">
                      Enviada
                    </span>
                  ) : (
                    <span className="rounded-full bg-warning-bg px-3 py-1 text-xs font-medium text-warning">
                      Pendente
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
