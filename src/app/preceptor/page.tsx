import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { listRotationsByPreceptor } from "@/server/repositories/rotations";
import { formatBR } from "@/lib/date";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function PreceptorPage() {
  const user = await requireRole("PRECEPTOR");
  const escalas = await listRotationsByPreceptor(user.id);

  return (
    <>
      <AppHeader nome={user.nome} roleLabel="Preceptor" />
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Minhas escalas</h1>
            <p className="mt-1 text-sm text-gray-500">
              Crie e gerencie as escalas de internato.
            </p>
          </div>
          <Link
            href="/preceptor/escalas/nova"
            className={buttonVariants()}
          >
            Criar escala
          </Link>
        </div>

        {escalas.length === 0 ? (
          <div className="mt-8 rounded-[--radius-lg] border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-gray-600">Você ainda não criou nenhuma escala.</p>
            <Link
              href="/preceptor/escalas/nova"
              className={cn(buttonVariants(), "mt-4")}
            >
              Criar primeira escala
            </Link>
          </div>
        ) : (
          <ul className="mt-8 flex flex-col gap-3">
            {escalas.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/preceptor/escalas/${e.id}`}
                  className="block rounded-[--radius-lg] border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-green-primary/40"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-semibold text-gray-900">{e.nome}</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatBR(e.dataInicio)} – {formatBR(e.dataFim)}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>
                        <span className="font-medium text-gray-900">
                          {e.numeroAlunos}
                        </span>{" "}
                        alunos
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">
                          {e.totalSlots}
                        </span>{" "}
                        vagas
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
