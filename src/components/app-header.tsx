import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export function AppHeader({
  nome,
  roleLabel,
}: {
  nome: string;
  roleLabel: string;
}) {
  const home = roleLabel === "Preceptor" ? "/preceptor" : "/aluno";
  return (
    <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
      <Link href={home} className="flex min-w-0 items-center gap-2">
        <span className="rounded-full border border-green-primary/20 bg-green-light px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green-dark">
          FMUSP
        </span>
        <span className="hidden truncate text-sm font-semibold text-gray-900 sm:inline">
          Escala Internato
        </span>
      </Link>
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0 text-right">
          <p className="truncate text-sm font-medium text-gray-900">{nome}</p>
          <p className="text-xs text-gray-500">{roleLabel}</p>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
