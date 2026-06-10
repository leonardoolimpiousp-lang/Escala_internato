import { scheduler, type SchedSlot, type Preference } from "@/lib/scheduler";
import { computeScheduleMetrics } from "@/lib/scheduler/metrics";

const D1 = "2026-08-03"; // Seg
const D2 = "2026-08-04"; // Ter
const D3 = "2026-08-05"; // Qua

const students = ["s1", "s2", "s3", "s4"];

const slots: SchedSlot[] = [
  // Reunião obrigatória (todos), Seg manhã
  { id: "reuniao_d1", campoId: "reuniao", obrigatorio: true, data: D1, turno: "MANHA", capacidade: 4 },
  // PS manhã (cap 2) — D1 manhã conflita com a reunião (mesmo turno)
  { id: "psm_d1", campoId: "ps", obrigatorio: false, data: D1, turno: "MANHA", capacidade: 2 },
  { id: "psm_d2", campoId: "ps", obrigatorio: false, data: D2, turno: "MANHA", capacidade: 2 },
  { id: "psm_d3", campoId: "ps", obrigatorio: false, data: D3, turno: "MANHA", capacidade: 2 },
  // PS noite (cap 1) em 3 dias consecutivos — testa máx. noites consecutivas
  { id: "psn_d1", campoId: "ps", obrigatorio: false, data: D1, turno: "NOITE", capacidade: 1 },
  { id: "psn_d2", campoId: "ps", obrigatorio: false, data: D2, turno: "NOITE", capacidade: 1 },
  { id: "psn_d3", campoId: "ps", obrigatorio: false, data: D3, turno: "NOITE", capacidade: 1 },
];

// Preferências: todos QUERO, exceto alguns IMPOSSÍVEL para validar.
const prefs = new Map<string, Preference>();
const plantao = slots.filter((s) => !s.obrigatorio);
for (const st of students)
  for (const s of plantao) prefs.set(`${st}|${s.id}`, "QUERO");
prefs.set("s1|psn_d2", "IMPOSSIVEL"); // s1 nunca pode noite de D2
prefs.set("s2|psn_d1", "IMPOSSIVEL"); // s2 nunca pode noite de D1
prefs.set("s3|psm_d2", "POSSO"); // variar

const results = scheduler.generate({
  studentIds: students,
  slots,
  prefs,
  config: { maxConsecutiveNights: 2 },
});

let allOk = true;
function check(name: string, cond: boolean) {
  if (!cond) allOk = false;
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
}

const slotsById = new Map(slots.map((s) => [s.id, s]));

for (const r of results) {
  console.log(`\nVariante ${r.variante} — ${r.label} (${r.assignments.length} alocações)`);

  // 1) nunca IMPOSSÍVEL
  const impossivel = r.assignments.filter(
    (a) => prefs.get(`${a.studentId}|${a.slotId}`) === "IMPOSSIVEL",
  );
  check("nenhuma alocação em IMPOSSÍVEL", impossivel.length === 0);

  // 2) capacidade respeitada
  const count = new Map<string, number>();
  for (const a of r.assignments)
    count.set(a.slotId, (count.get(a.slotId) ?? 0) + 1);
  const capOk = [...count.entries()].every(
    ([id, n]) => n <= (slotsById.get(id)?.capacidade ?? 0),
  );
  check("capacidade respeitada em todas as vagas", capOk);

  // 3) no máx. 1 vaga por aluno/turno
  const turnoKeys = new Set<string>();
  let dupe = false;
  for (const a of r.assignments) {
    const s = slotsById.get(a.slotId)!;
    const k = `${a.studentId}|${s.data}|${s.turno}`;
    if (turnoKeys.has(k)) dupe = true;
    turnoKeys.add(k);
  }
  check("nenhum aluno em 2 vagas no mesmo turno", !dupe);

  // 4) obrigatório: todos os alunos na reunião
  const reuniao = r.assignments.filter((a) => a.slotId === "reuniao_d1");
  check("obrigatório (reunião) com todos os alunos", reuniao.length === students.length);

  // 5) máx. 2 noites consecutivas
  let nightsOk = true;
  for (const st of students) {
    const nights = new Set(
      r.assignments
        .filter((a) => slotsById.get(a.slotId)?.turno === "NOITE" && a.studentId === st)
        .map((a) => slotsById.get(a.slotId)!.data),
    );
    if (nights.has(D1) && nights.has(D2) && nights.has(D3)) nightsOk = false;
  }
  check("nenhum aluno com 3 noites consecutivas", nightsOk);

  const m = computeScheduleMetrics(r.assignments, slots, prefs, students);
  console.log(
    `    cobertura ${m.filled}/${m.totalCapacity} (${Math.round(m.coverage * 100)}%) · satisfação ${m.satisfacao}% · carga ${m.cargaMin}–${m.cargaMax} (méd ${m.cargaMedia}) · Q/P ${m.quero}/${m.posso}`,
  );
}

console.log(`\n${allOk ? "TODAS as invariantes OK ✓" : "FALHA em alguma invariante ✗"}`);
process.exit(allOk ? 0 : 1);
