import {
  formatNumber,
  PERFIL_LABEL,
  PERFIS,
  summarize,
  type Evento,
  type Lead,
} from "@/lib/domain";

export function EventSummary({ evento, leads }: { evento: Evento; leads: Lead[] }) {
  const stats = summarize(leads);
  const blocks = [
    {
      title: "Perfil dos leads",
      rows: PERFIS.map((perfil) => [PERFIL_LABEL[perfil], stats.perfil[perfil]] as const),
    },
    {
      title: "Academia",
      rows: [
        ["Possui academia", stats.academiaSim],
        ["Não possui", stats.academiaNao],
        ["Não informado / não sabe", stats.academiaNaoInformado],
      ] as const,
    },
    {
      title: "Interesse",
      rows: [
        ["Sim", stats.interesseSim],
        ["Talvez", stats.interesseTalvez],
        ["Não", stats.interesseNao],
        ["Não conversado", stats.interesseNaoConversado],
      ] as const,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-2 gap-3">
        <Stat label="Total de leads" value={String(stats.totalLeads)} />
        <Stat label="Condomínios" value={String(stats.totalCondominios)} />
        <Stat label="Unidades" value={formatNumber(stats.somaUnidades)} />
        <Stat label="Média por condomínio" value={formatNumber(stats.mediaUnidades)} />
      </section>
      {blocks.map((block) => (
        <section key={block.title} className="rounded-3xl bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gold">{block.title}</h2>
          <ul>
            {block.rows.map(([label, value]) => (
              <li key={label} className="flex items-center justify-between border-b border-cream py-2 last:border-0">
                <span>{label}</span>
                <strong className="text-eleva">{value}</strong>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-sm text-ink/60">
        {evento.nome}: condomínios iguais contam uma vez. As unidades usam o maior número informado para cada
        condomínio.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white px-4 py-4">
      <p className="font-serif text-4xl text-eleva">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink/60">{label}</p>
    </div>
  );
}
