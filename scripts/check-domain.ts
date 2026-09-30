import assert from "node:assert/strict";
import {
  digits,
  maskCep,
  maskPhone,
  normalizeText,
  startOfTodaySaoPaulo,
  summarize,
  validateLead,
  type Lead,
} from "../lib/domain.ts";

assert.equal(maskPhone("83988887777"), "(83) 98888-7777");
assert.equal(maskPhone("8332221111"), "(83) 3222-1111");
assert.equal(maskCep("58000000"), "58000-000");
assert.equal(digits("(83) 98888-7777"), "83988887777");
assert.equal(normalizeText("  Residencial   Açácias "), "residencial acacias");

assert.equal(
  validateLead({
    nome: "",
    celular: "83988887777",
    condominio: "Nantes",
    cep: "",
    quantidadeUnidades: "",
    perfil: "sindico",
  }),
  "Informe o nome.",
);
assert.equal(
  validateLead({
    nome: "Ana",
    celular: "123",
    condominio: "Nantes",
    cep: "",
    quantidadeUnidades: "",
    perfil: "sindico",
  }),
  "Informe um celular válido com DDD.",
);
assert.equal(
  validateLead({
    nome: "Ana",
    celular: "83988887777",
    condominio: "Nantes",
    cep: "58000-000",
    quantidadeUnidades: "120",
    perfil: "sindico",
  }),
  null,
);

const base = {
  evento_id: "evento",
  celular: "(83) 98888-7777",
  celular_normalizado: "83988887777",
  perfil: "sindico" as const,
  cep: null,
  logradouro: null,
  numero: null,
  bairro: null,
  cidade: "João Pessoa",
  estado: "PB",
  possui_academia: "sim" as const,
  interesse: "sim" as const,
  observacao: null,
  consultor: null,
  created_at: "2026-09-22T15:00:00.000Z",
  updated_at: "2026-09-22T15:00:00.000Z",
};

function lead(partial: Partial<Lead> & Pick<Lead, "id" | "nome" | "condominio">): Lead {
  return {
    ...base,
    quantidade_unidades: null,
    ...partial,
    nome_normalizado: normalizeText(partial.nome),
    condominio_normalizado: normalizeText(partial.condominio),
  };
}

const stats = summarize([
  lead({ id: "1", nome: "Ana", condominio: "Nantes", quantidade_unidades: 100, perfil: "sindico" }),
  lead({
    id: "2",
    nome: "Bruno",
    condominio: "nantes",
    quantidade_unidades: 140,
    perfil: "morador",
    possui_academia: "nao",
    interesse: "talvez",
  }),
  lead({
    id: "3",
    nome: "Carla",
    condominio: "Acácias",
    quantidade_unidades: 80,
    perfil: "conselho",
    possui_academia: null,
    interesse: null,
  }),
]);

assert.equal(stats.totalLeads, 3);
assert.equal(stats.totalCondominios, 2);
assert.equal(stats.somaUnidades, 220);
assert.equal(stats.perfil.sindico, 1);
assert.equal(stats.academiaNaoInformado, 1);
assert.equal(stats.interesseNaoInformado, 1);
assert.ok(!Number.isNaN(startOfTodaySaoPaulo().getTime()));

console.log("domain ok");
