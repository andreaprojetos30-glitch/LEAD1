"use client";

import type { Evento, EventoStatus, Lead } from "@/lib/domain";
import { digits, normalizeText } from "@/lib/domain";
import { db, type OutboxItem } from "@/lib/db";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const ACTIVE_EVENT_KEY = "eleva-evento-id";
const DRAFT_KEY = "draft-new";

const listeners = new Set<() => void>();

export function subscribeData(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((listener) => listener());
}

async function pushOutboxItem(
  supabase: ReturnType<typeof createClient>,
  item: OutboxItem,
) {
  if (item.op === "delete") {
    const query =
      item.kind === "evento"
        ? supabase.from("eventos").delete().eq("id", item.id)
        : supabase.from("leads").delete().eq("id", item.id);
    return query;
  }
  if (item.kind === "evento") {
    return supabase.from("eventos").upsert(item.payload as Evento);
  }
  return supabase.from("leads").upsert(item.payload as Lead);
}

function canSync() {
  return typeof navigator !== "undefined" && navigator.onLine && isSupabaseConfigured();
}

function isNetworkError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  if (error.code) return false;
  const message = (error.message || "").toLowerCase();
  return (
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("failed") ||
    message.includes("timeout")
  );
}

export function getActiveEventoId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_EVENT_KEY);
}

export function setActiveEventoId(id: string) {
  localStorage.setItem(ACTIVE_EVENT_KEY, id);
  emit();
}

export function clearActiveEventoId() {
  localStorage.removeItem(ACTIVE_EVENT_KEY);
  emit();
}

