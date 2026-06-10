# TASKS — Escala Internato FMUSP

Lista de features e tarefas para execução por IDE+LLM. Organizada em **fases sequenciais**. Cada item entre colchetes `[F#]` mapeia para as features do [.prd](.prd).

**Decisões travadas:** Next.js 15 (App Router) · TypeScript · Tailwind · shadcn/ui · Supabase (Auth + Postgres + RLS) · Drizzle ORM · deploy Vercel · 3 níveis de preferência · gerador heurístico determinístico (sem IA) · sem realtime · salvar só após submissão. Ver [CLAUDE.md](CLAUDE.md) e [designsystem.md](designsystem.md).

---

## Fase 0 — Setup & Infra

- [ ] Inicializar projeto Next.js 15 com App Router + TypeScript
- [ ] Configurar Tailwind CSS com os tokens do `designsystem.md` (verde FMUSP, dourado, neutros, semânticas)
- [ ] Instalar e configurar shadcn/ui
- [ ] Adicionar fonte Inter
- [ ] Instalar Drizzle ORM + driver Postgres
- [ ] Criar projeto Supabase e configurar cliente (`lib/supabase`)
- [ ] Configurar variáveis de ambiente (`.env.local`, `.env.example`)
- [ ] Deploy inicial na Vercel (esqueleto rodando)

---

## Fase 1 — Modelo de Dados  `[base]`

- [ ] Schema Drizzle `users` (id, nome, email, role[ALUNO|PRECEPTOR], turma, created_at)
- [ ] Schema `rotations` (id, nome, data_inicio, data_fim, numero_alunos, created_by, created_at)
- [ ] Schema `student_rotations` (id, rotation_id, student_id)
- [ ] Schema `shifts` (id, rotation_id, data, turno[MANHA|TARDE|NOITE], tipo[PLANTAO|AULA|PROVA])
- [ ] Schema `shift_preferences` (id, shift_id, student_id, preference[QUERO|POSSO|IMPOSSIVEL])
- [ ] Schema `draft_preferences` (rascunho até envio)
- [ ] Schema `submitted_preferences` (id, rotation_id, student_id, submitted_at)
- [ ] Definir enums (role, turno, tipo, preference)
- [ ] Gerar e aplicar migrations
- [ ] Configurar RLS: aluno vê só suas rotações; preceptor vê só as que criou

---

## Fase 2 — Auth & Cadastro  `[F1]`

- [ ] Integrar Supabase Auth (email + senha)
- [ ] Página de cadastro coletando nome, turma, email, senha e papel (Aluno / Preceptor)
- [ ] Página de login
- [ ] Criar registro em `users` no cadastro, com role
- [ ] Middleware/guards de rota por papel
- [ ] Roteamento pós-login: Aluno → área aluno; Preceptor → área preceptor
- [ ] Logout

---

## Fase 3 — Preceptor · Criar Escala  `[F2]`

- [ ] Form de criação de rotação: nome, data_inicio, **duração 2/3/6 semanas** (define data_fim), numero_alunos
- [ ] Ao criar, **gerar automaticamente os shifts**: Manhã/Tarde/Noite para cada dia do período
- [ ] Shifts nascem com tipo `PLANTAO` por padrão
- [ ] Listagem das rotações criadas pelo preceptor
- [ ] Ao abrir uma rotação, exibir tabela/calendário interativo

---

## Fase 4 — Preceptor · Calendário Interativo  `[F3, F4]`

- [ ] Componente `calendar-grid`: grade por semanas (seg–dom) × 3 turnos
- [ ] Marcar **dias/turnos disponíveis para plantão**
- [ ] Registrar **atividades reservadas (Aula / Prova / Reunião)** → shift vira tipo AULA/PROVA (bloqueado)
- [ ] Shifts bloqueados ficam destacados e não recebem preferência do aluno
- [ ] Adicionar alunos à rotação (`student_rotations`)
- [ ] Persistir alterações do calendário do preceptor

---

## Fase 5 — Aluno · Preferências  `[F5]`

- [ ] Listar escalas em que o aluno foi incluído
- [ ] Ao abrir a escala, renderizar **cópia da grade matricial** (semanas × seg–dom × Manhã/Tarde/Noite)
- [ ] Exibir shifts bloqueados pelo preceptor como "Bloqueado" (não editável)
- [ ] Componente `shift-selector`: cada célula aceita **Quero / Posso / Impossível** (cores do design system)
- [ ] Guardar seleções como **rascunho local** (sem realtime, sem salvar no banco ainda)
- [ ] Indicador de progresso de preenchimento (% das células)

---

## Fase 6 — Aluno · Submissão  `[F6]`

- [ ] Validar que **100% das células** estão preenchidas
- [ ] Botão "Enviar Preferências" habilita só com preenchimento completo
- [ ] Ao enviar: confirmação ("Sua escala foi enviada") + **mudança de cor do botão**
- [ ] Persistir `shift_preferences` + `submitted_preferences` com `submitted_at`
- [ ] Após envio, bloquear edição e mostrar status "Preferências enviadas"

---

## Fase 7 — Gerador Determinístico  `[F7]`

- [ ] Módulo `lib/scheduler` com **interface agnóstica ao motor** (permitir trocar por OR-Tools no futuro)
- [ ] Pontuação: QUERO = 100 · POSSO = 20 · IMPOSSIVEL = proibido (restrição dura)
- [ ] Restrição dura: nunca alocar turno marcado IMPOSSÍVEL
- [ ] Restrição: máximo de plantões por semana
- [ ] Restrição: máximo de noites consecutivas
- [ ] Distribuição equilibrada dos turnos QUERO entre alunos
- [ ] Gerar **3 escalas**: A (máx. satisfação) · B (carga horária equilibrada) · C (satisfação + equidade)
- [ ] Worker disparado pelo preceptor após receber todas as submissões
- [ ] Persistir as 3 escalas geradas

---

## Fase 8 — Comparação & Métricas  `[F8, F9]`

- [ ] Tela de comparação das 3 escalas geradas
- [ ] Preceptor seleciona uma escala como oficial
- [ ] Ao clicar em um aluno, exibir:
  - [ ] nº de turnos **QUERO aceitos**
  - [ ] nº de turnos **POSSO aceitos**
  - [ ] nº de turnos **IMPOSSÍVEL aceitos** (deve ser **0**)
  - [ ] **horas de trabalho por semana** (seg–dom) = plantão escalado + aulas/provas obrigatórias
- [ ] % de satisfação por aluno
- [ ] Dashboard: heatmap de distribuição, barras horizontais de carga, tabela de carga por aluno/semana
- [ ] Escala oficial visível para os alunos

---

## Fase 9 — Landing Page & Polimento

- [ ] Landing page institucional (verde FMUSP, estética "Casa de Arnaldo")
- [ ] Estados vazios (sem escalas, sem submissões, sem alunos)
- [ ] Responsividade da grade e do dashboard
- [ ] Revisar aderência total ao `designsystem.md` (sem pizza/3D/gradientes exagerados; motion ease-out)

---

## Fase 10 — Deploy & Verificação

- [ ] Revisar políticas RLS
- [ ] Seed de dados de teste (1 preceptor, ~10 alunos, 1 rotação)
- [ ] Smoke test fim-a-fim: cadastro → criar escala → preencher → submeter → gerar → comparar métricas
- [ ] Deploy de produção na Vercel
