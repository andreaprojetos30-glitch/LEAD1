export type Perfil =
  | "sindico"
  | "subsindico"
  | "conselho"
  | "morador"
  | "administradora"
  | "outro";

export type Academia = "sim" | "nao" | "nao_sei";
export type Interesse = "sim" | "talvez" | "nao" | "nao_conversado";
export type EventoStatus = "ativo" | "encerrado";

export type Evento = {
  id: string;
  nome: string;
  cidade: string | null;
  local: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  status: EventoStatus;
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  evento_id: string;
  nome: string;
  celular: string;
  celular_normalizado: string;
  perfil: Perfil;
  condominio: string;
  condominio_normalizado: string;
  nome_normalizado: string;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  quantidade_unidades: number | null;
  possui_academia: Academia | null;
  interesse: Interesse | null;
  observacao: string | null;
  consultor: string | null;
  created_at: string;
  updated_at: string;
};

export const PERFIS: Perfil[] = [
  "sindico",
  "subsindico",
  "conselho",
  "morador",
  "administradora",
  "outro",
];

export const PERFIL_LABEL: Record<Perfil, string> = {
  sindico: "Síndico",
  subsindico: "Subsíndico",
  conselho: "Conselho",
  morador: "Morador",
  administradora: "Administradora",
  outro: "Outro",
};

export const ACADEMIA_LABEL: Record<Academia, string> = {
  sim: "Sim",
  nao: "Não",
  nao_sei: "Não sei",
};

export const INTERESSE_LABEL: Record<Interesse, string> = {
  sim: "Sim",
  talvez: "Talvez",
  nao: "Não",
  nao_conversado: "Não conversamos sobre isso",
};

export type EventStats = {
  totalLeads: number;
  totalCondominios: number;
  somaUnidades: number;
  mediaUnidades: number;
  perfil: Record<Perfil, number>;
  academiaSim: number;
  academiaNao: number;
  academiaNaoInformado: number;
  interesseSim: number;
  interesseTalvez: number;
  interesseNao: number;
  interesseNaoConversado: number;
  interesseNaoInformado: number;
};

export function digits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function maskPhone(value: string) {
  const d = digits(value).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length < 3) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskCep(value: string) {
  const d = digits(value).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function labelAcademia(value: Academia | null) {
  if (!value) return "";
  return ACADEMIA_LABEL[value];
}

export function labelInteresse(value: Interesse | null) {
  if (!value) return "";
  return INTERESSE_LABEL[value];
}

export function formatDateOnly(isoDate: string | null) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.slice(0, 10).split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

export function formatPeriod(inicio: string | null, fim: string | null) {
  const a = formatDateOnly(inicio);
  const b = formatDateOnly(fim);
  if (a && b && a !== b) return `${a} a ${b}`;
  return a || b || "Período não informado";
}

const saoPauloDateTime = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const saoPauloDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const saoPauloTime = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(iso: string) {
  return saoPauloDateTime.format(new Date(iso));
}

export function formatDate(iso: string) {
  return saoPauloDate.format(new Date(iso));
}

export function formatTime(iso: string) {
  return saoPauloTime.format(new Date(iso));
}

export function startOfTodaySaoPaulo(now = new Date()) {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${day}T00:00:00-03:00`);
}

export function isSameSaoPauloDay(iso: string, day: string) {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
  return formatted === day;
}

export function slugify(value: string) {
  const slug = normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "evento";
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value);
}

export function emptyStats(): EventStats {
  return {
    totalLeads: 0,
    totalCondominios: 0,
    somaUnidades: 0,
    mediaUnidades: 0,
    perfil: {
      sindico: 0,
      subsindico: 0,
      conselho: 0,
      morador: 0,
      administradora: 0,
      outro: 0,
    },
    academiaSim: 0,
    academiaNao: 0,
    academiaNaoInformado: 0,
    interesseSim: 0,
    interesseTalvez: 0,
    interesseNao: 0,
    interesseNaoConversado: 0,
    interesseNaoInformado: 0,
  };
}

export function summarize(leads: Lead[]): EventStats {
  const stats = emptyStats();
  stats.totalLeads = leads.length;
  const condos = new Map<string, number | null>();

  for (const lead of leads) {
    stats.perfil[lead.perfil] += 1;
    if (lead.possui_academia === "sim") stats.academiaSim += 1;
    else if (lead.possui_academia === "nao") stats.academiaNao += 1;
    else stats.academiaNaoInformado += 1;

    if (lead.interesse === "sim") stats.interesseSim += 1;
    else if (lead.interesse === "talvez") stats.interesseTalvez += 1;
    else if (lead.interesse === "nao") stats.interesseNao += 1;
    else if (lead.interesse === "nao_conversado") stats.interesseNaoConversado += 1;
    else stats.interesseNaoInformado += 1;

    const key = lead.condominio_normalizado || normalizeText(lead.condominio);
    const current = condos.get(key);
    const units = lead.quantidade_unidades;
    if (current === undefined) condos.set(key, units);
    else if (units != null && (current == null || units > current)) condos.set(key, units);
  }

  stats.totalCondominios = condos.size;
  const withUnits = [...condos.values()].filter((value): value is number => value != null);
  stats.somaUnidades = withUnits.reduce((sum, value) => sum + value, 0);
  stats.mediaUnidades = withUnits.length ? stats.somaUnidades / withUnits.length : 0;
  return stats;
}

export type LeadInput = {
  nome: string;
  celular: string;
  condominio: string;
  cep: string;
  quantidadeUnidades: string;
  perfil: Perfil | "";
};

export function validateLead(input: LeadInput) {
  if (!input.nome.trim()) return "Informe o nome.";
  const phone = digits(input.celular);
  if (phone.length < 10 || phone.length > 11) return "Informe um celular válido com DDD.";
  if (!input.condominio.trim()) return "Informe o nome do condomínio.";
  if (!input.perfil) return "Selecione o perfil do lead.";
  if (input.cep.trim() && digits(input.cep).length !== 8) return "CEP incompleto. Use 8 números.";
  if (input.quantidadeUnidades.trim()) {
    const units = Number(input.quantidadeUnidades);
    if (!Number.isInteger(units) || units < 0) return "Quantidade de unidades inválida.";
  }
  return null;
}

export function validateEvento(nome: string) {
  if (!nome.trim()) return "Informe o nome do evento.";
  return null;
}
