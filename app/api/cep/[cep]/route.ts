import { digits } from "@/lib/domain";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Address = {
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
};

export async function GET(_request: Request, context: { params: Promise<{ cep: string }> }) {
  const { cep: raw } = await context.params;
  const cep = digits(raw);
  if (cep.length !== 8) {
    return NextResponse.json({ error: "CEP inválido." }, { status: 400 });
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (!data.erro) {
        const address: Address = {
          logradouro: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || "",
        };
        return NextResponse.json(address);
      }
    }
  } catch {
    // tenta a API reserva
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as {
        street?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
      };
      const address: Address = {
        logradouro: data.street || "",
        bairro: data.neighborhood || "",
        cidade: data.city || "",
        estado: data.state || "",
      };
      return NextResponse.json(address);
    }
  } catch {
    // sem rede ou API indisponível
  }

  return NextResponse.json({ error: "CEP não encontrado." }, { status: 404 });
}
