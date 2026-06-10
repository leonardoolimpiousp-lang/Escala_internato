@AGENTS.md

# CLAUDE.md — Escala Internato FMUSP

> ⚠️ Stack instalada: **Next.js 16 + React 19 + Tailwind v4** (não Next 15). Há breaking changes — consulte `node_modules/next/dist/docs/` antes de escrever código novo. Tailwind v4 configura tema via `@theme` no CSS, sem `tailwind.config.js`.

## Projeto & Contexto

Plataforma web para coleta de preferências de turnos do internato médico (FMUSP) e **geração determinística** de escalas pelo preceptor. Não é rede social nem app colaborativo em tempo real — é essencialmente **coleta de preferências + geração de escalas**.

**Documentos de referência (leia antes de implementar):**
- `.prd` — requisitos de produto, features, regras de negócio.
- `designsystem.md` — identidade visual, cores, tipografia, componentes.
- `TASKS.md` — roadmap de execução por fases.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind v4 (tokens via `@theme` em `globals.css`) |
| Componentes | shadcn/ui |
| Backend | Supabase (Auth + PostgreSQL + RLS) |
| ORM | **Drizzle ORM** (não usar Prisma) |
| Deploy | Vercel |
| Gerador de escala | Worker **heurístico determinístico em TypeScript** (sem IA, sem OR-Tools no MVP) |

**Auth:** email + senha via Supabase Auth, com papel `ALUNO` / `PRECEPTOR`.

---

## Modelo de Dados (Drizzle / Postgres)

```
users
  id (uuid) · nome · email · role (ALUNO | PRECEPTOR) · turma · created_at

rotations
  id · nome · data_inicio · data_fim · numero_alunos · created_by · created_at

student_rotations
  id · rotation_id · student_id

shifts
  id · rotation_id · data · turno (MANHA | TARDE | NOITE) · tipo (PLANTAO | AULA | PROVA)

shift_preferences
  id · shift_id · student_id · preference (QUERO | POSSO | IMPOSSIVEL)

draft_preferences      -- rascunho local até o envio
  id · shift_id · student_id · preference

submitted_preferences  -- snapshot enviado
  id · rotation_id · student_id · submitted_at
```

> Preferências: **3 níveis no MVP** (QUERO / POSSO / IMPOSSIVEL). "Quero Muito" é evolução futura — não implementar agora.

---

## Estrutura de Pastas

```
src/
  app/
    login/
    cadastro/
    dashboard/
    aluno/
      escalas/
      preferencias/
    preceptor/
      escalas/
      gerar/
      resultados/
  components/
    calendar-grid/      # grade matricial (NÃO calendário tradicional)
    shift-selector/     # célula Quero/Posso/Impossível
    scale-table/        # tabela de escala gerada
  lib/
    supabase/
    auth/
    scheduler/          # motor heurístico de geração
  server/
    actions/            # Server Actions (mutações)
    repositories/       # acesso a dados isolado
  workers/
    schedule-generator/ # geração das 3 escalas
```

---

## Convenções

- **Mutações** via Server Actions (`server/actions`); nunca acessar Supabase direto do client para escrita.
- **Acesso a dados** isolado em `server/repositories`.
- **RLS habilitado** no Supabase — aluno só vê suas rotações; preceptor só as que criou.
- **Idioma:** termos de domínio em PT (rotation, shift, preferência seguem os nomes acima), identificadores/código em EN.
- **Validação:** preferências só podem ser enviadas com **100% das células preenchidas**.
- Componentes seguem `designsystem.md` — usar tokens de cor, raio e tipografia definidos lá.

---

## Algoritmo do Scheduler

Motor determinístico (sem IA). Pontuação por preferência:

```
QUERO      = 100
POSSO      =  20
IMPOSSIVEL = proibido (restrição dura)
```

**Restrições duras:**
1. IMPOSSÍVEL nunca alocado.
2. Máximo de plantões por semana.
3. Máximo de noites consecutivas.

**Objetivos:** maximizar satisfação + equilibrar carga horária entre alunos.

Gera **3 variantes**: A (satisfação), B (carga horária), C (satisfação + equidade).

**Carga horária** = plantão escalado + aulas/provas obrigatórias, somada por semana (seg–dom).

> A interface do scheduler deve ser **agnóstica ao motor**, para permitir trocar a heurística por OR-Tools no futuro sem reescrever o resto.

---

## O que NÃO fazer

- ❌ Realtime / sincronização ao vivo.
- ❌ FullCalendar ou calendário tradicional — usar **grade matricial**.
- ❌ Gráficos de pizza, 3D ou gradientes exagerados (ver `designsystem.md` → Dashboard).
- ❌ Prisma — usar Drizzle.
- ❌ IA na geração de escala — é determinístico.
- ❌ Quarto nível de preferência no MVP.
- ❌ Editar preferências após envio (MVP).
