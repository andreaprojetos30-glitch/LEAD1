"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionLink, Button, Choice, Field, Notice, PageHeader, TextArea, TextInput, WithoutBrowserFill } from "@/components/ui";
import { useActiveEvento } from "@/components/useData";
import {
  digits,
  maskCep,
  maskPhone,
  normalizeText,
  PERFIL_LABEL,
  PERFIS,
  validateLead,
  type Academia,
  type Interesse,
  type Lead,
  type Perfil,
} from "@/lib/domain";
import { clearDraft, findDuplicates, getLead, saveLead } from "@/lib/repository";

type FormState = {
  nome: string;
  celular: string;
  condominio: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  quantidadeUnidades: string;
  possuiAcademia: Academia | "";
  perfil: Perfil | "";
  interesse: Interesse | "";
  observacao: string;
  consultor: string;
};

const emptyForm = (): FormState => ({
  nome: "",
  celular: "",
  condominio: "",
  cep: "",
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  quantidadeUnidades: "",
  possuiAcademia: "",
  perfil: "",
  interesse: "",
  observacao: "",
  consultor: "",
});

function leadToForm(lead: Lead): FormState {
  return {
    nome: lead.nome,
    celular: lead.celular,
    condominio: lead.condominio,
    cep: lead.cep ?? "",
    logradouro: lead.logradouro ?? "",
    numero: lead.numero ?? "",
    bairro: lead.bairro ?? "",
    cidade: lead.cidade ?? "",
    estado: lead.estado ?? "",
    quantidadeUnidades: lead.quantidade_unidades == null ? "" : String(lead.quantidade_unidades),
    possuiAcademia: lead.possui_academia ?? "",
    perfil: lead.perfil,
    interesse: lead.interesse ?? "",
    observacao: lead.observacao ?? "",
    consultor: lead.consultor ?? "",
  };
}

