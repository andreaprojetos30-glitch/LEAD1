"use client";

import { EventSummary } from "@/components/EventSummary";
import { useSync } from "@/components/SyncProvider";
import { ActionLink, Loading, Notice, PageHeader } from "@/components/ui";
import { useActiveEvento, useLeads } from "@/components/useData";

export default function PainelPage() {
  const { ready } = useSync();
  const { evento, loading } = useActiveEvento();
  const { leads, loading: loadingLeads } = useLeads();

  if (!ready || loading || loadingLeads) return <Loading />;
  if (!evento) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Painel" backHref="/" />
        <Notice>Selecione um evento para ver o painel.</Notice>
        <ActionLink href="/evento">Cadastrar evento</ActionLink>
      </div>
    );
  }

  const ofEvent = leads.filter((lead) => lead.evento_id === evento.id);

  return (
    <main className="flex flex-col gap-5">
      <PageHeader title="Painel" subtitle={evento.nome} backHref="/" />
      <EventSummary evento={evento} leads={ofEvent} />
    </main>
  );
}
