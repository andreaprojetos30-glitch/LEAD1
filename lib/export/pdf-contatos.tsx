import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import {
  formatPeriod,
  labelInteresse,
  PERFIL_LABEL,
  slugify,
  type Evento,
  type Lead,
} from "@/lib/domain";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#f3f0ea",
    padding: 28,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  band: {
    backgroundColor: "#1e3a2b",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  brand: {
    color: "#d4bc8a",
    fontSize: 18,
    letterSpacing: 4,
  },
  title: {
    color: "#f3f0ea",
    fontSize: 12,
    marginTop: 6,
    letterSpacing: 1,
  },
  event: {
    fontSize: 14,
    marginBottom: 2,
    color: "#1e3a2b",
  },
  meta: {
    fontSize: 10,
    color: "#3d3d3d",
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#1e3a2b",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  headerCell: {
    color: "#f3f0ea",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  row: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#e6e0d6",
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: "#ffffff",
  },
  cells: {
    flexDirection: "row",
  },
  cell: {
    fontSize: 9,
    color: "#1a1a1a",
  },
  note: {
    marginTop: 2,
    fontSize: 8,
    color: "#5c5346",
  },
  empty: {
    marginTop: 12,
    fontSize: 11,
    color: "#1e3a2b",
  },
  footer: {
    marginTop: 12,
    fontSize: 8,
    color: "#8d7044",
  },
  nome: { width: "18%" },
  celular: { width: "14%" },
  perfil: { width: "13%" },
  condominio: { width: "22%" },
  cidade: { width: "15%" },
  interesse: { width: "18%" },
});

function cityLine(lead: Lead) {
  return [lead.cidade, lead.estado].filter(Boolean).join(" / ");
}

export function contatosPdfName(evento: Evento) {
  return `ELEVA-contatos-${slugify(evento.nome)}.pdf`;
}

export async function buildContatosPdf(evento: Evento, leads: Lead[]) {
  const rows = [...leads].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const document = (
    <Document title="CONTATOS CAPTADOS — ELEVA" author="ELEVA Fitness">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.band}>
          <Text style={styles.brand}>ELEVA</Text>
          <Text style={styles.title}>CONTATOS CAPTADOS — ELEVA</Text>
        </View>
        <Text style={styles.event}>{evento.nome}</Text>
        <Text style={styles.meta}>
          Período: {formatPeriod(evento.data_inicio, evento.data_fim)} · {rows.length}{" "}
          {rows.length === 1 ? "contato" : "contatos"}
        </Text>
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.nome]}>Nome</Text>
          <Text style={[styles.headerCell, styles.celular]}>Celular</Text>
          <Text style={[styles.headerCell, styles.perfil]}>Perfil</Text>
          <Text style={[styles.headerCell, styles.condominio]}>Condomínio</Text>
          <Text style={[styles.headerCell, styles.cidade]}>Cidade</Text>
          <Text style={[styles.headerCell, styles.interesse]}>Interesse</Text>
        </View>
        {rows.length === 0 ? <Text style={styles.empty}>Nenhum contato neste evento.</Text> : null}
        {rows.map((lead) => (
          <View key={lead.id} style={styles.row} wrap={false}>
            <View style={styles.cells}>
              <Text style={[styles.cell, styles.nome]}>{lead.nome}</Text>
              <Text style={[styles.cell, styles.celular]}>{lead.celular}</Text>
              <Text style={[styles.cell, styles.perfil]}>{PERFIL_LABEL[lead.perfil]}</Text>
              <Text style={[styles.cell, styles.condominio]}>{lead.condominio}</Text>
              <Text style={[styles.cell, styles.cidade]}>{cityLine(lead) || "—"}</Text>
              <Text style={[styles.cell, styles.interesse]}>{labelInteresse(lead.interesse) || "—"}</Text>
            </View>
            {lead.consultor ? <Text style={styles.note}>Consultor: {lead.consultor}</Text> : null}
            {lead.observacao ? <Text style={styles.note}>Obs.: {lead.observacao}</Text> : null}
          </View>
        ))}
        <Text style={styles.footer}>Eleva Fitness · bem-estar em cada espaço</Text>
      </Page>
    </Document>
  );

  return renderToBuffer(document);
}
