"use client";

/* Define a senha a partir de um link de e-mail (ativação de convite ou redefinição).
   Valida o token em GET /api/auth/token-info e grava em POST /api/auth/reset-password. */

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { I } from "@/components/ui/icons";
import { authService } from "@/services/auth.service";
import { handleApiError } from "@/lib/error-handler";
import { pushToast } from "@/store/toast-store";
import type { TokenInfoResponse } from "@/types/api";

const schema = z
  .object({
    novaSenha: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres.")
      .regex(/[0-9]/, "A senha deve conter pelo menos um número."),
    confirmar: z.string(),
  })
  .refine((d) => d.novaSenha === d.confirmar, {
    path: ["confirmar"],
    message: "As senhas não coincidem.",
  });

type Form = z.infer<typeof schema>;

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

function DefinirSenhaInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [info, setInfo] = useState<TokenInfoResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { novaSenha: "", confirmar: "" } });

  useEffect(() => {
    if (!token) {
      setInfo({ valido: false });
      return;
    }
    authService
      .tokenInfo(token)
      .then(setInfo)
      .catch(() => setInfo({ valido: false }));
  }, [token]);

  const submit = handleSubmit(async (data) => {
    setApiError(null);
    setSubmitting(true);
    try {
      await authService.resetPassword({ token, novaSenha: data.novaSenha });
      pushToast("success", "Senha definida! Faça login para continuar.");
      router.replace("/login");
    } catch (err) {
      setApiError(handleApiError(err, "Não foi possível definir a senha. O link pode ter expirado."));
      setSubmitting(false);
    }
  });

  // Validando o token
  if (info === null) {
    return (
      <Shell>
        <div className="flex items-center gap-3 text-[13.5px] text-sub">
          <span className="w-4 h-4 rounded-full border-2 border-line border-t-ink-900 animate-spin" />
          Validando o link…
        </div>
      </Shell>
    );
  }

  // Token inválido/expirado
  if (!info.valido) {
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
          Este link já foi usado ou passou da validade. Solicite um novo para continuar.
        </p>
        <Link
          href="/esqueci-senha"
          className="mt-7 inline-flex items-center gap-2 text-[13px] font-semibold text-text hover:opacity-80"
        >
          Solicitar novo link <I.arrowR size={15} />
        </Link>
      </Shell>
    );
  }

  const ativacao = info.tipo === "ACTIVATION";

  return (
    <Shell>
      <h2 className="font-display text-[28px] text-text leading-tight">
        {ativacao ? "Defina sua senha" : "Nova senha"}
      </h2>
      <p className="text-[13px] text-sub mt-1.5 mb-7">
        {info.nome ? (
          <>
            Olá, <span className="text-text font-medium">{info.nome}</span>.{" "}
          </>
        ) : null}
        {ativacao
          ? "Crie uma senha para ativar seu acesso ao AuditFlow."
          : "Escolha uma nova senha para a sua conta."}
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
        <label className="block text-[11px] tracking-[0.16em] uppercase text-sub mb-1.5">Nova senha</label>
        <input
          type="password"
          autoComplete="new-password"
          {...register("novaSenha")}
          placeholder="••••••••"
          className="w-full h-11 px-3 rounded-md border border-line bg-white text-[13.5px] placeholder:text-sub outline-none focus:border-mint focus:ring-2 focus:ring-mint/20"
        />
        {errors.novaSenha && (
          <div className="mt-1.5 text-[12px] text-rust flex items-center gap-1.5">
            <I.alert size={12} />
            {errors.novaSenha.message}
          </div>
        )}

        <label className="block text-[11px] tracking-[0.16em] uppercase text-sub mb-1.5 mt-5">
          Confirmar senha
        </label>
        <input
          type="password"
          autoComplete="new-password"
          {...register("confirmar")}
          placeholder="••••••••"
          className="w-full h-11 px-3 rounded-md border border-line bg-white text-[13.5px] placeholder:text-sub outline-none focus:border-mint focus:ring-2 focus:ring-mint/20"
        />
        {errors.confirmar && (
          <div className="mt-1.5 text-[12px] text-rust flex items-center gap-1.5">
            <I.alert size={12} />
            {errors.confirmar.message}
          </div>
        )}

        <div className="mt-3 text-[11.5px] text-sub flex items-center gap-1.5">
          <I.shield size={13} /> Mínimo de 8 caracteres, com pelo menos um número.
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full h-11 rounded-md text-[13.5px] font-semibold inline-flex items-center justify-center gap-2 text-white transition-opacity disabled:opacity-70"
          style={{ background: "#0D1F2D" }}
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Salvando…
            </>
          ) : (
            <>
              {ativacao ? "Ativar acesso" : "Salvar senha"} <I.arrowR size={15} />
            </>
          )}
        </button>
      </form>
    </Shell>
  );
}

export default function DefinirSenhaPage() {
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
      <DefinirSenhaInner />
    </Suspense>
  );
}
