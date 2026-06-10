import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", override: true });
const sql = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 1,
  connect_timeout: 20,
});

// weekday: 0=Seg 1=Ter 2=Qua 3=Qui 4=Sex 5=Sáb 6=Dom
const WD = [0, 1, 2, 3, 4]; // Seg–Sex (padrão p/ campos sem dia especificado)

// Dados dos 3 estágios de exemplo. Os demais (~7) entram depois.
const ESTAGIOS = [
  {
    nome: "Clínica Médica",
    descricao: "Estágio de Clínica Médica (HC e Lapa).",
    campos: [
      { nome: "Porta-HC", days: WD, turnos: { MANHA: 2, TARDE: 2, NOITE: 2 } },
      { nome: "Sala-HC", days: WD, turnos: { MANHA: 1, TARDE: 1, NOITE: 2 } },
      { nome: "Lapa Porta", days: WD, turnos: { MANHA: 2, TARDE: 2 } },
      { nome: "Lapa Sala", days: WD, turnos: { MANHA: 3, TARDE: 3 } },
    ],
  },
  {
    nome: "Neurologia",
    descricao: "Estágio de Neurologia (PS e ambulatórios).",
    campos: [
      { nome: "PS", days: WD, turnos: { MANHA: 3, TARDE: 3, NOITE: 2 } },
      { nome: "Ambulatório DMV", days: [2], turnos: { TARDE: 5 } },
      { nome: "Ambulatório Cognitivo", days: [3], turnos: { TARDE: 5 } },
      { nome: "Ambulatório Cefaleia", days: [3], turnos: { TARDE: 5 } },
      {
        nome: "Reunião Geral",
        obrigatorio: true,
        days: [0],
        turnos: { MANHA: 5 },
      },
    ],
  },
  {
    nome: "Cardiologia",
    descricao: "Estágio de Cardiologia (ECG, PS, UCO).",
    campos: [
      { nome: "ECG", days: [0, 2, 3, 4], turnos: { MANHA: 4, TARDE: 4 } },
      { nome: "Porta PS", days: WD, turnos: { MANHA: 1, TARDE: 1, NOITE: 1 } },
      {
        nome: "Retaguarda PS",
        days: WD,
        turnos: { MANHA: 1, TARDE: 1, NOITE: 1 },
      },
      { nome: "UCO", days: WD, turnos: { MANHA: 2, TARDE: 2 } },
    ],
  },
];

try {
  for (const est of ESTAGIOS) {
    // re-seed idempotente: remove o estágio com mesmo nome (cascata)
    await sql`delete from public.estagios where nome = ${est.nome}`;
    const [{ id: estagioId }] = await sql`
      insert into public.estagios (nome, descricao)
      values (${est.nome}, ${est.descricao}) returning id`;

    let ordem = 0;
    for (const campo of est.campos) {
      const [{ id: campoId }] = await sql`
        insert into public.estagio_campos (estagio_id, nome, ordem, obrigatorio)
        values (${estagioId}, ${campo.nome}, ${ordem++}, ${!!campo.obrigatorio})
        returning id`;
      const rows = [];
      for (const weekday of campo.days)
        for (const [turno, capacidade] of Object.entries(campo.turnos))
          rows.push({ campo_id: campoId, weekday, turno, capacidade });
      if (rows.length)
        await sql`insert into public.estagio_campo_slots ${sql(
          rows,
          "campo_id",
          "weekday",
          "turno",
          "capacidade",
        )}`;
    }
    console.log(`✓ ${est.nome}: ${est.campos.length} campos`);
  }

  // resumo
  const summary = await sql`
    select e.nome as estagio, count(distinct c.id)::int as campos,
           count(s.id)::int as slots_padrao
    from public.estagios e
    left join public.estagio_campos c on c.estagio_id = e.id
    left join public.estagio_campo_slots s on s.campo_id = c.id
    group by e.nome order by e.nome`;
  console.log("\nResumo:");
  summary.forEach((r) =>
    console.log(
      `  - ${r.estagio}: ${r.campos} campos, ${r.slots_padrao} slots-padrão/semana`,
    ),
  );
} catch (e) {
  console.log("ERRO:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
