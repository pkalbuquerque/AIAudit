"use client";

/* Mini-modal: Reatribuir Auditor — POST /api/clients/{id}/assign
   A lista de auditores vem de GET /api/users (apenas ADMIN). */

import { useEffect, useState } from "react";
import { I } from "@/components/ui/icons";
import { Btn } from "@/components/ui/button";
import { FormField, SelectField } from "@/components/ui/form";
import { useAssignAuditor } from "@/hooks/use-audit-clients";
import { useUsers } from "@/hooks/use-users";
import { handleApiError } from "@/lib/error-handler";
import { pushToast } from "@/store/toast-store";
import type { AuditClientResponse } from "@/types/api";

export function ReassignModal({
  client,
  onClose,
}: {
  client: AuditClientResponse;
  onClose: () => void;
}) {
  const usersQ = useUsers();
  const assign = useAssignAuditor();
  const [auditorId, setAuditorId] = useState(client.auditorResponsavel?.id ?? "");

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const auditores = (usersQ.data ?? []).filter(
    (u) => u.ativo && (u.perfil === "AUDITOR" || u.perfil === "ADMIN")
  );

  const confirm = () => {
    if (!auditorId) return;
    assign.mutate(
      { id: client.id, auditorId },
      {
        onSuccess: (res) => {
          pushToast("success", `${res.nomeEmpresa} atribuído a ${res.auditorResponsavel?.nome ?? "auditor"}`);
          onClose();
        },
        onError: (err) => pushToast("error", handleApiError(err)),
      }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center fade-in p-6"
      style={{ background: "rgba(13,31,45,0.42)" }}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-line w-[420px] max-w-full scale-in">
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <h2 className="font-display text-[19px] text-text">Reatribuir auditor</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md border border-line hover:bg-paper flex items-center justify-center"
          >
            <I.x size={14} />
          </button>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center gap-2.5 mb-4 p-3 rounded-md bg-paper/60 border border-line">
            <span
              className="w-9 h-9 rounded-md flex items-center justify-center text-white font-display text-[16px]"
              style={{ background: "#1A3A4A" }}
            >
              {client.nomeEmpresa[0]}
            </span>
            <div>
              <div className="text-[13px] text-text font-medium">{client.nomeEmpresa}</div>
              <div className="text-[11.5px] text-sub">
                Atual: {client.auditorResponsavel?.nome ?? "sem auditor"}
              </div>
            </div>
          </div>
          <FormField label="Novo auditor responsável">
            <SelectField
              value={auditorId}
              onChange={(e) => setAuditorId(e.target.value)}
              disabled={usersQ.isLoading}
            >
              <option value="">
                {usersQ.isLoading ? "Carregando auditores…" : "Selecione o auditor"}
              </option>
              {auditores.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} ({u.perfil === "ADMIN" ? "Admin" : "Auditor"})
                </option>
              ))}
            </SelectField>
            {usersQ.isError && (
              <div className="mt-1.5 text-[12px] text-rust flex items-center gap-1.5">
                <I.alert size={12} />
                {handleApiError(usersQ.error)}
              </div>
            )}
          </FormField>
        </div>
        <div className="px-6 py-4 border-t border-line flex items-center justify-between">
          <button onClick={onClose} className="text-[13px] text-sub hover:text-text">
            Cancelar
          </button>
          <Btn
            kind="primary"
            icon={<I.check />}
            onClick={confirm}
            disabled={!auditorId || assign.isPending}
          >
            {assign.isPending ? "Salvando…" : "Confirmar"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