export function NovoLead() {
  const params = useSearchParams();
  const editingId = params.get("id");
  const router = useRouter();
  const { evento, loading } = useActiveEvento();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [existing, setExisting] = useState<Lead | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [cepNote, setCepNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [duplicates, setDuplicates] = useState<Lead[]>([]);
  const [saved, setSaved] = useState<{ nome: string; condominio: string; synced: boolean } | null>(null);

  useEffect(() => {
    let cancel = false;
    async function load() {
      if (editingId) {
        const lead = await getLead(editingId);
        if (!cancel && lead) {
          setExisting(lead);
          setForm(leadToForm(lead));
        }
      } else {
        await clearDraft();
        if (!cancel) setForm(emptyForm());
      }
      if (!cancel) setReady(true);
    }
    void load();
    return () => {
      cancel = true;
    };
  }, [editingId]);

  useEffect(() => {
    const cep = digits(form.cep);
    if (cep.length !== 8) return;
    const controller = new AbortController();
    setCepNote("Buscando CEP…");
    fetch(`/api/cep/${cep}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("cep");
        return (await response.json()) as {
          logradouro: string;
          bairro: string;
          cidade: string;
          estado: string;
        };
      })
      .then((address) => {
        setForm((current) => ({
          ...current,
          logradouro: address.logradouro || current.logradouro,
          bairro: address.bairro || current.bairro,
          cidade: address.cidade || current.cidade,
          estado: address.estado || current.estado,
        }));
        setCepNote("");
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setCepNote("Não foi possível consultar o CEP. Preencha o endereço manualmente.");
      });
    return () => controller.abort();
  }, [form.cep]);

  function patch(partial: Partial<FormState>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  function buildLead(base?: Lead | null) {
    const now = new Date().toISOString();
    const nome = form.nome.trim();
    const condominio = form.condominio.trim();
    const eventoId = base?.evento_id ?? evento?.id;
    if (!eventoId || !form.perfil) return null;
    const lead: Lead = {
      id: base?.id ?? crypto.randomUUID(),
      evento_id: eventoId,
      nome,
      celular: maskPhone(form.celular),
      celular_normalizado: digits(form.celular),
      perfil: form.perfil,
      condominio,
      condominio_normalizado: normalizeText(condominio),
      nome_normalizado: normalizeText(nome),
      cep: digits(form.cep).length === 8 ? maskCep(form.cep) : null,
      logradouro: form.logradouro.trim() || null,
      numero: form.numero.trim() || null,
      bairro: form.bairro.trim() || null,
      cidade: form.cidade.trim() || null,
      estado: form.estado.trim().toUpperCase() || null,
      quantidade_unidades: form.quantidadeUnidades.trim() ? Number(form.quantidadeUnidades) : null,
      possui_academia: form.possuiAcademia || null,
      interesse: form.interesse || null,
      observacao: form.observacao.trim() || null,
      consultor: form.consultor.trim() || null,
      created_at: base?.created_at ?? now,
      updated_at: now,
    };
    return lead;
  }

  async function persist(base?: Lead | null) {
    const lead = buildLead(base);
    if (!lead) return;
    setSaving(true);
    const result = await saveLead(lead);
    await clearDraft();
    setSaving(false);
    setDuplicates([]);
    if (editingId) {
      router.push(`/leads/${lead.id}`);
      return;
    }
    setSaved({ nome: lead.nome, condominio: lead.condominio, synced: result.synced });
    setForm(emptyForm());
    setExisting(null);
  }

  async function saveNew() {
    setError("");
    const message = validateLead({
      nome: form.nome,
      celular: form.celular,
      condominio: form.condominio,
      cep: form.cep,
      quantidadeUnidades: form.quantidadeUnidades,
      perfil: form.perfil,
    });
    if (message) {
      setError(message);
      return;
    }
    const matches = await findDuplicates({
      id: existing?.id,
      celular: form.celular,
      nome: form.nome,
      condominio: form.condominio,
    });
    if (matches.length) {
      setDuplicates(matches);
      return;
    }
    await persist(existing);
  }

  if (loading || !ready) return <p className="py-16 text-center text-lg text-eleva">Carregando…</p>;

  if (!editingId && !evento) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Novo lead" backHref="/" />
        <Notice>Selecione ou cadastre um evento antes de captar.</Notice>
        <ActionLink href="/evento" variant="primary">
          Cadastrar evento
        </ActionLink>
      </div>
    );
  }

  if (!editingId && evento?.status === "encerrado") {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Novo lead" subtitle={evento.nome} backHref="/" />
        <Notice>Este evento está encerrado. Reabra o evento para continuar a captação.</Notice>
        <ActionLink href="/evento" variant="primary">
          Ver eventos
        </ActionLink>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="flex flex-col gap-5 py-6">
        <p className="text-center font-serif text-4xl text-eleva">Lead cadastrado com sucesso!</p>
        <div className="rounded-3xl bg-white p-5 text-center">
          <p className="text-2xl font-semibold">{saved.nome}</p>
          <p className="mt-1 text-lg text-ink/70">{saved.condominio}</p>
        </div>
        {saved.synced ? null : <Notice>Aguardando sincronização. O cadastro está guardado neste aparelho.</Notice>}
        <Button
          type="button"
          onClick={() => {
            setForm(emptyForm());
            setCepNote("");
            setError("");
            setDuplicates([]);
            setSaved(null);
          }}
        >
          + Cadastrar próximo lead
        </Button>
        <ActionLink href="/" variant="ghost">
          Voltar ao início
        </ActionLink>
      </div>
    );
  }

  const duplicate = duplicates[0];

  return (
    <form autoComplete="off" className="flex flex-col gap-5" onSubmit={(event) => event.preventDefault()}>
      <WithoutBrowserFill>
      <PageHeader
        title={editingId ? "Editar lead" : "Novo lead"}
        subtitle={evento?.nome}
        backHref={editingId && existing ? `/leads/${existing.id}` : "/"}
      />
      <Field label="Nome" required>
        <TextInput value={form.nome} onChange={(event) => patch({ nome: event.target.value })} autoComplete="off" />
      </Field>
      <Field label="Celular / WhatsApp" required>
        <TextInput
          inputMode="tel"
          autoComplete="off"
          placeholder="(00) 00000-0000"
          value={form.celular}
          onChange={(event) => patch({ celular: maskPhone(event.target.value) })}
        />
      </Field>
      <Field label="Nome do condomínio" required>
        <TextInput value={form.condominio} onChange={(event) => patch({ condominio: event.target.value })} />
      </Field>
      <Field label="CEP" hint={cepNote}>
        <TextInput
          inputMode="numeric"
          placeholder="00000-000"
          value={form.cep}
          onChange={(event) => patch({ cep: maskCep(event.target.value) })}
        />
      </Field>
      <Field label="Logradouro">
        <TextInput value={form.logradouro} onChange={(event) => patch({ logradouro: event.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Número">
          <TextInput value={form.numero} onChange={(event) => patch({ numero: event.target.value })} />
        </Field>
        <Field label="Estado">
          <TextInput
            maxLength={2}
            value={form.estado}
            onChange={(event) => patch({ estado: event.target.value.toUpperCase() })}
          />
        </Field>
      </div>
      <Field label="Bairro">
        <TextInput value={form.bairro} onChange={(event) => patch({ bairro: event.target.value })} />
      </Field>
      <Field label="Cidade">
        <TextInput value={form.cidade} onChange={(event) => patch({ cidade: event.target.value })} />
      </Field>
      <Field label="Quantidade de unidades">
        <TextInput
          inputMode="numeric"
          value={form.quantidadeUnidades}
          onChange={(event) => patch({ quantidadeUnidades: digits(event.target.value).slice(0, 5) })}
        />
      </Field>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-eleva">Possui academia?</legend>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["sim", "Sim"],
              ["nao", "Não"],
              ["nao_sei", "Não sei"],
            ] as const
          ).map(([value, label]) => (
            <Choice key={value} selected={form.possuiAcademia === value} onClick={() => patch({ possuiAcademia: value })}>
              {label}
            </Choice>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-eleva">Perfil do lead *</legend>
        <div className="grid grid-cols-2 gap-2">
          {PERFIS.map((perfil) => (
            <Choice key={perfil} selected={form.perfil === perfil} onClick={() => patch({ perfil })}>
              {PERFIL_LABEL[perfil]}
            </Choice>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-eleva">Potencial</legend>
        <p className="mb-2 text-base">Tem interesse em melhorar / implantar a academia?</p>
        <div className="grid grid-cols-1 gap-2">
          {(
            [
              ["sim", "Sim"],
              ["talvez", "Talvez"],
              ["nao", "Não"],
              ["nao_conversado", "Não conversamos sobre isso"],
            ] as const
          ).map(([value, label]) => (
            <Choice key={value} selected={form.interesse === value} onClick={() => patch({ interesse: value })}>
              {label}
            </Choice>
          ))}
        </div>
      </fieldset>
      <Field label="Observação" hint='Ex.: "Vai levar proposta para assembleia"'>
        <TextArea
          maxLength={280}
          value={form.observacao}
          onChange={(event) => patch({ observacao: event.target.value })}
        />
      </Field>
      <Field label="Consultor">
        <TextInput
          autoComplete="off"
          value={form.consultor}
          onChange={(event) => patch({ consultor: event.target.value })}
        />
      </Field>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {duplicate ? (
        <div className="flex flex-col gap-3 rounded-3xl border border-gold bg-white p-4">
          <p className="text-lg font-semibold text-eleva">Este contato pode já estar cadastrado.</p>
          <p>
            {duplicate.nome} · {duplicate.condominio}
          </p>
          <p className="text-sm text-ink/70">
            {duplicate.celular} · {PERFIL_LABEL[duplicate.perfil]}
            {duplicates.length > 1 ? ` · e mais ${duplicates.length - 1}` : ""}
          </p>
          <Link href={`/leads/${duplicate.id}`} className="text-center text-sm font-semibold uppercase tracking-wide text-gold">
            Ver cadastro
          </Link>
          <Button type="button" variant="gold" disabled={saving} onClick={() => persist(duplicate)}>
            Atualizar existente
          </Button>
          <Button type="button" variant="ghost" disabled={saving} onClick={() => persist(existing)}>
            Cadastrar mesmo assim
          </Button>
        </div>
      ) : (
        <Button type="button" disabled={saving} onClick={() => void saveNew()}>
          {saving ? "Salvando…" : "Salvar lead"}
        </Button>
      )}
      </WithoutBrowserFill>
    </form>
  );
}
