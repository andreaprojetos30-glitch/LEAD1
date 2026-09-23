"use client";

import { useState, type FormEvent } from "react";
import { Button, Notice, TextInput } from "@/components/ui";
import { useSync } from "@/components/SyncProvider";
import { slugify, type Evento } from "@/lib/domain";

export function ExportActions({ evento }: { evento: Evento }) {
  const { pending, online } = useSync();
  const [emails, setEmails] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function download(kind: "xlsx" | "pdf") {
    setError("");
    setMessage("");
    const response = await fetch(`/api/export/${kind}?eventoId=${evento.id}`);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error || "Não foi possível gerar o arquivo.");
      return;
    }
    const blob = await response.blob();
    const fallback = kind === "xlsx" ? `ELEVA-leads-${slugify(evento.nome)}.xlsx` : `ELEVA-relatorio-${slugify(evento.nome)}.pdf`;
    const header = response.headers.get("Content-Disposition") || "";
    const match = /filename\*=UTF-8''([^;]+)/.exec(header);
    const filename = match ? decodeURIComponent(match[1]) : fallback;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function sendEmail(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSending(true);
    const response = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventoId: evento.id, emails }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string; ok?: boolean } | null;
    setSending(false);
    if (!response.ok) {
      setError(body?.error || "Não foi possível enviar o e-mail.");
      return;
    }
    setMessage("Relatório enviado.");
    setEmails("");
  }

  return (
    <div className="flex flex-col gap-3">
      {!online ? <Notice>Excel, PDF e e-mail precisam de internet.</Notice> : null}
      {pending > 0 ? (
        <Notice>Há leads aguardando sincronização. Eles entram no arquivo depois que a conexão voltar.</Notice>
      ) : null}
      <Button type="button" onClick={() => download("xlsx")} disabled={!online}>
        Gerar Excel
      </Button>
      <Button type="button" variant="gold" onClick={() => download("pdf")} disabled={!online}>
        Gerar PDF resumo
      </Button>
      <form onSubmit={sendEmail} className="flex flex-col gap-3 rounded-3xl bg-white p-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-eleva">
            Enviar relatório
          </span>
          <TextInput
            type="text"
            inputMode="email"
            placeholder="um ou mais e-mails, separados por vírgula"
            value={emails}
            onChange={(event) => setEmails(event.target.value)}
          />
        </label>
        <Button type="submit" variant="ghost" disabled={!online || sending}>
          {sending ? "Enviando…" : "Enviar por e-mail"}
        </Button>
      </form>
      {message ? <Notice tone="ok">{message}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
    </div>
  );
}
