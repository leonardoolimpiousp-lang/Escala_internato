# Escala Internato — FMUSP

Plataforma web para **coleta de preferências de turnos** do internato médico (FMUSP) e **geração determinística de escalas** pelo preceptor.

Não é rede social nem app colaborativo em tempo real — é essencialmente **coleta de preferências + geração de escalas**.

## Como funciona

1. O **preceptor** cria uma rotação (período, número de alunos) e monta a grade de turnos.
2. Cada **aluno** preenche suas preferências célula a célula: `QUERO`, `POSSO` ou `IMPOSSÍVEL`. O envio só é permitido com **100% das células preenchidas**.
3. O preceptor roda o **gerador determinístico** (sem IA), que produz **3 variantes** de escala respeitando as restrições duras.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript (strict) |
| Estilo | Tailwind v4 (tokens via `@theme` em `globals.css`) |
| Componentes | shadcn/ui |
| Backend | Supabase (Auth + PostgreSQL + RLS) |
| ORM | Drizzle ORM |
| Deploy | Vercel |

**Auth:** e-mail + senha via Supabase Auth, com papel `ALUNO` ou `PRECEPTOR`.

## Começando

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# preencha as chaves do Supabase

# 3. Aplicar schema no banco
npm run db:push

# 4. Rodar em desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run db:generate` | Gera migrations a partir do schema Drizzle |
| `npm run db:migrate` | Aplica migrations |
| `npm run db:push` | Sincroniza o schema direto no banco |
| `npm run db:studio` | Abre o Drizzle Studio |
| `npm run db:seed` | Popula os estágios de exemplo |

## Estrutura

```
src/
  app/            # rotas (login, cadastro, dashboard, aluno/, preceptor/)
  components/     # calendar-grid, shift-selector, scale-table
  lib/            # supabase, auth, scheduler (motor heurístico)
  server/
    actions/      # Server Actions (mutações)
    repositories/ # acesso a dados isolado
  workers/
    schedule-generator/
```

## Algoritmo do Scheduler

Motor **determinístico** em TypeScript (sem IA). Pontuação por preferência:

```
QUERO      = 100
POSSO      =  20
IMPOSSÍVEL = proibido (restrição dura)
```

**Restrições duras:** nunca alocar `IMPOSSÍVEL`, respeitar o máximo de plantões por semana e o máximo de noites consecutivas.

**Objetivos:** maximizar satisfação e equilibrar carga horária entre alunos.

Gera 3 variantes:
- **A** — satisfação
- **B** — carga horária
- **C** — satisfação + equidade

A interface do scheduler é agnóstica ao motor, permitindo trocar a heurística por OR-Tools no futuro sem reescrever o resto.

## Convenções

- Mutações sempre via Server Actions; o client nunca escreve direto no Supabase.
- Acesso a dados isolado em `server/repositories`.
- RLS habilitado: aluno só vê suas rotações; preceptor só as que criou.
- Termos de domínio em PT (rotation, shift, preferência); identificadores de código em EN.

---

> Documentos de referência no repositório: `.prd` (requisitos), `designsystem.md` (identidade visual) e `TASKS.md` (roadmap).
