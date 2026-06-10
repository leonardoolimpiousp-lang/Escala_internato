"use client";

import { useMemo, useState, useTransition } from "react";
import {
  TURNOS,
  TURNO_LABEL,
  DAY_LABELS,
  ddmm,
  mondayIndex,
  type DateWeek,
  type Turno,
} from "@/lib/calendar";
import {
  submitPreferencesAction,
  type SubmitResult,
} from "@/server/actions/preferences";
import type { SlotRow } from "@/server/repositories/slots";
import { Button } from "@/components/ui/button";

type Pref = "QUERO" | "POSSO" | "IMPOSSIVEL";
const NEXT: Record<Pref, Pref> = {
  QUERO: "POSSO",
  POSSO: "IMPOSSIVEL",
  IMPOSSIVEL: "QUERO",
};
const PREF_STYLE: Record<Pref, string> = {
  QUERO: "bg-quero-bg text-quero border-quero/30",
  POSSO: "bg-posso-bg text-posso border-posso/30",
  IMPOSSIVEL: "bg-impossivel-bg text-impossivel border-impossivel/30",
};
const PREF_LABEL: Record<Pref, string> = {
  QUERO: "Quero",
  POSSO: "Posso",
  IMPOSSIVEL: "Imposs.",
};

export function StudentCalendar({
  rotationId,
  slots,
  weeks,
  submitted,
  initialPrefs,
}: {
  rotationId: string;
  slots: SlotRow[];
  weeks: DateWeek[];
  submitted: boolean;
  initialPrefs: Record<string, Pref>;
}) {
  const slotsByKey = useMemo(() => {
    const m = new Map<string, SlotRow[]>();
    for (const s of slots) {
      const k = `${s.data}|${s.turno}`;
      (m.get(k) ?? m.set(k, []).get(k)!).push(s);
    }
    return m;
  }, [slots]);

  const totalRated = useMemo(
    () => slots.filter((s) => !s.obrigatorio).length,
    [slots],
  );

  const [prefs, setPrefs] = useState<Record<string, Pref>>(initialPrefs);
  const [done, setDone] = useState(submitted);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filled = Object.keys(prefs).length;
  const complete = filled >= totalRated && totalRated > 0;
  const readOnly = done;

  function cycle(id: string) {
    if (readOnly) return;
    setError(null);
    setPrefs((p) => ({ ...p, [id]: p[id] ? NEXT[p[id]] : "QUERO" }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res: SubmitResult = await submitPreferencesAction(
        rotationId,
        Object.entries(prefs).map(([slotId, preference]) => ({
          slotId,
          preference,
        })),
      );
      if (res.ok) setDone(true);
      else setError(res.error ?? "Falha ao enviar.");
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {(["QUERO", "POSSO", "IMPOSSIVEL"] as Pref[]).map((p) => (
            <span
              key={p}
              className={`rounded-md border px-2 py-1 font-medium ${PREF_STYLE[p]}`}
            >
              {PREF_LABEL[p]}
            </span>
          ))}
          <span className="rounded-md border border-gray-200 bg-gray-100 px-2 py-1 font-medium text-gray-400">
            Obrigatório (fixo)
          </span>
        </div>
        {done ? (
          <span className="rounded-md bg-green-light px-3 py-1.5 text-sm font-medium text-green-dark">
            Preferências enviadas ✓
          </span>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {filled}/{totalRated} avaliadas
            </span>
            <Button onClick={submit} disabled={!complete || pending}>
              {pending ? "Enviando…" : "Enviar preferências"}
            </Button>
          </div>
        )}
      </div>

      {!done && (
        <p className="mb-3 text-sm text-gray-500">
          Cada quadradinho é um plantão (local) num dia/turno.{" "}
          <strong>Clique</strong> para alternar sua preferência:{" "}
          <span className="font-medium text-quero">Quero</span> →{" "}
          <span className="font-medium text-posso">Posso</span> →{" "}
          <span className="font-medium text-impossivel">Impossível</span>.
        </p>
      )}

      {error && (
        <p className="mb-3 rounded-md bg-error-bg px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-5 overflow-x-auto">
        {weeks.map((w) => (
          <div key={w.weekIndex} className="min-w-[720px]">
            <div className="mb-1 text-xs font-medium text-gray-400">
              Semana {w.weekIndex + 1}
            </div>
            <div className="grid grid-cols-[72px_repeat(7,1fr)] gap-1">
              <div />
              {w.cells.map((c) => (
                <div
                  key={c.date}
                  className={`px-1 text-center text-[11px] ${c.inRange ? "text-gray-600" : "text-gray-300"}`}
                >
                  <div className="font-medium">
                    {DAY_LABELS[mondayIndex(c.date)]}
                  </div>
                  <div>{ddmm(c.date)}</div>
                </div>
              ))}
            </div>
            {TURNOS.map((t) => (
              <div
                key={t}
                className="mt-1 grid grid-cols-[72px_repeat(7,1fr)] items-start gap-1"
              >
                <div className="flex items-center pt-1 text-xs font-medium text-gray-500">
                  {TURNO_LABEL[t]}
                </div>
                {w.cells.map((c) => {
                  const list = slotsByKey.get(`${c.date}|${t}`) ?? [];
                  return (
                    <div key={c.date + t} className="flex flex-col gap-0.5">
                      {list.map((s) =>
                        s.obrigatorio ? (
                          <div
                            key={s.id}
                            className="truncate rounded-md bg-gray-100 px-1.5 py-1 text-[10px] font-medium text-gray-400"
                            title={`${s.campoNome} (obrigatório)`}
                          >
                            {s.campoNome}
                          </div>
                        ) : (
                          <button
                            key={s.id}
                            type="button"
                            disabled={readOnly}
                            onClick={() => cycle(s.id)}
                            title={`${s.campoNome}${prefs[s.id] ? " · " + PREF_LABEL[prefs[s.id]] : ""}`}
                            className={`truncate rounded-md border px-1.5 py-1 text-[10px] font-medium transition-colors ${
                              prefs[s.id]
                                ? PREF_STYLE[prefs[s.id]]
                                : "border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-green-primary/50 hover:text-green-dark"
                            }`}
                          >
                            {prefs[s.id]
                              ? `${s.campoNome} · ${prefs[s.id][0]}`
                              : s.campoNome}
                          </button>
                        ),
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
