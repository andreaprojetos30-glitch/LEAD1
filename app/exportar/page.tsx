"use client";

import { ExportActions } from "@/components/ExportActions";
import { useSync } from "@/components/SyncProvider";
import { ActionLink, Loading, Notice, PageHeader } from "@/components/ui";
import { useActiveEvento } from "@/components/useData";

export default function ExportarPage() {
  const { ready } = useSync();
  const { evento, loading } = useActiveEvento();

  if (!ready || loading) return <Loading />;
  if (!evento) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Exportar" backHref="/" />
        <Notice>Selecione um evento para exportar.</Notice>
        <ActionLink href="/evento">Cadastrar evento</ActionLink>
      </div>
    );
  }

  return (
    <main className="flex flex-col gap-5">
      <PageHeader title="Exportar" subtitle={evento.nome} backHref="/" />
      <ExportActions evento={evento} />
    </main>
  );
}
