"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useSync } from "@/components/SyncProvider";
import { Button, Field, Loading, Notice, PageHeader, TextInput } from "@/components/ui";
import { useEventos } from "@/components/useData";
import { formatPeriod, validateEvento, type Evento } from "@/lib/domain";
import { saveEvento, setActiveEventoId, setEventoStatus } from "@/lib/repository";

export default function EventoPage() {
  const router = useRouter();
  const { ready } = useSync();
  const { eventos, loading } = useEventos();
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [local, setLocal] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const message = validateEvento(nome);
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();
    const evento: Evento = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      cidade: cidade.trim() || null,
      local: local.trim() || null,
      data_inicio: dataInicio || null,
      data_fim: dataFim || null,
      status: "ativo",
      created_at: now,
      updated_at: now,
    };
    await saveEvento(evento);
    setActiveEventoId(evento.id);
    router.push("/");
  }

  function select(evento: Evento) {
    setActiveEventoId(evento.id);
    router.push("/");
  }

  if (!ready || loading) return <Loading />;

  return (
    <main className="flex flex-col gap-6">
      <PageHeader title="Evento" subtitle="O lead fica ligado ao evento selecionado." backHref="/" />
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nome do evento" required>
          <TextInput value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Congresso de Síndicos 2026" />
        </Field>
        <Field label="Cidade">
          <TextInput value={cidade} onChange={(event) => setCidade(event.target.value)} placeholder="João Pessoa" />
        </Field>
        <Field label="Local">
          <TextInput value={local} onChange={(event) => setLocal(event.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data inicial">
            <TextInput type="date" value={dataInicio} onChange={(event) => setDataInicio(event.target.value)} />
          </Field>
          <Field label="Data final">
            <TextInput type="date" value={dataFim} onChange={(event) => setDataFim(event.target.value)} />
          </Field>
        </div>
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando…" : "Usar este evento"}
        </Button>
      </form>
      {eventos.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gold">Eventos já cadastrados</h2>
          {eventos.map((evento) => (
            <article key={evento.id} className="rounded-3xl bg-white p-4">
              <button type="button" onClick={() => select(evento)} className="w-full text-left">
                <p className="text-xl font-semibold text-eleva">{evento.nome}</p>
                <p className="mt-1 text-sm text-ink/70">
                  {[evento.cidade, formatPeriod(evento.data_inicio, evento.data_fim)].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gold">
                  {evento.status === "ativo" ? "Ativo" : "Encerrado"} · Selecionar
                </p>
              </button>
              {evento.status === "encerrado" ? (
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold uppercase tracking-wide text-eleva"
                  onClick={() => setEventoStatus(evento.id, "ativo")}
                >
                  Reabrir
                </button>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
