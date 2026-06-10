import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-gray-50 font-sans">
      {/* Topbar */}
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-green-primary/20 bg-green-light px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green-dark">
            FMUSP
          </span>
          <span className="text-sm font-semibold text-gray-900">
            Escala Internato
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Criar conta
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-3xl px-6 pt-16 pb-12 text-center sm:pt-24">
        <span className="inline-block rounded-full border border-green-primary/20 bg-green-light px-4 py-1 text-xs font-semibold uppercase tracking-wide text-green-dark">
          Faculdade de Medicina da USP · Casa de Arnaldo
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Escalas de internato, justas e em minutos
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-gray-600">
          Os alunos registram suas preferências de plantão; o preceptor gera
          escalas equilibradas de forma determinística — sem planilhas, sem
          achismo.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/cadastro"
            className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
          >
            Começar agora
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "w-full sm:w-auto",
            )}
          >
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto w-full max-w-4xl px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Step
            n="1"
            titulo="Preceptor cria a escala"
            texto="Escolhe o estágio; os campos de prática e as vagas por turno já vêm prontos."
          />
          <Step
            n="2"
            titulo="Alunos dão preferências"
            texto="Quero, Posso ou Impossível para cada vaga — local, dia e turno."
          />
          <Step
            n="3"
            titulo="Geração determinística"
            texto="3 escalas equilibradas: nunca aloca um turno Impossível."
          />
        </div>
      </section>

      {/* Públicos */}
      <section className="mx-auto w-full max-w-4xl px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card
            tag="Para alunos"
            titulo="Suas preferências, respeitadas"
            itens={[
              "Preencha em uma grade simples",
              "Nunca seja escalado num turno impossível",
              "Veja sua escala final por dia e turno",
            ]}
          />
          <Card
            tag="Para preceptores"
            titulo="Controle e transparência"
            itens={[
              "Vagas por local e turno, ajustáveis",
              "Compare 3 variantes e escolha a oficial",
              "Métricas de satisfação e carga por aluno",
            ]}
          />
        </div>
      </section>

      <footer className="mt-auto px-6 py-10 text-center text-xs text-gray-400">
        Escala Internato · Faculdade de Medicina da USP
      </footer>
    </div>
  );
}

function Step({ n, titulo, texto }: { n: string; titulo: string; texto: string }) {
  return (
    <div className="rounded-[--radius-lg] border border-gray-200 bg-white p-5 shadow-sm">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-green-primary text-sm font-bold text-white">
        {n}
      </span>
      <h3 className="mt-3 font-semibold text-gray-900">{titulo}</h3>
      <p className="mt-1 text-sm text-gray-600">{texto}</p>
    </div>
  );
}

function Card({
  tag,
  titulo,
  itens,
}: {
  tag: string;
  titulo: string;
  itens: string[];
}) {
  return (
    <div className="rounded-[--radius-lg] border border-gray-200 bg-white p-6 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-gold">
        {tag}
      </span>
      <h3 className="mt-1 text-lg font-semibold text-gray-900">{titulo}</h3>
      <ul className="mt-3 flex flex-col gap-2">
        {itens.map((it) => (
          <li key={it} className="flex items-start gap-2 text-sm text-gray-600">
            <span className="mt-0.5 text-green-primary">✓</span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
