import { buildPdf, pdfName } from "@/lib/export/pdf";
import { buildWorkbook, workbookName } from "@/lib/export/xlsx";
import { loadEventoData } from "@/lib/export/load";
import { formatNumber, formatPeriod, validateEmails } from "@/lib/domain";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { eventoId?: string; emails?: string } | null;
  const checked = validateEmails(body?.emails || "");
  if (checked.error) return NextResponse.json({ error: checked.error }, { status: 400 });

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    return NextResponse.json(
      { error: "Envio de e-mail ainda não está ativo. Preencha RESEND_API_KEY e RESEND_FROM no .env.local." },
      { status: 503 },
    );
  }

  const loaded = await loadEventoData(body?.eventoId || "");
  if ("error" in loaded) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }

  const [xlsx, pdf] = await Promise.all([
    buildWorkbook(loaded.evento, loaded.leads),
    buildPdf(loaded.evento, loaded.stats),
  ]);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM,
    to: checked.emails,
    subject: `ELEVA | Captação de Leads — ${loaded.evento.nome}`,
    text: [
      `Segue relatório de captação de leads do evento ${loaded.evento.nome}.`,
      "",
      `Evento: ${loaded.evento.nome}`,
      `Data: ${formatPeriod(loaded.evento.data_inicio, loaded.evento.data_fim)}`,
      `Total de leads: ${loaded.stats.totalLeads}`,
      `Condomínios alcançados: ${loaded.stats.totalCondominios}`,
      `Unidades alcançadas: ${formatNumber(loaded.stats.somaUnidades)}`,
      "",
      "Arquivos completos anexos.",
    ].join("\n"),
    attachments: [
      { filename: workbookName(loaded.evento), content: Buffer.from(xlsx) },
      { filename: pdfName(loaded.evento), content: Buffer.from(pdf) },
    ],
  });

  if (error) {
    return NextResponse.json({ error: "O serviço de e-mail recusou o envio. Confira o domínio no Resend." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
