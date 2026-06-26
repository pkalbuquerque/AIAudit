"use client";

/* Slide-over de detalhe da tarefa (portal do cliente) */

import { useEffect, useState } from "react";
import { I } from "@/components/ui/icons";
import { Badge, PriorityTag } from "@/components/ui/badge";
import { UploadArea } from "./upload-area";
import { useDownloadDocument } from "@/hooks/use-documents";
import { handleApiError } from "@/lib/error-handler";
import { pushToast } from "@/store/toast-store";
import { badgeKind, isActionableByClient, isOverdue, isReviewable } from "@/lib/status";
import { fmtDate, dueNote, relTime } from "@/lib/format";
import type { PbcItem } from "@/types";

export function TaskDetailSlideOver({ item, onClose }: { item: PbcItem; onClose: () => void }) {
  const [replacing, setReplacing] = useState(false);
  const downloadM = useDownloadDocument();

  const downloadFile = () => {
    if (!item.arquivo?.id) return;
    downloadM.mutate(
      { id: item.arquivo.id, fileName: item.arquivo.nome },
      { onError: (err) => pushToast("error", handleApiError(err)) }
    );
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const kind = badgeKind(item);
  const over = isOverdue(item);
  const isApproved = item.status === "APROVADO";
  const inReview = isReviewable(item);
  const actionable = isActionableByClient(item);

  return (
    <div className="fixed inset-0 z-40 fade-in" style={{ background: "rgba(13,31,45,0.35)" }} onClick={onClose}>
      <aside
        className="absolute right-0 top-0 h-full w-[520px] max-w-[95vw] bg-white border-l border-line slide-in-right flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* cabeçalho */}
        <header className="px-7 py-5 border-b border-line flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 badge-tween">
              <span className="text-[10.5px] tracking-[0.18em] uppercase text-sub tabular-nums">
                PBC #{String(item.n).padStart(3, "0")}
              </span>
              <Badge kind={kind} />
              <PriorityTag level={item.prioridade} />
            </div>
            <h2 className="font-display text-[22px] text-text leading-tight">{item.titulo}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-md border border-line hover:bg-paper flex items-center justify-center shrink-0"
          >
            <I.x size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-auto px-7 py-6">
          {/* meta */}
          <div className="flex items-center gap-2.5 flex-wrap text-[12px] text-sub mb-5">
            <span className="inline-flex items-center gap-1.5">
              <I.cal size={12} />
              Prazo <span className="text-text tabular-nums">{fmtDate(item.prazo)}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-line" />
            <span style={{ color: over ? "#E5533C" : "#6B7280", fontWeight: over ? 500 : 400 }}>
              {dueNote(item.prazo)}
            </span>
          </div>

          {item.descricao && <p className="text-[13.5px] text-text leading-relaxed mb-5">{item.descricao}</p>}

          {/* comentário de rejeição */}
          {item.status === "REJEITADO" && item.motivoRejeicao && (
            <div
              className="mb-5 rounded-lg border p-3.5 flex gap-3"
              style={{ borderColor: "rgba(229,83,60,0.3)", background: "rgba(229,83,60,0.06)" }}
            >
              <I.alert size={15} className="shrink-0 mt-0.5" style={{ color: "#E5533C" }} />
              <div>
                <div className="text-[10.5px] tracking-[0.16em] uppercase mb-1" style={{ color: "#E5533C" }}>
                  Comentário do auditor
                </div>
                <p className="text-[13px] leading-relaxed text-text italic">“{item.motivoRejeicao}”</p>
              </div>
            </div>
          )}

          {/* critérios */}
          {item.criteriosAceite.length > 0 && (
            <div className="mb-6">
              <div className="text-[10.5px] tracking-[0.18em] uppercase text-sub mb-2">Critérios de aceite</div>
              <ul className="flex flex-col gap-1.5 text-[13px] text-text">
                {item.criteriosAceite.map((c, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#00C896" }} />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* estados do arquivo */}
          <div className="text-[10.5px] tracking-[0.18em] uppercase text-sub mb-2">Documento</div>
          {inReview && !replacing && (
            <div className="rounded-lg border border-line p-4 bg-paper/50">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-md flex items-center justify-center bg-white border border-line text-ink-900">
                  <I.file size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-text truncate font-medium">{item.arquivo?.nome}</div>
                  <div className="text-[11.5px] text-sub">
                    enviado {relTime(item.arquivo?.dataUpload)}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0"
                  style={{ color: "#1F5FB4", background: "rgba(44,123,229,0.12)" }}
                >
                  <I.clock size={11} />
                  Aguardando revisão
                </span>
              </div>
              <button
                onClick={() => setReplacing(true)}
                className="mt-3 text-[12px] text-sub hover:text-ink-900 hover:underline inline-flex items-center gap-1.5"
              >
                <I.refresh size={11} />
                Substituir arquivo
              </button>
            </div>
          )}

          {(actionable || (inReview && replacing)) && <UploadArea item={item} />}

          {isApproved && (
            <div className="flex items-center gap-3 p-3.5 rounded-lg border border-line bg-paper/50">
              <span className="w-10 h-10 rounded-md flex items-center justify-center bg-white border border-line text-ink-900">
                <I.file size={17} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-text font-medium truncate">
                  {item.arquivo?.nome || "Documento aprovado"}
                </div>
                <div className="text-[11.5px] text-sub">Aprovado pelo auditor — sem ações pendentes</div>
              </div>
              <button
                title="Baixar"
                onClick={downloadFile}
                disabled={!item.arquivo?.id || downloadM.isPending}
                className="w-9 h-9 rounded-md border border-line bg-white text-sub inline-flex items-center justify-center hover:text-text hover:bg-paper disabled:opacity-40"
              >
                <I.download size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
