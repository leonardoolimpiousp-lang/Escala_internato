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
import { saveSlots } from "@/server/actions/slots";
import type { SlotRow } from "@/server/repositories/slots";
import { Button } from "@/components/ui/button";

type Campo = { id: string; nome: string; obrigatorio: boolean };
type Added = {
  key: string;
  campoId: string;
  data: string;
  turno: Turno;
  capacidade: number;
};

export function CamposManager({
  rotationId,
  campos,
  slots,
  weeks,
}: {
  rotationId: string;
  campos: Campo[];
  slots: SlotRow[];
  weeks: DateWeek[];
}) {
  const originalCap = useMemo(
    () => Object.fromEntries(slots.map((s) => [s.id, s.capacidade])),
    [slots],
  );
  const [caps, setCaps] = useState<Record<string, number>>(originalCap);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<Added[]>([]);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const slotByKey = useMemo(() => {
    const m = new Map<string, SlotRow>();
    for (const s of slots) m.set(`${s.campoId}|${s.data}|${s.turno}`, s);
    return m;
  }, [slots]);

  const updates = slots
    .filter((s) => !removed.has(s.id) && caps[s.id] !== s.capacidade)
    .map((s) => ({ id: s.id, capacidade: caps[s.id] }));
  const removes = [...removed];
  const adds = added.map((a) => ({
    campoId: a.campoId,
    data: a.data,
    turno: a.turno,
    capacidade: a.capacidade,
  }));
  const dirty = updates.length + removes.length + adds.length > 0;

  function setCap(id: string, v: number) {
    setSaved(false);
    setCaps((p) => ({ ...p, [id]: v }));
  }
  function remove(id: string) {
    setSaved(false);
    setRemoved((p) => new Set(p).add(id));
  }
  function addSlot(campoId: string, data: string, turno: Turno) {
    setSaved(false);
    setAdded((p) => [
      ...p,
      { key: `${campoId}|${data}|${turno}`, campoId, data, turno, capacidade: 1 },
    ]);
  }
  function setAddedCap(key: string, v: number) {
    setSaved(false);
    setAdded((p) => p.map((a) => (a.key === key ? { ...a, capacidade: v } : a)));
  }
  function removeAdded(key: string) {
    setAdded((p) => p.filter((a) => a.key !== key));
  }

  function save() {
    startTransition(async () => {
      const res = await saveSlots(rotationId, { updates, removes, adds });
      if (res.ok) {
        for (const u of updates) originalCap[u.id] = u.capacidade;
        setRemoved(new Set());
        setAdded([]);
        setSaved(true);
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Ajuste as vagas por turno. Clique em <strong>+</strong> para adicionar
          uma vaga (exceção) e em <strong>×</strong> para remover.
        </p>
        <div className="flex items-center gap-3">
          {saved && !dirty && (
            <span className="text-sm text-green-primary">Salvo ✓</span>
          )}
          <Button onClick={save} disabled={!dirty || pending}>
            {pending
              ? "Salvando…"
              : dirty
                ? `Salvar (${updates.length + removes.length + adds.length})`
                : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {campos.map((campo) => (
          <div key={campo.id}>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{campo.nome}</h3>
              {campo.obrigatorio && (
                <span className="rounded-md bg-gold-light px-2 py-0.5 text-xs font-medium text-gold">
                  Obrigatório
                </span>
              )}
            </div>

            <div className="flex flex-col gap-4 overflow-x-auto">
              {weeks.map((w) => (
                <div key={w.weekIndex} className="min-w-[640px]">
                  <div className="grid grid-cols-[72px_repeat(7,1fr)] gap-1">
                    <div className="text-[11px] text-gray-400">
                      Sem {w.weekIndex + 1}
                    </div>
                    {w.cells.map((c) => (
                      <div
                        key={c.date}
                        className={`text-center text-[11px] ${c.inRange ? "text-gray-600" : "text-gray-300"}`}
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
                      className="mt-1 grid grid-cols-[72px_repeat(7,1fr)] gap-1"
                    >
                      <div className="flex items-center text-xs font-medium text-gray-500">
                        {TURNO_LABEL[t]}
                      </div>
                      {w.cells.map((c) => {
                        const existing = slotByKey.get(
                          `${campo.id}|${c.date}|${t}`,
                        );
                        const addedSlot = added.find(
                          (a) => a.key === `${campo.id}|${c.date}|${t}`,
                        );
                        if (!c.inRange)
                          return (
                            <div
                              key={c.date + t}
                              className="h-8 rounded-md bg-gray-50"
                            />
                          );
                        if (existing && !removed.has(existing.id))
                          return (
                            <CapCell
                              key={c.date + t}
                              value={caps[existing.id]}
                              onChange={(v) => setCap(existing.id, v)}
                              onRemove={() => remove(existing.id)}
                            />
                          );
                        if (addedSlot)
                          return (
                            <CapCell
                              key={c.date + t}
                              value={addedSlot.capacidade}
                              onChange={(v) =>
                                setAddedCap(addedSlot.key, v)
                              }
                              onRemove={() => removeAdded(addedSlot.key)}
                              isNew
                            />
                          );
                        return (
                          <button
                            key={c.date + t}
                            type="button"
                            onClick={() => addSlot(campo.id, c.date, t)}
                            className="h-8 rounded-md border border-dashed border-gray-200 text-xs text-gray-300 hover:border-green-primary/40 hover:text-green-primary"
                          >
                            +
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CapCell({
  value,
  onChange,
  onRemove,
  isNew,
}: {
  value: number;
  onChange: (v: number) => void;
  onRemove: () => void;
  isNew?: boolean;
}) {
  return (
    <div
      className={`flex h-8 items-center gap-0.5 rounded-md border px-1 ${
        isNew
          ? "border-green-primary/40 bg-green-light"
          : "border-gray-200 bg-white"
      }`}
    >
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
        className="w-full bg-transparent text-center text-xs outline-none"
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-gray-300 hover:text-error"
        title="Remover vaga"
      >
        ×
      </button>
    </div>
  );
}
