"use client";

/* Slide-over: Novo Projeto de Auditoria — POST /api/cycles */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { I } from "@/components/ui/icons";
import { Btn } from "@/components/ui/button";
import { FormField, SelectField, TextField } from "@/components/ui/form";
import { useAuditClients } from "@/hooks/use-audit-clients";
import { useCreateAuditCycle } from "@/hooks/use-audit-cycles";
import { handleApiError } from "@/lib/error-handler";
import { pushToast } from "@/store/toast-store";

const TIPOS = ["Financeira", "Fiscal", "Compliance", "Operacional", "Outra"];

const newCycleSchema = z
  .object({
    auditClientId: z.string().min(1, "Selecione o cliente."),
    titulo: z.string().trim().min(1, "Informe o nome do projeto."),
    tipo: z.string(),
    dataInicio: z.string().min(1, "Informe a data de início."),
    dataFim: z.string().min(1, "Informe a data de encerramento."),
    descricao: z.string(),
  })
  .refine((d) => !d.dataInicio || !d.dataFim || d.dataFim >= d.dataInicio, {
    message: "O encerramento deve ser depois do início.",
    path: ["dataFim"],
  });

type NewCycleForm = z.infer<typeof newCycleSchema>;

export function NewCycleSlideOver({
  onClose,
  defaultClientId,
}: {
  onClose: () => void;
  defaultClientId?: string;
}) {
  const clientsQ = useAuditClients();
  const createCycle = useCreateAuditCycle();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewCycleForm>({
    resolver: zodResolver(newCycleSchema),
    defaultValues: {
      auditClientId: defaultClientId ?? "",
      titulo: "",
      tipo: "Financeira",
      dataInicio: "",
      dataFim: "",
      descricao: "",
    },
  });

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const submit = handleSubmit((data) => {
    createCycle.mutate(
      {
        auditClientId: data.auditClientId,
        titulo: data.titulo,
        tipo: data.tipo,
        descricao: data.descricao || undefined,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
      },
      {
        onSuccess: (cycle) => {
          pushToast("success", `Projeto “${cycle.titulo}” criado`);
          onClose();
        },
        onError: (err) => pushToast("error", handleApiError(err)),
      }
    );
  });

  const fieldError = (msg?: string) =>
    msg && (
      <div className="mt-1.5 text-[12px] text-rust flex items-center gap-1.5">
        <I.alert size={12} />
        {msg}
      </div>
    );

  return (
    <div className="fixed inset-0 z-40 fade-in" style={{ background: "rgba(13,31,45,0.35)" }} onClick={onClose}>
      <aside
        className="absolute right-0 top-0 h-full w-[480px] max-w-[95vw] bg-white border-l border-line slide-in-right flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-7 py-5 border-b border-line flex items-start justify-between">
          <div>
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-sub">Novo projeto</div>
            <h2 className="font-display text-[24px] text-text leading-tight mt-1">
              Criar engajamento de auditoria
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-md border border-line hover:bg-paper flex items-center justify-center"
          >
            <I.x size={15} />
          </button>
        </header>

        <form className="flex-1 overflow-auto px-7 py-6" onSubmit={submit}>
          <FormField label="Cliente" required>
            <SelectField {...register("auditClientId")} disabled={clientsQ.isLoading}>
              <option value="">
                {clientsQ.isLoading ? "Carregando clientes…" : "Selecione o cliente"}
              </option>
              {(clientsQ.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nomeEmpresa}
                </option>
              ))}
            </SelectField>
            {fieldError(errors.auditClientId?.message)}
            {clientsQ.isError && fieldError(handleApiError(clientsQ.error))}
          </FormField>

          <FormField label="Nome do projeto" required>
            <TextField {...register("titulo")} placeholder="Ex.: Auditoria Anual 2026" />
            {fieldError(errors.titulo?.message)}
          </FormField>

          <FormField label="Tipo">
            <SelectField {...register("tipo")} options={TIPOS} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Início" required>
              <input
                type="date"
                {...register("dataInicio")}
                className="w-full h-11 px-3 rounded-md border border-line bg-white text-[13px] tabular-nums focus:border-ink-900 outline-none"
              />
              {fieldError(errors.dataInicio?.message)}
            </FormField>
            <FormField label="Encerramento" required>
              <input
                type="date"
                {...register("dataFim")}
                className="w-full h-11 px-3 rounded-md border border-line bg-white text-[13px] tabular-nums focus:border-ink-900 outline-none"
              />
              {fieldError(errors.dataFim?.message)}
            </FormField>
          </div>

          <FormField label="Descrição">
            <textarea
              rows={4}
              {...register("descricao")}
              placeholder="Escopo, foco e observações do engajamento…"
              className="w-full p-3 rounded-md border border-line bg-white text-[13px] placeholder:text-sub focus:border-ink-900 outline-none resize-none"
            />
          </FormField>
        </form>

        <footer className="px-7 py-4 border-t border-line bg-white flex items-center justify-between">
          <button onClick={onClose} className="text-[13px] text-sub hover:text-text">
            Cancelar
          </button>
          <Btn kind="primary" icon={<I.arrowR />} onClick={() => submit()} disabled={createCycle.isPending}>
            {createCycle.isPending ? "Criando…" : "Criar projeto"}
          </Btn>
        </footer>
      </aside>
    </div>
  );
}
