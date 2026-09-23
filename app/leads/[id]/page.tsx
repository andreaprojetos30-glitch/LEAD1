"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionLink, Button, Loading, Notice, PageHeader } from "@/components/ui";
import {
  formatDateTime,
  labelAcademia,
  labelInteresse,
  PERFIL_LABEL,
  type Lead,
} from "@/lib/domain";
import { deleteLead, getEvento, getLead, subscribeData } from "@/lib/repository";
import type { Evento } from "@/lib/domain";

export default function LeadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null | undefined>(undefined);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let cancel = false;
    const load = () => {
      getLead(params.id).then(async (row) => {
        if (cancel) return;
        setLead(row ?? null);
        if (row) setEvento((await getEvento(row.evento_id)) ?? null);
      });
    };
    load();
    const unsubscribe = subscribeData(load);
    return () => {
      cancel = true;
      unsubscribe();
    };
  }, [params.id]);

  if (lead === undefined) return <Loading />;
  if (!lead) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Lead" backHref="/leads" />
        <Notice>Este cadastro não está neste aparelho.</Notice>
      </div>
    );
  }

  const rows: Array<[string, string]> = [
    ["Evento", evento?.nome || ""],
    ["Celular", lead.celular],
    ["Perfil", PERFIL_LABEL[lead.perfil]],
    ["Condomínio", lead.condominio],
    ["CEP", lead.cep || ""],
    ["Logradouro", lead.logradouro || ""],
    ["Número", lead.numero || ""],
    ["Bairro", lead.bairro || ""],
    ["Cidade", lead.cidade || ""],
    ["Estado", lead.estado || ""],
    ["Unidades", lead.quantidade_unidades == null ? "" : String(lead.quantidade_unidades)],
    ["Possui academia", labelAcademia(lead.possui_academia)],
    ["Interesse", labelInteresse(lead.interesse)],
    ["Observação", lead.observacao || ""],
    ["Cadastro", formatDateTime(lead.created_at)],
    ["Atualização", formatDateTime(lead.updated_at)],
  ];

  return (
    <main className="flex flex-col gap-4">
      <PageHeader title={lead.nome} subtitle={lead.condominio} backHref="/leads" />
      <dl className="rounded-3xl bg-white p-4">
        {rows.filter(([, value]) => value).map(([label, value]) => (
          <div key={label} className="border-b border-cream py-3 last:border-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-gold">{label}</dt>
            <dd className="mt-1 text-lg">{value}</dd>
          </div>
        ))}
      </dl>
      <ActionLink href={`/lead/novo?id=${lead.id}`} variant="primary">
        Editar
      </ActionLink>
      {confirming ? (
        <div className="flex flex-col gap-3 rounded-3xl bg-white p-4">
          <p className="text-lg">Excluir o cadastro de {lead.nome}?</p>
          <Button
            type="button"
            variant="danger"
            onClick={async () => {
              await deleteLead(lead.id);
              router.push("/leads");
            }}
          >
            Confirmar exclusão
          </Button>
          <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
            Voltar
          </Button>
        </div>
      ) : (
        <Button type="button" variant="danger" onClick={() => setConfirming(true)}>
          Excluir
        </Button>
      )}
    </main>
  );
}
