"use client";

/* Modal: Convidar Auditor interno — POST /api/users/invite (somente ADMIN).
   O backend gera uma senha provisória e a retorna para repasse manual
   (até o envio por e-mail via Resend estar ativo). */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { I } from "@/components/ui/icons";
import { Btn } from "@/components/ui/button";
import { FormField, SelectField, TextField } from "@/components/ui/form";
import { useInviteUser } from "@/hooks/use-users";
import { handleApiError } from "@/lib/error-handler";
import { pushToast } from "@/store/toast-store";

const schema = z.object({
  nome: z.string().trim().min(1, "Informe o nome."),
  email: z.string().trim().email("Informe um e-mail válido."),
  perfil: z.enum(["AUDITOR", "ADMIN"]),
});

type InviteForm = z.infer<typeof schema>;

export function InviteAuditorModal({ onClose }: { onClose: () => void }) {
  const invite = useInviteUser();
  const [provisional, setProvisional] = useState<{ email: string; senha: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteForm>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", email: "", perfil: "AUDITOR" },
  });

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const submit = handleSubmit((data) => {
    invite.mutate(
      { nome: data.nome, email: data.email, perfil: data.perfil },
      {
        onSuccess: (user) => {
          if (user.senhaProvisoria) {
            setProvisional({ email: user.email, senha: user.senhaProvisoria });
          } else {
            pushToast("success", `Convite enviado para ${user.email}`);
            onClose();
          }
        },
        onError: (err) => pushToast("error", handleApiError(err)),
      }
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center fade-in p-6"
      style={{ background: "rgba(13,31,45,0.42)" }}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-line w-[480px] max-w-full scale-in">
        <header className="px-6 py-5 border-b border-line flex items-center justify-between">
          <h2 className="font-display text-[20px] text-text">Convidar Auditor</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md border border-line hover:bg-paper flex items-center justify-center"
          >
            <I.x size={14} />
          </button>
        </header>

        {provisional ? (
          <div className="px-6 py-6">
            <div className="flex items-start gap-3 p-4 rounded-lg border border-mint/40 bg-mint/5">
              <I.check size={18} className="text-mint mt-0.5" />
              <div className="text-[13px] text-text leading-relaxed">
                Auditor criado. Repasse estas credenciais — o usuário deve trocar a senha no primeiro
                acesso.
              </div>
            </div>
            <div className="mt-4 rounded-md border border-line bg-paper/40 p-4 text-[13px]">
              <div className="flex justify-between py-1.5 border-b border-line/60">
                <span className="text-sub">E-mail</span>
                <span className="text-text font-medium">{provisional.email}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-sub">Senha provisória</span>
                <span className="text-text font-mono font-medium tracking-wide">{provisional.senha}</span>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Btn
                kind="primary"
                icon={<I.check />}
                onClick={() => {
                  pushToast("success", "Auditor adicionado à firma");
                  onClose();
                }}
              >
                Concluir
              </Btn>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 grid gap-3">
              <FormField label="Nome completo" required>
                <TextField {...register("nome")} placeholder="Nome do auditor" />
                {errors.nome && (
                  <div className="mt-1.5 text-[12px] text-rust flex items-center gap-1.5">
                    <I.alert size={12} />
                    {errors.nome.message}
                  </div>
                )}
              </FormField>
              <FormField label="E-mail" required>
                <TextField type="email" {...register("email")} placeholder="auditor@firma.com" icon={<I.mail />} />
                {errors.email && (
                  <div className="mt-1.5 text-[12px] text-rust flex items-center gap-1.5">
                    <I.alert size={12} />
                    {errors.email.message}
                  </div>
                )}
              </FormField>
              <FormField label="Perfil" required>
                <SelectField {...register("perfil")}>
                  <option value="AUDITOR">Auditor</option>
                  <option value="ADMIN">Admin</option>
                </SelectField>
              </FormField>
            </div>
            <footer className="px-6 py-4 border-t border-line flex items-center justify-between">
              <button onClick={onClose} className="text-[13px] text-sub hover:text-text">
                Cancelar
              </button>
              <Btn kind="primary" icon={<I.send />} onClick={() => submit()} disabled={invite.isPending}>
                {invite.isPending ? "Enviando…" : "Convidar"}
              </Btn>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
