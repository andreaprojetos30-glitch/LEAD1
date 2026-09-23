import { Suspense } from "react";
import { NovoLead } from "@/components/NovoLead";

export default function NovoLeadPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-lg text-eleva">Carregando…</p>}>
      <NovoLead />
    </Suspense>
  );
}
