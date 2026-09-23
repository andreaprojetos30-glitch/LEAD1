"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSync } from "@/components/SyncProvider";
import { Field, Loading, PageHeader, TextInput } from "@/components/ui";
import { useActiveEvento, useEventos, useLeads } from "@/components/useData";
import {
  ACADEMIA_LABEL,
  digits,
  formatDateTime,
  INTERESSE_LABEL,
  isSameSaoPauloDay,
  normalizeText,
  PERFIL_LABEL,
  PERFIS,
  type Academia,
  type Interesse,
  type Perfil,
} from "@/lib/domain";

export default function LeadsPage() {
  const { ready } = useSync();
  const { evento } = useActiveEvento();
  const { eventos } = useEventos();
  const { leads, loading } = useLeads();
  const [query, setQuery] = useState("");
  const [eventoId, setEventoId] = useState<string | null>(null);
  const [data, setData] = useState("");
  const [perfil, setPerfil] = useState<Perfil | "">("");
  const [academia, setAcademia] = useState<Academia | "">("");
  const [interesse, setInteresse] = useState<Interesse | "">("");
  const [cidade, setCidade] = useState("");

  const selectedEvent = eventoId ?? evento?.id ?? "todos";

  const cities = useMemo(() => {
    const values = new Set<string>();
    leads.forEach((lead) => {
      if (lead.cidade) values.add(lead.cidade);
    });
    return [...values].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [leads]);

  const filtered = useMemo(() => {
    const term = normalizeText(query);
    const phone = digits(query);
    return leads.filter((lead) => {
      if (selectedEvent !== "todos" && lead.evento_id !== selectedEvent) return false;
      if (data && !isSameSaoPauloDay(lead.created_at, data)) return false;
      if (perfil && lead.perfil !== perfil) return false;
      if (academia && lead.possui_academia !== academia) return false;
      if (interesse && lead.interesse !== interesse) return false;
      if (cidade && normalizeText(lead.cidade || "") !== normalizeText(cidade)) return false;
      if (!term && !phone) return true;
      const haystack = normalizeText(`${lead.nome} ${lead.condominio} ${lead.cidade || ""}`);
      const phoneMatch = phone.length > 0 && lead.celular_normalizado.includes(phone);
      return haystack.includes(term) || phoneMatch;
    });
  }, [academia, cidade, data, interesse, leads, perfil, query, selectedEvent]);

  if (!ready || loading) return <Loading />;

  return (
    <main className="flex flex-col gap-4">
      <PageHeader title="Leads captados" subtitle={`${filtered.length} nesta lista`} backHref="/" />
      <TextInput
        placeholder="Nome, condomínio, celular ou cidade"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <details className="rounded-3xl bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-eleva">Filtros</summary>
        <div className="mt-4 flex flex-col gap-3">
          <Field label="Evento">
            <select className="min-h-14 w-full rounded-2xl border border-eleva/15 bg-white px-4 text-lg" value={selectedEvent} onChange={(event) => setEventoId(event.target.value)}>
              <option value="todos">Todos os eventos</option>
              {eventos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Data">
            <TextInput type="date" value={data} onChange={(event) => setData(event.target.value)} />
          </Field>
          <Field label="Perfil">
            <select className="min-h-14 w-full rounded-2xl border border-eleva/15 bg-white px-4 text-lg" value={perfil} onChange={(event) => setPerfil(event.target.value as Perfil | "")}>
              <option value="">Todos</option>
              {PERFIS.map((item) => (
                <option key={item} value={item}>
                  {PERFIL_LABEL[item]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Possui academia">
            <select className="min-h-14 w-full rounded-2xl border border-eleva/15 bg-white px-4 text-lg" value={academia} onChange={(event) => setAcademia(event.target.value as Academia | "")}>
              <option value="">Todas</option>
              {(Object.keys(ACADEMIA_LABEL) as Academia[]).map((item) => (
                <option key={item} value={item}>
                  {ACADEMIA_LABEL[item]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Interesse">
            <select className="min-h-14 w-full rounded-2xl border border-eleva/15 bg-white px-4 text-lg" value={interesse} onChange={(event) => setInteresse(event.target.value as Interesse | "")}>
              <option value="">Todos</option>
              {(Object.keys(INTERESSE_LABEL) as Interesse[]).map((item) => (
                <option key={item} value={item}>
                  {INTERESSE_LABEL[item]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cidade">
            <select className="min-h-14 w-full rounded-2xl border border-eleva/15 bg-white px-4 text-lg" value={cidade} onChange={(event) => setCidade(event.target.value)}>
              <option value="">Todas</option>
              {cities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </details>
      <ul className="flex flex-col gap-3">
        {filtered.map((lead) => (
          <li key={lead.id}>
            <Link href={`/leads/${lead.id}`} className="block rounded-3xl bg-white p-4">
              <p className="text-xl font-semibold text-eleva">{lead.nome}</p>
              <p className="mt-1">
                {lead.condominio} · {PERFIL_LABEL[lead.perfil]}
              </p>
              <p className="mt-1 text-sm text-ink/70">
                {lead.celular} · {formatDateTime(lead.created_at)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? <p className="py-8 text-center text-ink/60">Nenhum lead encontrado.</p> : null}
    </main>
  );
}
