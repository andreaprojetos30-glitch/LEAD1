import { summarize, type Evento, type Lead } from "@/lib/domain";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";

export async function loadEventoData(eventoId: string) {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase não configurado.", status: 503 as const };
  }
  const supabase = await createServerSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { error: "Não autorizado.", status: 401 as const };
  }
  const { data: evento, error: eventoError } = await supabase
    .from("eventos")
    .select("*")
    .eq("id", eventoId)
    .maybeSingle();
  if (eventoError) return { error: "Não foi possível ler o evento.", status: 500 as const };
  if (!evento) return { error: "Evento não encontrado.", status: 404 as const };
  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("*")
    .eq("evento_id", eventoId)
    .order("created_at", { ascending: true });
  if (leadsError) return { error: "Não foi possível ler os leads.", status: 500 as const };
  const rows = (leads ?? []) as Lead[];
  return {
    evento: evento as Evento,
    leads: rows,
    stats: summarize(rows),
  };
}