export async function listEventos() {
  const rows = await db.eventos.toArray();
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getEvento(id: string) {
  return db.eventos.get(id);
}

export async function listLeads() {
  const rows = await db.leads.toArray();
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getLead(id: string) {
  return db.leads.get(id);
}

export async function pendingCount() {
  return db.outbox.count();
}

export async function saveDraft(value: unknown) {
  await db.meta.put({ key: DRAFT_KEY, value: JSON.stringify(value) });
}

export async function loadDraft<T>() {
  const row = await db.meta.get(DRAFT_KEY);
  if (!row) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

export async function clearDraft() {
  await db.meta.delete(DRAFT_KEY);
}

async function queue(item: OutboxItem) {
  await db.outbox.put(item);
}

export async function saveEvento(evento: Evento) {
  await db.eventos.put(evento);
  await queue({
    id: evento.id,
    kind: "evento",
    op: "upsert",
    payload: evento,
    createdAt: evento.updated_at,
  });
  if (!canSync()) {
    emit();
    return { synced: false as const };
  }
  const { error } = await createClient().from("eventos").upsert(evento);
  if (error) {
    emit();
    return { synced: false as const };
  }
  await db.outbox.delete(evento.id);
  emit();
  return { synced: true as const };
}

export async function setEventoStatus(id: string, status: EventoStatus) {
  const evento = await db.eventos.get(id);
  if (!evento) return { synced: false as const };
  return saveEvento({ ...evento, status, updated_at: new Date().toISOString() });
}

export async function saveLead(lead: Lead) {
  await db.leads.put(lead);
  await queue({
    id: lead.id,
    kind: "lead",
    op: "upsert",
    payload: lead,
    createdAt: lead.updated_at,
  });
  if (!canSync()) {
    emit();
    return { synced: false as const };
  }
  const { error } = await createClient().from("leads").upsert(lead);
  if (error) {
    emit();
    return { synced: false as const };
  }
  await db.outbox.delete(lead.id);
  emit();
  return { synced: true as const };
}

export async function deleteLead(id: string) {
  const queued = await db.outbox.get(id);
  const lead = await db.leads.get(id);
  if (queued?.op === "upsert" && queued.kind === "lead") {
    await db.outbox.delete(id);
    await db.leads.delete(id);
    emit();
    return { synced: true as const };
  }
  if (!lead) {
    emit();
    return { synced: true as const };
  }
  await queue({
    id,
    kind: "lead",
    op: "delete",
    payload: lead,
    createdAt: new Date().toISOString(),
  });
  await db.leads.delete(id);
  if (!canSync()) {
    emit();
    return { synced: false as const };
  }
  const { error } = await createClient().from("leads").delete().eq("id", id);
  if (error) {
    emit();
    return { synced: false as const };
  }
  await db.outbox.delete(id);
  emit();
  return { synced: true as const };
}

export async function findDuplicates(input: {
  id?: string;
  celular: string;
  nome: string;
  condominio: string;
}) {
  const phone = digits(input.celular);
  const nome = normalizeText(input.nome);
  const condominio = normalizeText(input.condominio);
  const local = await listLeads();
  const found = new Map<string, Lead>();

  const consider = (lead: Lead) => {
    if (input.id && lead.id === input.id) return;
    const samePhone = phone.length >= 10 && lead.celular_normalizado === phone;
    const samePerson =
      nome.length > 0 &&
      condominio.length > 0 &&
      lead.nome_normalizado === nome &&
      lead.condominio_normalizado === condominio;
    if (samePhone || samePerson) found.set(lead.id, lead);
  };

  local.forEach(consider);

  if (canSync()) {
    const supabase = createClient();
    const queries = [];
    if (phone.length >= 10) {
      queries.push(supabase.from("leads").select("*").eq("celular_normalizado", phone));
    }
    if (nome && condominio) {
      queries.push(
        supabase
          .from("leads")
          .select("*")
          .eq("nome_normalizado", nome)
          .eq("condominio_normalizado", condominio),
      );
    }
    const results = await Promise.all(queries);
    for (const result of results) {
      if (result.error || !result.data) continue;
      for (const row of result.data as Lead[]) {
        await db.leads.put(row);
        consider(row);
      }
    }
  }

  return [...found.values()].sort((a, b) => {
    const aPhone = a.celular_normalizado === phone ? 0 : 1;
    const bPhone = b.celular_normalizado === phone ? 0 : 1;
    return aPhone - bPhone || b.created_at.localeCompare(a.created_at);
  });
}

async function applyServerSnapshot(eventos: Evento[], leads: Lead[]) {
  await db.transaction("rw", db.eventos, db.leads, db.outbox, async () => {
    const pending = new Set((await db.outbox.toArray()).map((item) => item.id));
    const eventoIds = new Set(eventos.map((evento) => evento.id));
    const leadIds = new Set(leads.map((lead) => lead.id));

    for (const local of await db.eventos.toArray()) {
      if (!eventoIds.has(local.id) && !pending.has(local.id)) await db.eventos.delete(local.id);
    }
    for (const local of await db.leads.toArray()) {
      if (!leadIds.has(local.id) && !pending.has(local.id)) await db.leads.delete(local.id);
    }

    if (eventos.length) await db.eventos.bulkPut(eventos);
    if (leads.length) await db.leads.bulkPut(leads);

    for (const item of await db.outbox.toArray()) {
      if (item.op === "delete") {
        if (item.kind === "evento") await db.eventos.delete(item.id);
        else await db.leads.delete(item.id);
      } else if (item.kind === "evento") {
        await db.eventos.put(item.payload as Evento);
      } else {
        await db.leads.put(item.payload as Lead);
      }
    }
  });
}

export async function syncAll() {
  if (!canSync()) {
    emit();
    return;
  }
  const supabase = createClient();
  const items = await db.outbox.orderBy("createdAt").toArray();
  const groups: OutboxItem[][] = [
    items.filter((item) => item.kind === "evento" && item.op === "upsert"),
    items.filter((item) => item.kind === "lead" && item.op === "upsert"),
    items.filter((item) => item.op === "delete"),
  ];

  for (const group of groups) {
    for (const item of group) {
      const result = await pushOutboxItem(supabase, item);
      if (result.error) {
        if (isNetworkError(result.error)) {
          emit();
          return;
        }
        continue;
      }
      await db.outbox.delete(item.id);
    }
  }

  const [eventosResult, leadsResult] = await Promise.all([
    supabase.from("eventos").select("*"),
    supabase.from("leads").select("*"),
  ]);
  if (!eventosResult.error && !leadsResult.error && eventosResult.data && leadsResult.data) {
    await applyServerSnapshot(eventosResult.data as Evento[], leadsResult.data as Lead[]);
  }
  emit();
}
