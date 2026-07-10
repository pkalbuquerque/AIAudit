"use client";

/* Slide-over: Adicionar Cliente — POST /api/clients.
   O backend cria também o usuário CLIENTE e envia um e-mail com link de ativação para
   ele definir a própria senha. O link volta na resposta como contingência. */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { I } from "@/components/ui/icons";
import { Btn } from "@/components/ui/button";
import { FormField, FormSection, TextField, SelectField } from "@/components/ui/form";
import { useCreateAuditClient } from "@/hooks/use-audit-clients";
import { handleApiError } from "@/lib/error-handler";
import { pushToast } from "@/store/toast-store";
import type { AuditClientResponse } from "@/types/api";

const addClientSchema = z.object({
  nomeEmpresa: z.string().trim().min(1, "Informe o nome da empresa."),
  cnpj: z
    .string()
    .trim()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ no formato 00.000.000/0000-00."),
  segmento: z.string(),
  site: z.string(),
  endereco: z.string(),
  nomeUsuario: z.string().trim().min(1, "Informe o nome do contato."),
  email: z.string().trim().email("E-mail inválido."),
});

type AddClientForm = z.infer<typeof addClientSchema>;

function CreatedPanel({ created, onClose }: { created: AuditClientResponse; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const copy = async () => {
    if (!created.linkAtivacao) return;
    await navigator.clipboard.writeText(created.linkAtivacao);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="flex-1 overflow-auto px-7 py-8 fade-in">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ background: "rgba(0,200,150,0.14)", color: "#0A8F6A" }}
      >
        <I.mail size={22} />
      </div>
      <h3 className="font-display text-[22px] text-text leading-tight">
        {created.nomeEmpresa} cadastrado
      </h3>
      <p className="text-[13px] text-sub mt-1.5 leading-relaxed">
        Enviamos um e-mail para{" "}
        <span className="text-text font-medium">{created.emailContato}</span> com um link para o
        cliente definir a própria senha e ativar o acesso ao Portal.
      </p>

      {created.linkAtivacao && (
        <div className="mt-5">
          {showLink ? (
            <div className="rounded-lg border border-line bg-paper/50 p-4">
              <div className="text-[10.5px] tracking-[0.18em] uppercase text-sub mb-2">
                Link de ativação (contingência)
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11.5px] text-text bg-white border border-line rounded-md px-2.5 py-2 truncate select-all">
                  {created.linkAtivacao}
                </code>
                <Btn kind="ghost" onClick={copy} icon={copied ? <I.check /> : <I.copy />}>
                  {copied ? "Copiado" : "Copiar"}
                </Btn>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLink(true)}
              className="text-[12px] text-sub hover:text-text underline underline-offset-2"
            >
              Não recebeu o e-mail? Copiar link manualmente
            </button>
          )}
        </div>
      )}

      <div className="mt-6 p-4 rounded-md border border-line bg-paper/40 flex items-start gap-3 text-[12px] text-sub leading-relaxed">
        <I.shield size={15} className="text-ink-900 mt-0.5 shrink-0" />
        O link é pessoal e expira em alguns dias. A senha é escolhida pelo próprio cliente.
      </div>

      <div className="mt-8">
        <Btn kind="primary" onClick={onClose}>
          Concluir
        </Btn>
      </div>
    </div>
  );
}

export function AddClientSlideOver({ onClose }: { onClose: () => void }) {
  const createClient = useCreateAuditClient();
  const [created, setCreated] = useState<AuditClientResponse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddClientForm>({
    resolver: zodResolver(addClientSchema),
    defaultValues: {
      nomeEmpresa: "",
      cnpj: "",
      segmento: "Tecnologia",
      site: "",
      endereco: "",
      nomeUsuario: "",
      email: "",
    },
  });

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const submit = handleSubmit((data) => {
    createClient.mutate(
      {
        nomeEmpresa: data.nomeEmpresa,
        cnpj: data.cnpj,
        segmento: data.segmento || undefined,
        site: data.site || undefined,
        endereco: data.endereco || undefined,
        nomeUsuario: data.nomeUsuario,
        email: data.email,
      },
      {
        onSuccess: (res) => {
          pushToast("success", `Cliente ${res.nomeEmpresa} cadastrado`);
          setCreated(res);
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
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-sub">Novo cliente</div>
            <h2 className="font-display text-[24px] text-text leading-tight mt-1">
              {created ? "Cliente criado" : "Adicionar cliente"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-md border border-line hover:bg-paper flex items-center justify-center"
          >
            <I.x size={15} />
          </button>
        </header>

        {created ? (
          <CreatedPanel created={created} onClose={onClose} />
        ) : (
          <>
            <form className="flex-1 overflow-auto px-7 py-6" onSubmit={submit}>
              <FormSection title="Dados da empresa" />
              <FormField label="Nome da empresa" required>
                <TextField {...register("nomeEmpresa")} placeholder="Ex.: Acme Corporation Ltda" />
                {fieldError(errors.nomeEmpresa?.message)}
              </FormField>
              <FormField label="CNPJ" required>
                <TextField {...register("cnpj")} placeholder="00.000.000/0000-00" />
                {fieldError(errors.cnpj?.message)}
              </FormField>
              <FormField label="Segmento">
                <SelectField
                  {...register("segmento")}
                  options={["Tecnologia", "Indústria", "Financeiro", "Saúde", "Varejo", "Outro"]}
                />
              </FormField>
              <FormField label="Site">
                <TextField {...register("site")} placeholder="https://" icon={<I.globe />} />
              </FormField>
              <FormField label="Endereço">
                <TextField {...register("endereco")} placeholder="Rua, número, cidade — UF" icon={<I.pin />} />
              </FormField>

              <FormSection title="Acesso do cliente (Portal)" className="mt-6" />
              <FormField label="Nome do contato" required hint="será o usuário CLIENTE">
                <TextField {...register("nomeUsuario")} placeholder="Nome do responsável" />
                {fieldError(errors.nomeUsuario?.message)}
              </FormField>
              <FormField label="E-mail de acesso" required>
                <TextField
                  type="email"
                  {...register("email")}
                  placeholder="contato@empresa.com"
                  icon={<I.mail />}
                />
                {fieldError(errors.email?.message)}
              </FormField>
            </form>
            <footer className="px-7 py-4 border-t border-line bg-white flex items-center justify-between">
              <button onClick={onClose} className="text-[13px] text-sub hover:text-text">
                Cancelar
              </button>
              <Btn
                kind="primary"
                icon={<I.arrowR />}
                onClick={() => submit()}
                disabled={createClient.isPending}
              >
                {createClient.isPending ? "Salvando…" : "Salvar Cliente"}
              </Btn>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
