import ExcelJS from "exceljs";
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatTime,
  INTERESSE_LABEL,
  labelAcademia,
  labelInteresse,
  PERFIL_LABEL,
  PERFIS,
  slugify,
  summarize,
  type Evento,
  type Lead,
} from "@/lib/domain";

export function workbookName(evento: Evento) {
  return `ELEVA-leads-${slugify(evento.nome)}.xlsx`;
}

export async function buildWorkbook(evento: Evento, leads: Lead[]) {
  const stats = summarize(leads);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ELEVA Captação de Leads";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Leads");
  sheet.columns = [
    { header: "ID", key: "id", width: 38 },
    { header: "Evento", key: "evento", width: 32 },
    { header: "Data", key: "data", width: 14 },
    { header: "Hora", key: "hora", width: 10 },
    { header: "Nome", key: "nome", width: 28 },
    { header: "Celular", key: "celular", width: 20 },
    { header: "Perfil", key: "perfil", width: 18 },
    { header: "Condomínio", key: "condominio", width: 32 },
    { header: "CEP", key: "cep", width: 12 },
    { header: "Logradouro", key: "logradouro", width: 32 },
    { header: "Número", key: "numero", width: 12 },
    { header: "Bairro", key: "bairro", width: 22 },
    { header: "Cidade", key: "cidade", width: 22 },
    { header: "Estado", key: "estado", width: 10 },
    { header: "Quantidade de unidades", key: "unidades", width: 24 },
    { header: "Possui academia", key: "academia", width: 18 },
    { header: "Interesse", key: "interesse", width: 28 },
    { header: "Observação", key: "observacao", width: 40 },
    { header: "Data de criação", key: "criacao", width: 20 },
    { header: "Última atualização", key: "atualizacao", width: 22 },
  ];

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFF3F0EA" }, name: "Calibri" };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A2B" } };
  header.alignment = { vertical: "middle" };
  header.height = 22;

  for (const lead of leads) {
    sheet.addRow({
      id: lead.id,
      evento: evento.nome,
      data: formatDate(lead.created_at),
      hora: formatTime(lead.created_at),
      nome: lead.nome,
      celular: lead.celular,
      perfil: PERFIL_LABEL[lead.perfil],
      condominio: lead.condominio,
      cep: lead.cep ?? "",
      logradouro: lead.logradouro ?? "",
      numero: lead.numero ?? "",
      bairro: lead.bairro ?? "",
      cidade: lead.cidade ?? "",
      estado: lead.estado ?? "",
      unidades: lead.quantidade_unidades ?? "",
      academia: labelAcademia(lead.possui_academia),
      interesse: labelInteresse(lead.interesse),
      observacao: lead.observacao ?? "",
      criacao: formatDateTime(lead.created_at),
      atualizacao: formatDateTime(lead.updated_at),
    });
  }
  sheet.autoFilter = { from: "A1", to: "T1" };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const resumo = workbook.addWorksheet("RESUMO DO EVENTO");
  resumo.columns = [
    { header: "Indicador", key: "indicador", width: 42 },
    { header: "Quantidade", key: "quantidade", width: 18 },
  ];
  const resumoHeader = resumo.getRow(1);
  resumoHeader.font = { bold: true, color: { argb: "FFF3F0EA" } };
  resumoHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A2B" } };

  const rows: Array<[string, string | number]> = [
    ["Total de leads", stats.totalLeads],
    ["Total de condomínios", stats.totalCondominios],
    ["Total de unidades", stats.somaUnidades],
    ["Média de unidades por condomínio", formatNumber(stats.mediaUnidades)],
  ];
  for (const perfil of PERFIS) rows.push([PERFIL_LABEL[perfil], stats.perfil[perfil]]);
  rows.push(
    ["Com academia", stats.academiaSim],
    ["Sem academia", stats.academiaNao],
    ["Academia não informada / não sabe", stats.academiaNaoInformado],
    ["Interesse: Sim", stats.interesseSim],
    ["Interesse: Talvez", stats.interesseTalvez],
    ["Interesse: Não", stats.interesseNao],
    [`Interesse: ${INTERESSE_LABEL.nao_conversado}`, stats.interesseNaoConversado],
    ["Interesse não informado", stats.interesseNaoInformado],
  );
  for (const [indicador, quantidade] of rows) resumo.addRow({ indicador, quantidade });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
