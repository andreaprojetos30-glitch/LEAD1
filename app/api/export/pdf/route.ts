import { buildPdf, pdfName } from "@/lib/export/pdf";
import { loadEventoData } from "@/lib/export/load";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function attachment(filename: string) {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(request: Request) {
  const eventoId = new URL(request.url).searchParams.get("eventoId") || "";
  const loaded = await loadEventoData(eventoId);
  if ("error" in loaded) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }
  const file = await buildPdf(loaded.evento, loaded.stats);
  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": attachment(pdfName(loaded.evento)),
    },
  });
}
