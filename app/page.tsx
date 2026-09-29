"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSync } from "@/components/SyncProvider";
import { ActionLink, Loading, Wordmark } from "@/components/ui";
import { useActiveEvento, useLeads } from "@/components/useData";
import { startOfTodaySaoPaulo } from "@/lib/domain";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const { ready } = useSync();
  const { evento, loading: loadingEvento } = useActiveEvento();
  const { leads, loading: loadingLeads } = useLeads();

  const counts = useMemo(() => {
    if (!evento) return { today: 0, total: 0 };
    const start = startOfTodaySaoPaulo();
    const ofEvent = leads.filter((lead) => lead.evento_id === evento.id);
    return {
      today: ofEvent.filter((lead) => new Date(lead.created_at) >= start).length,
      total: ofEvent.length,
    };
  }, [evento, leads]);

  if (!ready || loadingEvento || loadingLeads) return <Loading />;

  return (
    <main className="flex flex-col gap-6">
      <Wordmark />
      {evento?.status === "encerrado" ? (
        <div className="flex flex-col gap-4">
          <p className="text-center text-lg">
            O evento {evento.nome} está encerrado. Cadastre o próximo para continuar a captação.
          </p>
          <ActionLink href="/evento" variant="primary">
            Cadastrar novo evento
          </ActionLink>
          <ActionLink href="/leads">Ver leads</ActionLink>
          <ActionLink href="/exportar">Exportar</ActionLink>
        </div>
      ) : evento ? (
        <>
          <ActionLink href="/lead/novo" variant="primary">
            Novo lead
          </ActionLink>
          <section className="rounded-3xl bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Leads captados hoje</p>
            <p className="mt-3 font-serif text-6xl leading-none text-eleva">{counts.today}</p>
            <p className="mt-3 text-lg">
              Total do evento: <strong>{counts.total}</strong>
            </p>
            <Link href="/evento/painel" className="mt-4 block text-base font-semibold text-eleva">
              {evento.nome}
              {evento.cidade ? ` · ${evento.cidade}` : ""}
              <span className="mt-1 block text-sm font-medium uppercase tracking-wide text-gold">Ver painel</span>
            </Link>
          </section>
          <div className="grid grid-cols-1 gap-3">
            <ActionLink href="/leads">Ver leads</ActionLink>
            <ActionLink href="/exportar">Exportar</ActionLink>
            <ActionLink href="/evento/encerrar">Encerrar evento</ActionLink>
          </div>
          <Link href="/evento" className="text-center text-sm font-semibold uppercase tracking-wide text-gold">
            Trocar evento
          </Link>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-center text-lg">Cadastre ou selecione o evento para começar a captação.</p>
          <ActionLink href="/evento" variant="primary">
            Cadastrar evento
          </ActionLink>
        </div>
      )}
      <button
        type="button"
        className="text-center text-sm uppercase tracking-wide text-ink/50"
        onClick={() => createClient().auth.signOut()}
      >
        Sair
      </button>
    </main>
  );
}
