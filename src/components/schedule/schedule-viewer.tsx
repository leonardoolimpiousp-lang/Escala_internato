"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateSchedulesAction,
  selectScheduleAction,
} from "@/server/actions/generate";
import type { ScheduleMetrics } from "@/lib/scheduler/metrics";
import {
  TURNOS,
  TURNO_LABEL,
  DAY_LABELS,
  ddmm,
  mondayIndex,
  type DateWeek,
  type Turno,
} from "@/lib/calendar";
import { Button } from "@/components/ui/button";

type Slot = {
  id: string;
  campoId: string;
  campoNome: string;
  obrigatorio: boolean;
  data: string;
  turno: Turno;
  capacidade: number;
};

export type ViewerItem = {
  id: string;
  variante: "A" | "B" | "C";
  label: string;
  selected: boolean;
  metrics: ScheduleMetrics;
  assignmentsBySlot: Record<string, string[]>; // slotId → nomes
  weeklyHoras: Record<string, number[]>; // studentId → horas por semana
};

function firstName(nome: string) {
  return nome.split(" ")[0];
}

export function ScheduleViewer({
  rotationId,
  weeks,
  slots,
  studentNames,
  items,
}: {
  rotationId: string;
  weeks: DateWeek[];
  slots: Slot[];
  studentNames: Record<string, string>;
  items: ViewerItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const initialActive =
    items.find((i) => i.selected)?.variante ?? items[0]?.variante ?? "A";
  const [active, setActive] = useState<"A" | "B" | "C">(initialActive);

  const slotsByKey = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const s of slots) {
      const k = `${s.data}|${s.turno}`;
      (m.get(k) ?? m.set(k, []).get(k)!).push(s);
    }
    return m;
  }, [slots]);

  function generate() {
    startTransition(async () => {
      await generateSchedulesAction(rotationId);
      router.refresh();
    });
  }
  function select(scheduleId: string) {
    startTransition(async () => {
      await selectScheduleAction(rotationId, scheduleId);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[--radius-lg] border border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-gray-600">
          Nenhuma escala gerada ainda. Gere as 3 variantes a partir das
          preferências enviadas.
        </p>
        <Button onClick={generate} disabled={pending} className="mt-4">
          {pending ? "Gerando…" : "Gerar escalas"}
        </Button>
      </div>
    );
  }

  const activeItem = items.find((i) => i.variante === active) ?? items[0];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Compare as 3 variantes, escolha a oficial e veja o calendário com os
          alunos distribuídos.
        </p>
        <Button variant="outline" onClick={generate} disabled={pending}>
          {pending ? "Gerando…" : "Regerar"}
        </Button>
      </div>

      {/* Cards comparativos */}
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setActive(it.variante)}
            className={`rounded-[--radius-lg] border bg-white p-5 text-left shadow-sm transition-colors ${
              it.variante === active
                ? "border-green-primary ring-1 ring-green-primary"
                : "border-gray-200 hover:border-green-primary/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-green-primary text-sm font-bold text-white">
                  {it.variante}
                </span>
                <h3 className="font-semibold text-gray-900">{it.label}</h3>
              </div>
              {it.selected && (
                <span className="rounded-full bg-green-light px-2 py-0.5 text-xs font-medium text-green-dark">
                  Oficial
                </span>
              )}
            </div>
            <dl className="mt-4 flex flex-col gap-1.5 text-sm">
              <Row label="Cobertura">
                {it.metrics.filled}/{it.metrics.totalCapacity} (
                {Math.round(it.metrics.coverage * 100)}%)
              </Row>
              <Row label="Satisfação">{it.metrics.satisfacao}%</Row>
              <Row label="Carga (turnos)">
                {it.metrics.cargaMin}–{it.metrics.cargaMax}
              </Row>
              <Row label="Impossível">
                <span className={it.metrics.impossivel === 0 ? "text-success" : "text-error"}>
                  {it.metrics.impossivel}
                  {it.metrics.impossivel === 0 ? " ✓" : ""}
                </span>
              </Row>
            </dl>
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                if (!it.selected && !pending) select(it.id);
              }}
              className={`mt-4 flex h-9 w-full items-center justify-center rounded-md text-sm font-medium ${
                it.selected
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/80"
              }`}
            >
              {it.selected ? "Selecionada" : "Selecionar como oficial"}
            </span>
          </button>
        ))}
      </div>

      {/* Calendário da variante ativa */}
      <h2 className="mt-10 mb-1 text-lg font-semibold text-gray-900">
        Calendário — Variante {activeItem.variante} ({activeItem.label})
      </h2>
      <p className="mb-4 text-sm text-gray-500">
        Cada célula mostra o local e os alunos escalados.
      </p>
      <div className="flex flex-col gap-5 overflow-x-auto">
        {weeks.map((w) => (
          <div key={w.weekIndex} className="min-w-[820px]">
            <div className="mb-1 text-xs font-medium text-gray-400">
              Semana {w.weekIndex + 1}
            </div>
            <div className="grid grid-cols-[64px_repeat(7,1fr)] gap-1">
              <div />
              {w.cells.map((c) => (
                <div
                  key={c.date}
                  className={`px-1 text-center text-[11px] ${c.inRange ? "text-gray-600" : "text-gray-300"}`}
                >
                  <div className="font-medium">{DAY_LABELS[mondayIndex(c.date)]}</div>
                  <div>{ddmm(c.date)}</div>
                </div>
              ))}
            </div>
            {TURNOS.map((t) => (
              <div
                key={t}
                className="mt-1 grid grid-cols-[64px_repeat(7,1fr)] items-start gap-1"
              >
                <div className="flex items-center pt-1 text-xs font-medium text-gray-500">
                  {TURNO_LABEL[t]}
                </div>
                {w.cells.map((c) => {
                  const list = slotsByKey.get(`${c.date}|${t}`) ?? [];
                  return (
                    <div
                      key={c.date + t}
                      className="flex min-h-9 flex-col gap-1 rounded-md bg-gray-50 p-1"
                    >
                      {list.map((s) => {
                        const nomes = activeItem.assignmentsBySlot[s.id] ?? [];
                        return (
                          <div
                            key={s.id}
                            className={`rounded border px-1 py-0.5 ${
                              s.obrigatorio
                                ? "border-gold/30 bg-gold-light"
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            <div className="truncate text-[10px] font-semibold text-gray-700">
                              {s.campoNome}{" "}
                              <span className="font-normal text-gray-400">
                                {nomes.length}/{s.capacidade}
                              </span>
                            </div>
                            <div className="text-[10px] leading-tight text-gray-600">
                              {nomes.length
                                ? nomes.map(firstName).join(", ")
                                : "—"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Métricas por aluno */}
      <h2 className="mt-10 mb-3 text-lg font-semibold text-gray-900">
        Por aluno — Variante {activeItem.variante}
      </h2>
      <div className="overflow-x-auto rounded-[--radius-lg] border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-2 font-medium">Aluno</th>
              <th className="px-4 py-2 font-medium">Quero</th>
              <th className="px-4 py-2 font-medium">Posso</th>
              <th className="px-4 py-2 font-medium">Impossível</th>
              <th className="px-4 py-2 font-medium">Turnos</th>
              <th className="px-4 py-2 font-medium">Horas</th>
              <th className="px-4 py-2 font-medium">Satisfação</th>
            </tr>
          </thead>
          <tbody>
            {activeItem.metrics.perStudent
              .slice()
              .sort((a, b) =>
                (studentNames[a.studentId] ?? "").localeCompare(
                  studentNames[b.studentId] ?? "",
                ),
              )
              .map((m) => (
                <tr key={m.studentId} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {studentNames[m.studentId] ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-quero">{m.quero}</td>
                  <td className="px-4 py-2 text-posso">{m.posso}</td>
                  <td className="px-4 py-2">
                    <span className={m.impossivel === 0 ? "text-success" : "text-error"}>
                      {m.impossivel}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{m.total}</td>
                  <td className="px-4 py-2 text-gray-700">{m.horas}h</td>
                  <td className="px-4 py-2 text-gray-700">{m.satisfacao}%</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Heatmap: carga horária por semana */}
      <h2 className="mt-10 mb-1 text-lg font-semibold text-gray-900">
        Carga horária por semana
      </h2>
      <p className="mb-3 text-sm text-gray-500">
        Horas por aluno em cada semana (seg–dom). Cor mais forte = mais horas.
      </p>
      <WeeklyHeatmap
        weeklyHoras={activeItem.weeklyHoras}
        numWeeks={weeks.length}
        studentNames={studentNames}
      />
    </div>
  );
}

function WeeklyHeatmap({
  weeklyHoras,
  numWeeks,
  studentNames,
}: {
  weeklyHoras: Record<string, number[]>;
  numWeeks: number;
  studentNames: Record<string, string>;
}) {
  const ids = Object.keys(weeklyHoras).sort((a, b) =>
    (studentNames[a] ?? "").localeCompare(studentNames[b] ?? ""),
  );
  const maxH = Math.max(
    1,
    ...ids.flatMap((id) => weeklyHoras[id] ?? []),
  );

  return (
    <div className="overflow-x-auto rounded-[--radius-lg] border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-2 font-medium">Aluno</th>
            {Array.from({ length: numWeeks }, (_, i) => (
              <th key={i} className="px-2 py-2 text-center font-medium">
                Sem {i + 1}
              </th>
            ))}
            <th className="px-3 py-2 text-center font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {ids.map((id) => {
            const horas = weeklyHoras[id] ?? [];
            const total = horas.reduce((a, b) => a + b, 0);
            return (
              <tr key={id} className="border-t border-gray-100">
                <td className="whitespace-nowrap px-4 py-1.5 font-medium text-gray-900">
                  {studentNames[id] ?? "—"}
                </td>
                {Array.from({ length: numWeeks }, (_, i) => {
                  const h = horas[i] ?? 0;
                  const ratio = h / maxH;
                  return (
                    <td key={i} className="px-1 py-1 text-center">
                      <div
                        className="rounded py-1 text-xs font-medium"
                        style={{
                          backgroundColor: h
                            ? `rgba(15,107,69,${0.12 + 0.68 * ratio})`
                            : "var(--color-gray-50)",
                          color: ratio > 0.5 ? "#fff" : "var(--color-gray-700)",
                        }}
                      >
                        {h ? `${h}h` : "—"}
                      </div>
                    </td>
                  );
                })}
                <td className="px-3 py-1.5 text-center font-semibold text-gray-900">
                  {total}h
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{children}</dd>
    </div>
  );
}
