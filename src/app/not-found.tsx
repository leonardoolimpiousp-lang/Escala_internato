import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 py-24 text-center font-sans">
      <span className="rounded-full border border-green-primary/20 bg-green-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-dark">
        FMUSP · Escala Internato
      </span>
      <p className="mt-6 text-6xl font-bold tracking-tight text-green-primary">
        404
      </p>
      <h1 className="mt-3 text-2xl font-bold text-gray-900">
        Página não encontrada
      </h1>
      <p className="mt-2 max-w-md text-gray-600">
        A página que você procura não existe ou foi movida. Volte e continue de
        onde parou.
      </p>
      <Link href="/" className={cn(buttonVariants(), "mt-8")}>
        Voltar ao início
      </Link>
    </div>
  );
}
