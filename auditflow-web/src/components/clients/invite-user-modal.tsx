"use client";

/* Modal: Convidar Usuário do cliente — POST /api/clients/{id}/users (ADMIN).
   O backend cria o usuário CLIENTE e envia um e-mail com link de ativação para ele
   definir a própria senha. O link também volta na resposta como contingência. */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { I } from "@/components/ui/icons";
import { Btn } from "@/components/ui/button";
import { FormField, TextField } from "@/components/ui/form";
import { useAddClientUser } from "@/hooks/use-audit-clients";
import { handleApiError } from "@/lib/error-handler";
import { pushToast } from "@/store/toast-store";
import { InviteSentPanel } from "@/components/auth/invite-sent-panel";

const schema = z.object({
  nome: z.string().trim().min(1, "Informe o nome."),
  email: z.string().trim().email("Informe um e-mail válido."),
});

type InviteForm = z.infer<typeof schema>;

export function InviteUserModal({
  clientId,
  clientName,
  onClose,
}: {
  clientId: string;
  clientName: string;
  onClose: () => void;
}) {
  const add = useAddClientUser(clientId);
  const [sent, setSent] = useState<{ email: string; link?: string | null } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteForm>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", email: "" },
  });

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const submit = handleSubmit((data) => {
    add.mutate(data, {
      onSuccess: (user) => {
        setSent({ email: user.email, link: user.linkAtivacao });
      },
      onError: (err) => pushToast("error", handleApiError(err)),
    });
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center fade-in p-6"
      style={{ background: "rgba(13,31,45,0.42)" }}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-line w-[480px] max-w-full scale-in">
        <header className="px-6 py-5 border-b border-line flex items-start justify-between">
          <div>
            <h2 className="font-display text-[20px] text-text leading-tight">Convidar Usuário</h2>
            <p className="text-[12.5px] text-sub mt-0.5">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md border border-line hover:bg-paper flex items-center justify-center shrink-0"
          >
            <I.x size={14} />
          </button>
        </header>

        {sent ? (
          <InviteSentPanel
            email={sent.email}
            link={sent.link}
            onClose={() => {
              pushToast("success", "Usuário adicionado ao portal");
              onClose();
            }}
          />
        ) : (
          <>
            <div className="px-6 py-5 grid gap-3">
              <FormField label="Nome completo" required>
                <TextField {...register("nome")} placeholder="Nome do responsável" />
                {errors.nome && (
                  <div className="mt-1.5 text-[12px] text-rust flex items-center gap-1.5">
                    <I.alert size={12} />
                    {errors.nome.message}
                  </div>
                )}
              </FormField>
              <FormField label="E-mail" required>
                <TextField type="email" {...register("email")} placeholder="contato@empresa.com" icon={<I.mail />} />
                {errors.email && (
                  <div className="mt-1.5 text-[12px] text-rust flex items-center gap-1.5">
                    <I.alert size={12} />
                    {errors.email.message}
                  </div>
                )}
              </FormField>
            </div>
            <footer className="px-6 py-4 border-t border-line flex items-center justify-between">
              <button onClick={onClose} className="text-[13px] text-sub hover:text-text">
                Cancelar
              </button>
              <Btn kind="primary" icon={<I.send />} onClick={() => submit()} disabled={add.isPending}>
                {add.isPending ? "Criando…" : "Criar Usuário"}
              </Btn>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
