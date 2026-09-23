import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import {
  formatNumber,
  formatPeriod,
  PERFIL_LABEL,
  PERFIS,
  slugify,
  type Evento,
  type EventStats,
} from "@/lib/domain";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#f3f0ea",
    padding: 36,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  band: {
    backgroundColor: "#1e3a2b",
    borderRadius: 8,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  brand: {
    color: "#d4bc8a",
    fontSize: 22,
    letterSpacing: 4,
  },
  title: {
    color: "#f3f0ea",
    fontSize: 13,
    marginTop: 8,
    letterSpacing: 1,
  },
  event: {
    fontSize: 18,
    marginBottom: 4,
    color: "#1e3a2b",
  },
  meta: {
    fontSize: 11,
    color: "#3d3d3d",
    marginBottom: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
    marginBottom: 8,
  },
  metric: {
    width: "32%",
    backgroundColor: "#ffffff",
    borderRadius: 6,
    padding: 10,
    marginRight: "1.3%",
    marginBottom: 8,
    borderTopWidth: 3,
    borderTopColor: "#b08d57",
  },
  metricValue: {
    fontSize: 18,
    color: "#1e3a2b",
  },
  metricLabel: {
    fontSize: 8,
    marginTop: 3,
    color: "#5c5346",
    textTransform: "uppercase",
  },
  section: {
    marginTop: 8,
    backgroundColor: "#ffffff",
    borderRadius: 6,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 11,
    color: "#1e3a2b",
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e6e0d6",
    paddingVertical: 4,
  },
  rowLabel: { fontSize: 10, color: "#1a1a1a" },
  rowValue: { fontSize: 10, color: "#1e3a2b" },
  footer: {
    marginTop: 16,
    fontSize: 9,
    color: "#8d7044",
  },
});

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Rows({ items }: { items: Array<[string, number]> }) {
  return (
    <View>
      {items.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowValue}>{String(value)}</Text>
        </View>
      ))}
    </View>
  );
}

export function pdfName(evento: Evento) {
  return `ELEVA-relatorio-${slugify(evento.nome)}.pdf`;
}

export async function buildPdf(evento: Evento, stats: EventStats) {
  const document = (
    <Document title="RELATÓRIO DE CAPTAÇÃO — ELEVA" author="ELEVA Fitness">
      <Page size="A4" style={styles.page}>
        <View style={styles.band}>
          <Text style={styles.brand}>ELEVA</Text>
          <Text style={styles.title}>RELATÓRIO DE CAPTAÇÃO — ELEVA</Text>
        </View>
        <Text style={styles.event}>{evento.nome}</Text>
        <Text style={styles.meta}>Período: {formatPeriod(evento.data_inicio, evento.data_fim)}</Text>
        <Text style={styles.meta}>Cidade: {evento.cidade || "Não informada"}</Text>
        {evento.local ? <Text style={styles.meta}>Local: {evento.local}</Text> : null}
        <View style={styles.grid}>
          <Metric label="Total de leads" value={String(stats.totalLeads)} />
          <Metric label="Condomínios alcançados" value={String(stats.totalCondominios)} />
          <Metric label="Unidades alcançadas" value={formatNumber(stats.somaUnidades)} />
          <Metric label="Síndicos captados" value={String(stats.perfil.sindico)} />
          <Metric label="Leads interessados" value={String(stats.interesseSim)} />
          <Metric label="Média de unidades" value={formatNumber(stats.mediaUnidades)} />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERFIL DOS LEADS</Text>
          <Rows items={PERFIS.map((perfil) => [PERFIL_LABEL[perfil], stats.perfil[perfil]])} />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACADEMIA</Text>
          <Rows
            items={[
              ["Possui academia", stats.academiaSim],
              ["Não possui", stats.academiaNao],
              ["Não informado / não sabe", stats.academiaNaoInformado],
            ]}
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INTERESSE</Text>
          <Rows
            items={[
              ["Sim", stats.interesseSim],
              ["Talvez", stats.interesseTalvez],
              ["Não", stats.interesseNao],
              ["Não conversado", stats.interesseNaoConversado],
              ["Não informado", stats.interesseNaoInformado],
            ]}
          />
        </View>
        <Text style={styles.footer}>Eleva Fitness · bem-estar em cada espaço</Text>
      </Page>
    </Document>
  );

  return renderToBuffer(document);
}
