import {
  TURNOS,
  TURNO_LABEL,
  DAY_LABELS,
  ddmm,
  mondayIndex,
  type DateWeek,
  type Turno,
} from "@/lib/calendar";

type Assigned = {
  data: string;
  turno: Turno;
  campoNome: string;
  obrigatorio: boolean;
};

/** Calendário pessoal do aluno: só as vagas em que ele foi escalado. */
export function StudentSchedule({
  weeks,
  assignments,
}: {
  weeks: DateWeek[];
  assignments: Assigned[];
}) {
  const byKey = new Map<string, Assigned[]>();
  for (const a of assignments) {
    const k = `${a.data}|${a.turno}`;
    (byKey.get(k) ?? byKey.set(k, []).get(k)!).push(a);
  }

  return (
    <div className="flex flex-col gap-5 overflow-x-auto">
      {weeks.map((w) => (
        <div key={w.weekIndex} className="min-w-[680px]">
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
                const list = byKey.get(`${c.date}|${t}`) ?? [];
                return (
                  <div key={c.date + t} className="flex min-h-9 flex-col gap-1">
                    {list.map((a, i) => (
                      <div
                        key={i}
                        className={`truncate rounded-md border px-1.5 py-1 text-[10px] font-medium ${
                          a.obrigatorio
                            ? "border-gold/30 bg-gold-light text-gold"
                            : "border-green-primary/20 bg-green-light text-green-dark"
                        }`}
                        title={a.campoNome}
                      >
                        {a.campoNome}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
