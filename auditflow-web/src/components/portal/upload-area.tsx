"use client";

/* Área de upload do portal do cliente — POST /api/portal/items/{id}/submit */

import { useRef, useState } from "react";
import { I } from "@/components/ui/icons";
import { useSubmitPortalItem } from "@/hooks/use-cliente-portal";
import { handleApiError } from "@/lib/error-handler";
import { pushToast } from "@/store/toast-store";
import { fmtBytes } from "@/lib/format";
import type { PbcItem } from "@/types";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export function UploadArea({ item }: { item: PbcItem }) {
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submit = useSubmitPortalItem();

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    if (f.size > MAX_SIZE) {
      pushToast("error", "Arquivo acima de 20 MB. Reduza o tamanho e tente novamente.");
      return;
    }
    setFile(f);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]);
  };
  const send = () => {
    if (!file || submit.isPending) return;
    setProgress(0);
    submit.mutate(
      { id: item.id, file, onProgress: setProgress },
      {
        onSuccess: () => {
          pushToast("info", `${item.titulo.split(" — ")[0]} enviado para revisão`);
          setFile(null);
          setProgress(null);
        },
        onError: (err) => {
          pushToast("error", handleApiError(err, "Falha no envio. Tente novamente."));
          setProgress(null);
        },
      }
    );
  };

  const rejected = item.status === "REJEITADO";
  const sendLabel = rejected ? "Reenviar para revisão" : "Enviar para revisão";

  if (submit.isPending && file) {
    return (
      <div>
        <div className="rounded-lg border border-line p-4 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 rounded-md flex items-center justify-center bg-paper text-ink-900">
              <I.file size={17} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-text truncate font-medium">{file.name}</div>
              <div className="text-[11.5px] text-sub">Enviando… {progress ?? 0}%</div>
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-paper">
            <div
              className="upbar h-full rounded-full"
              style={{ width: `${progress ?? 0}%`, background: "#00C896" }}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            disabled
            className="h-11 px-5 rounded-md text-[13px] font-semibold inline-flex items-center gap-2 text-white opacity-80"
            style={{ background: "#0D1F2D" }}
          >
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Enviando…
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.xls,.xlsx,.csv"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {!file ? (
        <div
          role="button"
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            e.preventDefault();
            setDrag(false);
          }}
          onDrop={onDrop}
          className="rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center py-7 px-4 cursor-pointer transition-colors"
          style={{ borderColor: drag ? "#00C896" : "#CBD5E0", background: drag ? "#F0FDF8" : "#FAFBFC" }}
        >
          <span
            className="w-11 h-11 rounded-full flex items-center justify-center mb-2.5"
            style={{
              background: drag ? "rgba(0,200,150,0.14)" : "#EEF2F6",
              color: drag ? "#0A8F6A" : "#6B7280",
            }}
          >
            <I.upload size={18} />
          </span>
          <div className="text-[13.5px] text-text">
            {drag ? (
              <span className="font-medium text-[#0A8F6A]">Solte o arquivo para anexar</span>
            ) : (
              <>
                Arraste o arquivo aqui ou{" "}
                <span className="text-ink-900 font-medium underline underline-offset-2">
                  selecione no computador
                </span>
              </>
            )}
          </div>
          <div className="text-[11.5px] text-sub mt-1">Formatos: PDF, XLS, XLSX, CSV · máximo 20 MB</div>
        </div>
      ) : (
        <div
          className="rounded-lg border p-3.5 flex items-center gap-3"
          style={{ borderColor: "rgba(0,200,150,0.45)", background: "rgba(0,200,150,0.05)" }}
        >
          <span className="w-10 h-10 rounded-md flex items-center justify-center bg-white border border-line text-ink-900">
            <I.file size={17} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-text truncate font-medium">{file.name}</div>
            <div className="text-[11.5px] text-sub">{fmtBytes(file.size)} · pronto para envio</div>
          </div>
          <button
            onClick={() => setFile(null)}
            title="Remover"
            className="w-8 h-8 rounded-md flex items-center justify-center text-sub hover:text-rust hover:bg-rust/10"
          >
            <I.x size={15} />
          </button>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <span className="text-[12px] text-sub">
          {rejected ? "Corrija os pontos do auditor e reenvie." : "Anexe o arquivo solicitado."}
        </span>
        <button
          onClick={send}
          disabled={!file}
          className="ml-auto h-11 px-5 rounded-md text-[13px] font-semibold inline-flex items-center gap-2 transition-all"
          style={
            file
              ? { background: "#0D1F2D", color: "#FFFFFF" }
              : { background: "#E2E8F0", color: "#9AA4B2", cursor: "not-allowed" }
          }
        >
          {sendLabel} <I.arrowR size={14} />
        </button>
      </div>
    </div>
  );
}
