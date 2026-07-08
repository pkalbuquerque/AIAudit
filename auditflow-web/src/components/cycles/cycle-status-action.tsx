"use client";

/* Avança o status do ciclo: ABERTO → EM_ANDAMENTO → ENCERRADO.
   Encerrar exige ADMIN; se houver itens não aprovados, oferece encerrar à força. */

import { I } from "@/components/ui/icons";
import { useUpdateCycleStatus } from "@/hooks/use-audit-cycles";
import { handleApiError } from "@/lib/error-handler";
import { pushToast } from "@/store/toast-store";
import type { CycleStatusApi } from "@/types/api";

const NEXT: Record<CycleStatusApi, { next: CycleStatusApi; label: string } | null> = {
  ABERTO: { next: "EM_ANDAMENTO", label: "Iniciar" },
  EM_ANDAMENTO: { next: "ENCERRADO", label: "Encerrar" },
  ENCERRADO: null,
};

export function CycleStatusAction({
  cycleId,
  status,
}: {
  cycleId: string;
  status: CycleStatusApi;
}) {
  const update = useUpdateCycleStatus();
  const step = NEXT[status];
  if (!step) return null;

  const run = (forcar?: boolean, justificativa?: string) => {
    update.mutate(
      { id: cycleId, data: { status: step.next, forcar, justificativa } },
      {
        onSuccess: () => pushToast("success", step.next === "ENCERRADO" ? "Projeto encerrado" : "Projeto iniciado"),
        onError: (err) => {
          const msg = handleApiError(err);
          // itens não aprovados ao encerrar → pede justificativa e encerra à força
          if (step.next === "ENCERRADO" && /forcar|justificativa|não aprovados|nao aprovados/i.test(msg)) {
            if (typeof window === "undefined") return;
            const motivo = window.prompt(
              "Existem itens não aprovados. Informe uma justificativa para encerrar mesmo assim:"
            );
            if (motivo && motivo.trim()) {
              run(true, motivo.trim());
            }
            return;
          }
          pushToast("error", msg);
        },
      }
    );
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        run();
      }}
      disabled={update.isPending}
      className="h-8 px-3 rounded-md border border-line bg-white text-text text-[12px] inline-flex items-center gap-1.5 hover:bg-paper disabled:opacity-50"
    >
      {step.next === "ENCERRADO" ? <I.check size={13} /> : <I.arrowR size={13} />}
      {update.isPending ? "…" : step.label}
    </button>
  );
}
