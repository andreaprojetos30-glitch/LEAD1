"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EventSummary } from "@/components/EventSummary";
import { ExportActions } from "@/components/ExportActions";
import { useSync } from "@/components/SyncProvider";
import { ActionLink, Button, Loading, Notice, PageHeader } from "@/components/ui";
import { useActiveEvento, useLeads } from "@/components/useData";
import { formatPeriod } from "@/lib/domain";
import { clearActiveEventoId, setEventoStatus } from "@/lib/repository";

export default function EncerrarPage() {
  const router = useRouter();
  const { ready } = useSync();
  const { evento, loading } = useActiveEvento();
  const { leads, loading: loadingLeads } = useLeads();
  const [confirming, setConfirming] = useState(false);
  const [closing, setClosing] = useState(false);

  async function finish() {
    if (!evento) return;
    setClosing(true);
    await setEventoStatus(evento.id, "encerrado");
    clearActiveEventoId();
    router.push("/evento");
  }

  if (!ready || loading || loadingLeads) return <Loading />;
  if (!evento) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Encerrar evento" backHref="/" />
        <Notice>Selecione um evento.</Notice>
        <ActionLink href="/evento">Cadastrar evento</ActionLink>
      </div>
    );
  }

  const ofEvent = leads.filter((lead) => lead.evento_id === evento.id);

  return (
    <main className="flex flex-col gap-5">
      <PageHeader
        title="Encerrar evento"
        subtitle={`${evento.nome} · ${formatPeriod(evento.data_inicio, evento.data_fim)}`}
        backHref="/"
      />
      {evento.status === "encerrado" ? <Notice>Este evento está encerrado.</Notice> : null}
      <EventSummary evento={evento} leads={ofEvent} />
      <ExportActions evento={evento} />
      {evento.status === "ativo" ? (
        confirming ? (
          <div className="flex flex-col gap-3">
            <p>Encerrar {evento.nome}? A captação deste evento para e abre o cadastro de um novo.</p>
            <Button type="button" onClick={() => void finish()} disabled={closing}>
              {closing ? "Encerrando…" : "Confirmar encerramento"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              Voltar
            </Button>
          </div>
        ) : (
          <Button type="button" variant="danger" onClick={() => setConfirming(true)}>
            Encerrar evento
          </Button>
        )
      ) : (
        <Button type="button" variant="ghost" onClick={() => setEventoStatus(evento.id, "ativo")}>
          Reabrir evento
        </Button>
      )}
    </main>
  );
}
