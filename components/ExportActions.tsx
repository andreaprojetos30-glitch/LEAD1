"use client";

import { useState } from "react";
import { Button, Notice } from "@/components/ui";
import { useSync } from "@/components/SyncProvider";
import { slugify, type Evento } from "@/lib/domain";

const FILE_NAME: Record<"xlsx" | "pdf" | "contatos", (nome: string) => string> = {
  xlsx: (nome) => `ELEVA-leads-${slugify(nome)}.xlsx`,
  pdf: (nome) => `ELEVA-relatorio-${slugify(nome)}.pdf`,
  contatos: (nome) => `ELEVA-contatos-${slugify(nome)}.pdf`,
};

export function ExportActions({ evento }: { evento: Evento }) {
  const { pending, online } = useSync();
  const [error, setError] = useState("");

  async function download(kind: "xlsx" | "pdf" | "contatos") {
    setError("");
    const response = await fetch(`/api/export/${kind}?eventoId=${evento.id}`);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error || "Não foi possível gerar o arquivo.");
      return;
    }
    const blob = await response.blob();
    const header = response.headers.get("Content-Disposition") || "";
    const match = /filename\*=UTF-8''([^;]+)/.exec(header);
    const filename = match ? decodeURIComponent(match[1]) : FILE_NAME[kind](evento.nome);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3">
      {!online ? <Notice>Excel e PDF precisam de internet.</Notice> : null}
      {pending > 0 ? (
        <Notice>Há leads aguardando sincronização. Eles entram no arquivo depois que a conexão voltar.</Notice>
      ) : null}
      <Button type="button" onClick={() => download("xlsx")} disabled={!online}>
        Gerar Excel
      </Button>
      <Button type="button" variant="gold" onClick={() => download("pdf")} disabled={!online}>
        Gerar PDF resumo
      </Button>
      <Button type="button" variant="ghost" onClick={() => download("contatos")} disabled={!online}>
        Gerar PDF dos contatos
      </Button>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </div>
  );
}
