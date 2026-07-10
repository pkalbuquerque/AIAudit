"use client";

/* Solicita o link de redefinição de senha — POST /api/auth/forgot-password.
   A resposta é sempre genérica (não revela se o e-mail existe). */

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { I } from "@/components/ui/icons";
import { authService } from "@/services/auth.service";
import { handleApiError } from "@/lib/error-handler";

const schema = z.object({
  email: z.string().trim().email("E-mail inválido."),
});

type Form = z.infer<typeof schema>;

export default function EsqueciSenhaPage() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const submit = handleSubmit(async (data) => {
    setApiError(null);
    setSubmitting(true);
    try {
      await authService.forgotPassword({ email: data.email });
      setSent(data.email);
    } catch (err) {
      setApiError(handleApiError(err, "Não foi possível enviar o link. Tente novamente."));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: "#00C896" }}>
            <span className="font-display text-[20px] leading-none" style={{ color: "#0D1F2D", marginTop: 2 }}>
              A
            </span>
          </div>
          <div className="font-display text-[18px] text-text">AuditFlow</div>
        </div>

        {sent ? (
          <div className="fade-in">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
              style={{ background: "rgba(0,200,150,0.14)", color: "#0A8F6A" }}
            >
              <I.mail size={20} />
            </div>
            <h2 className="font-display text-[26px] text-text leading-tight">Verifique seu e-mail</h2>
            <p className="text-[13.5px] text-sub mt-2 leading-relaxed">
              Se <span className="text-text font-medium">{sent}</span> estiver cadastrado, enviamos um
              link para redefinir a senha. O link expira em 1 hora.
            </p>
            <Link
              href="/login"
              className="mt-7 inline-flex items-center gap-2 text-[13px] font-semibold text-text hover:opacity-80"
            >
              <I.arrowL size={15} /> Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="font-display text-[28px] text-text leading-tight">Esqueceu a senha?</h2>
            <p className="text-[13px] text-sub mt-1.5 mb-7">
              Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.
            </p>

            {apiError && (
              <div
                className="mb-5 rounded-md border p-3.5 flex items-start gap-2.5 text-[13px]"
                style={{ borderColor: "rgba(229,83,60,0.35)", background: "rgba(229,83,60,0.06)", color: "#E5533C" }}
              >
                <I.alert size={15} className="mt-0.5 shrink-0" />
                {apiError}
              </div>
            )}

            <form onSubmit={submit} noValidate>
              <label className="block text-[11px] tracking-[0.16em] uppercase text-sub mb-1.5">E-mail</label>
              <input
                type="email"
                autoComplete="email"
                {...register("email")}
                placeholder="voce@escritorio.com.br"
                className="w-full h-11 px-3 rounded-md border border-line bg-white text-[13.5px] placeholder:text-sub outline-none focus:border-mint focus:ring-2 focus:ring-mint/20"
              />
              {errors.email && (
                <div className="mt-1.5 text-[12px] text-rust flex items-center gap-1.5">
                  <I.alert size={12} />
                  {errors.email.message}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full h-11 rounded-md text-[13.5px] font-semibold inline-flex items-center justify-center gap-2 text-white transition-opacity disabled:opacity-70"
                style={{ background: "#0D1F2D" }}
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Enviando…
                  </>
                ) : (
                  <>
                    Enviar link <I.arrowR size={15} />
                  </>
                )}
              </button>
            </form>

            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 text-[13px] text-sub hover:text-text"
            >
              <I.arrowL size={14} /> Voltar para o login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
