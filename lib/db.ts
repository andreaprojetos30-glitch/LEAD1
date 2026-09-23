import Dexie, { type Table } from "dexie";
import type { Evento, Lead } from "@/lib/domain";

export type OutboxItem = {
  id: string;
  kind: "evento" | "lead";
  op: "upsert" | "delete";
  payload: Evento | Lead;
  createdAt: string;
};

export type MetaRow = {
  key: string;
  value: string;
};

class ElevaDB extends Dexie {
  outbox!: Table<OutboxItem, string>;
  leads!: Table<Lead, string>;
  eventos!: Table<Evento, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super("eleva-leads");
    this.version(1).stores({
      outbox: "id, createdAt, kind",
      leads: "id, evento_id, celular_normalizado, created_at",
      eventos: "id, status, created_at",
      meta: "key",
    });
  }
}

export const db = new ElevaDB();
