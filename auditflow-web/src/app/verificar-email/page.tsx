"use client";

/* Confirma o e-mail do registro a partir do link — POST /api/auth/verify-email.
   Em caso de falha, permite reenviar a verificação. */

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { I } from "@/components/ui/icons";
import { authService } from "@/services/auth.service";

type Status = "verificando" | "ok" | "erro";

const resendSchema = z.object({ email: z.string().trim().email("E-mail inválido.") });
type ResendForm = z.infer<typeof resendSchema>;

function Shell({ children }: { children: React.ReactNode }) {
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
        {children}
      </div>
    </div>
  );
}

function VerificarEmailInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<Status>("verificando");
  const [resent, setResent] = useState(false);
  const started = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResendForm>({ resolver: zodResolver(resendSchema), defaultValues: { email: "" } });

  useEffect(() => {
    if (started.current) return; // evita disparo duplo no StrictMode
    started.current = true;
    if (!token) {
      setStatus("erro");
      return;
    }
    authService
      .verifyEmail(token)
      .then(() => setStatus("ok"))
      .catch(() => setStatus("erro"));
  }, [token]);

  const resend = handleSubmit(async (data) => {
    try {
      await authService.resendVerification(data.email);
    } finally {
      setResent(true);
    }
  });

  if (status === "verificando") {
    return (
      <Shell>
        <div className="flex items-center gap-3 text-[13.5px] text-sub">
          <span className="w-4 h-4 rounded-full border-2 border-line border-t-ink-900 animate-spin" />
          Confirmando seu e-mail…
        </div>
      </Shell>
    );
  }

  if (status === "ok") {
    return (
      <Shell>
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
          style={{ background: "rgba(0,200,150,0.14)", color: "#0A8F6A" }}
        >
          <I.check size={20} />
        </div>
        <h2 className="font-display text-[26px] text-text leading-tight">E-mail confirmado</h2>
        <p className="text-[13.5px] text-sub mt-2 leading-relaxed">
          Sua conta está ativa. Agora é só entrar.
        </p>
        <Link
          href="/login"
          className="mt-7 inline-flex items-center gap-2 text-[13px] font-semibold text-text hover:opacity-80"
        >
          Ir para o login <I.arrowR size={15} />
        </Link>
      </Shell>
    );
  }

  // erro
  return (
    <Shell>
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
        style={{ background: "rgba(229,83,60,0.12)", color: "#E5533C" }}
      >
        <I.alert size={20} />
      </div>
      <h2 className="font-display text-[26px] text-text leading-tight">Link inválido ou expirado</h2>
      <p className="text-[13.5px] text-sub mt-2 leading-relaxed">
        Não foi possível confirmar o e-mail. Informe seu e-mail que reenviamos um novo link.
      </p>

      {resent ? (
        <div
          className="mt-6 rounded-md border p-3.5 flex items-start gap-2.5 text-[13px]"
          style={{ borderColor: "rgba(0,200,150,0.35)", background: "rgba(0,200,150,0.06)", color: "#0A8F6A" }}
        >
          <I.mail size={15} className="mt-0.5 shrink-0" />
          Se o e-mail estiver cadastrado e pendente, enviamos um novo link.
        </div>
      ) : (
        <form onSubmit={resend} noValidate className="mt-6">
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
            disabled={isSubmitting}
            className="mt-5 w-full h-11 rounded-md text-[13.5px] font-semibold inline-flex items-center justify-center gap-2 text-white transition-opacity disabled:opacity-70"
            style={{ background: "#0D1F2D" }}
          >
            {isSubmitting ? "Enviando…" : "Reenviar verificação"}
          </button>
        </form>
      )}

      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-2 text-[13px] text-sub hover:text-text"
      >
        <I.arrowL size={14} /> Voltar para o login
      </Link>
    </Shell>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <div className="flex items-center gap-3 text-[13.5px] text-sub">
            <span className="w-4 h-4 rounded-full border-2 border-line border-t-ink-900 animate-spin" />
            Carregando…
          </div>
        </Shell>
      }
    >
      <VerificarEmailInner />
    </Suspense>
  );
}
