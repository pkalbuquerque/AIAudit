"use client";

/* Modal de detalhe do item PBC · Fluxo 3 (aprovar/rejeitar via API)
   + comentários (GET/POST /api/pbc/{id}/comments) + download do documento. */

import { useEffect, useRef, useState } from "react";
import { I } from "@/components/ui/icons";
import { Badge, Priority } from "@/components/ui/badge";
import { Btn } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useApprovePbcItem, useRejectPbcItem } from "@/hooks/use-pbc-items";
import { useComments, useCreateComment } from "@/hooks/use-comments";
import { useDownloadDocument } from "@/hooks/use-documents";
import { handleApiError } from "@/lib/error-handler";
import { pushToast } from "@/store/toast-store";
import { badgeKind, isOverdue, isReviewable } from "@/lib/status";
import { fmtDate, dueNote, relTime, tsFromIso } from "@/lib/format";
import type { PbcItem } from "@/types";

function CommentsSection({ pbcItemId }: { pbcItemId: string }) {
  const commentsQ = useComments(pbcItemId);
  const createComment = useCreateComment();
  const [draft, setDraft] = useState("");

  const send = () => {
    const texto = draft.trim();
    if (!texto || createComment.isPending) return;
    createComment.mutate(
      { pbcItemId, texto },
      {
        onSuccess: () => setDraft(""),
        onError: (err) => pushToast("error", handleApiError(err)),
      }
    );
  };

  return (
    <div className="mt-5">
      <div className="text-[11px] tracking-[0.18em] uppercase text-sub mb-3">Comentários</div>
      <div className="flex flex-col gap-2.5">
        {commentsQ.isLoading && <div className="text-[12.5px] text-sub">Carregando comentários…</div>}
        {commentsQ.isError && (
          <div className="text-[12.5px] text-sub">{handleApiError(commentsQ.error)}</div>
        )}
        {(commentsQ.data ?? []).map((c) => (
          <div key={c.id} className="rounded-md border border-line bg-white p-3">
            <div className="flex items-baseline gap-2 text-[11.5px] text-sub">
              <span className="tabular-nums">{relTime(tsFromIso(c.criadoEm))}</span>
            </div>
            <div className="text-[12.5px] text-text leading-snug mt-1">{c.texto}</div>
          </div>
        ))}
        {commentsQ.isSuccess && !(commentsQ.data ?? []).length && (
          <div className="text-[12.5px] text-sub">Nenhum comentário ainda.</div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Escrever comentário…"
          className="flex-1 h-10 px-3 rounded-md border border-line bg-white text-[12.5px] placeholder:text-sub outline-none focus:border-ink-900"
        />
        <button
          onClick={send}
          disabled={!draft.trim() || createComment.isPending}
          className="h-10 w-10 rounded-md bg-ink-900 text-white inline-flex items-center justify-center disabled:opacity-40"
        >
          <I.send size={14} />
        </button>
      </div>
    </div>
  );
}

export function PbcDetailModal({ item, onClose }: { item: PbcItem; onClose: () => void }) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState(false);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const approveM = useApprovePbcItem();
  const rejectM = useRejectPbcItem();
  const downloadM = useDownloadDocument();

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && !decision && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [decision, onClose]);

  const reviewable = isReviewable(item);
  const over = isOverdue(item);
  const pending = approveM.isPending || rejectM.isPending;

  const doApprove = () => {
    if (pending) return;
    approveM.mutate(
      { id: item.id, comentario: comment.trim() || undefined, cycleId: item.cycleId },
      {
        onSuccess: () => {
          setDecision("approve");
          setTimeout(() => {
            pushToast("success", `${item.titulo.split(" — ")[0]} aprovado`);
            onClose();
          }, 640);
        },
        onError: (err) => pushToast("error", handleApiError(err)),
      }
    );
  };
  const doReject = () => {
    if (pending) return;
    if (!comment.trim()) {
      setError(true);
      taRef.current?.focus();
      return;
    }
    rejectM.mutate(
      { id: item.id, motivo: comment.trim(), cycleId: item.cycleId },
      {
        onSuccess: () => {
          setDecision("reject");
          setTimeout(() => {
            pushToast("error", `Item rejeitado — ${item.responsavel.nome} será notificada`);
            onClose();
          }, 640);
        },
        onError: (err) => pushToast("error", handleApiError(err)),
      }
    );
  };

  const downloadFile = () => {
    if (!item.arquivo?.id) return;
    downloadM.mutate(
      { id: item.arquivo.id, fileName: item.arquivo.nome },
      { onError: (err) => pushToast("error", handleApiError(err)) }
    );
  };

  const tl = [...item.timeline].sort((a, b) => a.ts - b.ts);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center fade-in"
      style={{ background: "rgba(13,31,45,0.42)" }}
    >
      <div className="absolute inset-0" onClick={() => !decision && onClose()} />
      <div className="relative bg-white rounded-xl border border-line w-[1080px] max-w-[94vw] max-h-[88vh] overflow-hidden scale-in flex flex-col">
        {/* overlay da decisão */}
        {decision && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center decision-in"
            style={{
              background: decision === "approve" ? "rgba(0,200,150,0.96)" : "rgba(229,83,60,0.96)",
            }}
          >
            <div className="decision-pop w-[88px] h-[88px] rounded-full bg-white/20 flex items-center justify-center">
              {decision === "approve" ? (
                <I.check size={46} className="text-white" />
              ) : (
                <I.x size={46} className="text-white" />
              )}
            </div>
            <div className="mt-5 text-white font-display text-[28px]">
              {decision === "approve" ? "Item aprovado!" : "Item rejeitado"}
            </div>
          </div>
        )}

        {/* cabeçalho */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-line">
          <div className="flex items-center gap-3">
            <span className="text-[11px] tracking-[0.18em] uppercase text-sub tabular-nums">
              PBC #{String(item.n).padStart(3, "0")}
            </span>
            <span className="w-1 h-1 rounded-full bg-line" />
            <Badge kind={badgeKind(item)} />
            <Priority level={item.prioridade} />
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-md border border-line hover:bg-paper flex items-center justify-center"
          >
            <I.x size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto grid" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
          {/* ESQUERDA */}
          <div className="px-7 py-6 border-r border-line">
            <h2 className="font-display text-[28px] text-text leading-tight">{item.titulo}</h2>
            <p className="text-[13.5px] text-sub mt-2 leading-relaxed max-w-[58ch]">{item.descricao}</p>

            {/* critérios */}
            {item.criteriosAceite.length > 0 && (
              <div className="mt-6">
                <div className="text-[11px] tracking-[0.18em] uppercase text-sub mb-2.5">Critérios de aceite</div>
                <ul className="flex flex-col gap-1.5 text-[13px] text-text">
                  {item.criteriosAceite.map((c, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full" style={{ background: "#00C896" }} />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* arquivo recebido */}
            <div className="mt-7">
              <div className="text-[11px] tracking-[0.18em] uppercase text-sub mb-2.5">Arquivo recebido</div>
              {item.arquivo ? (
                <div className="flex items-center gap-3 p-3.5 rounded-md border border-line bg-white">
                  <span className="w-10 h-10 rounded flex items-center justify-center bg-paper text-ink-900">
                    <I.file size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-text truncate font-medium">{item.arquivo.nome}</div>
                    <div className="text-[11.5px] text-sub">
                      enviado {relTime(item.arquivo.dataUpload)} · por {item.responsavel.nome}
                    </div>
                  </div>
                  <Btn
                    kind="subtle"
                    size="sm"
                    icon={<I.download />}
                    onClick={downloadFile}
                    disabled={downloadM.isPending}
                  >
                    {downloadM.isPending ? "Baixando…" : "Baixar"}
                  </Btn>
                </div>
              ) : (
                <div className="p-3.5 rounded-md border border-dashed border-line text-[12.5px] text-sub bg-paper/30">
                  Nenhum arquivo recebido ainda.{" "}
                  {item.status === "REJEITADO"
                    ? "Aguardando reenvio do cliente."
                    : "O cliente ainda não enviou o documento."}
                </div>
              )}
            </div>

            {/* nota de rejeição */}
            {item.status === "REJEITADO" && item.motivoRejeicao && (
              <div
                className="mt-4 rounded-md border p-3.5"
                style={{ borderColor: "rgba(229,83,60,0.3)", background: "rgba(229,83,60,0.06)" }}
              >
                <div
                  className="text-[10.5px] tracking-[0.18em] uppercase mb-1.5 flex items-center gap-1.5"
                  style={{ color: "#E5533C" }}
                >
                  <I.alert size={11} />
                  Motivo da rejeição
                </div>
                <p className="text-[13px] leading-relaxed text-text italic">“{item.motivoRejeicao}”</p>
              </div>
            )}

            {/* área de decisão — apenas quando EM_REVISAO */}
            {reviewable && (
              <div className="mt-7">
                <div className="text-[11px] tracking-[0.18em] uppercase text-sub mb-2 flex items-center gap-2">
                  Comentário{" "}
                  <span className="normal-case tracking-normal text-[11px] text-sub/80">
                    (obrigatório se rejeitar)
                  </span>
                </div>
                <textarea
                  ref={taRef}
                  rows={3}
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Descreva o motivo da rejeição ou uma observação na aprovação…"
                  className={`w-full p-3 bg-paper/60 border rounded-md text-[13px] placeholder:text-sub outline-none resize-none transition-colors ${
                    error ? "border-rust focus:border-rust" : "border-line focus:border-ink-900"
                  }`}
                />
                {error && (
                  <div className="mt-1.5 text-[12px] text-rust flex items-center gap-1.5">
                    <I.alert size={12} />
                    Informe o motivo da rejeição para o cliente.
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2.5">
                  <button
                    onClick={doReject}
                    disabled={pending}
                    className="h-10 px-4 rounded-md text-[13px] font-medium inline-flex items-center gap-2 border transition-colors bg-white hover:bg-rust/5 disabled:opacity-50"
                    style={{ color: "#E5533C", borderColor: "rgba(229,83,60,0.5)" }}
                  >
                    <I.x size={15} />
                    {rejectM.isPending ? "Rejeitando…" : "Rejeitar"}
                  </button>
                  <button
                    onClick={doApprove}
                    disabled={pending}
                    className="h-10 px-5 rounded-md text-[13px] font-semibold inline-flex items-center gap-2 text-ink-900 hover:brightness-95 disabled:opacity-60"
                    style={{ background: "#00C896" }}
                  >
                    <I.check size={15} />
                    {approveM.isPending ? "Aprovando…" : "Aprovar"}
                  </button>
                  <span className="ml-auto text-[11.5px] text-sub max-w-[24ch] text-right leading-snug">
                    A decisão notifica {item.responsavel.nome.split(" ")[0]} imediatamente.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* DIREITA */}
          <div className="px-6 py-6 bg-paper/40">
            <div className="rounded-lg bg-white border border-line p-4">
              <div className="text-[11px] tracking-[0.18em] uppercase text-sub mb-2">Status atual</div>
              <div className="flex items-center gap-2 mb-3 badge-tween">
                <Badge kind={badgeKind(item)} />
              </div>
              <div className="flex items-center justify-between text-[12.5px]">
                <div className="text-sub">Prazo</div>
                <div className="tabular-nums text-text">{fmtDate(item.prazo)}</div>
              </div>
              <div className="flex items-center justify-between text-[12.5px] mt-1.5">
                <div className="text-sub">Contagem regressiva</div>
                <div className="tabular-nums" style={{ color: over ? "#E5533C" : "#1C1C1E" }}>
                  {dueNote(item.prazo)}
                </div>
              </div>
              <div className="border-t border-line my-4" />
              <div className="text-[11px] tracking-[0.18em] uppercase text-sub mb-2">Responsável</div>
              <div className="flex items-center gap-3">
                <Avatar name={item.responsavel.nome} size={36} />
                <div className="leading-tight">
                  <div className="text-text text-[13px] font-medium">{item.responsavel.nome}</div>
                  {item.client && <div className="text-[11.5px] text-sub">{item.client}</div>}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-[11px] tracking-[0.18em] uppercase text-sub mb-3">Histórico do item</div>
              <ol className="relative pl-5">
                <span className="absolute left-[7px] top-1 bottom-1 w-px" style={{ background: "#E2E8F0" }} />
                {tl.map((t, i) => (
                  <li key={i} className="relative pb-4 last:pb-0">
                    <span
                      className="absolute -left-[14px] top-1.5 w-3 h-3 rounded-full border-2 border-white"
                      style={{
                        background:
                          t.tone === "rejected" ? "#E5533C" : t.tone === "approved" ? "#00C896" : "#1A3A4A",
                      }}
                    />
                    <div className="flex items-baseline gap-2 text-[12.5px]">
                      <span className="tabular-nums text-sub">{relTime(t.ts)}</span>
                      <span className="text-text font-medium">{t.ator}</span>
                    </div>
                    <div className="text-[12.5px] text-text leading-snug mt-0.5">{t.acao}</div>
                  </li>
                ))}
                {!tl.length && <li className="text-[12.5px] text-sub">Sem eventos registrados.</li>}
              </ol>
            </div>

            <CommentsSection pbcItemId={item.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
