"use client";

/* Login real contra POST /api/auth/login */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { I } from "@/components/ui/icons";
import { homeFor, useAuth } from "@/contexts/auth-context";
import { handleApiError } from "@/lib/error-handler";

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido."),
  senha: z.string().min(1, "Informe a senha."),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, ready, isAuthenticated, perfil } = useAuth();
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", senha: "" },
  });

  // já logado? vai direto para a home do perfil
  useEffect(() => {
    if (ready && isAuthenticated && perfil) router.replace(homeFor(perfil));
  }, [ready, isAuthenticated, perfil, router]);

  const submit = handleSubmit(async (data) => {
    setApiError(null);
    setSubmitting(true);
    try {
      const res = await login(data.email, data.senha);
      router.replace(homeFor(res.usuario.perfil));
    } catch (err) {
      setApiError(handleApiError(err, "Não foi possível entrar. Confira e-mail e senha."));
      setSubmitting(false);
    }
  });

  return (
    <div className="min-h-screen flex bg-paper">
      {/* painel da marca */}
      <div
        className="hidden lg:flex w-[44%] flex-col justify-between p-12 text-white"
        style={{ background: "#0D1F2D" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: "#00C896" }}>
            <span className="font-display text-[22px] leading-none" style={{ color: "#0D1F2D", marginTop: 2 }}>
              A
            </span>
          </div>
          <div className="font-display text-[20px]">AuditFlow</div>
        </div>
        <div>
          <h1 className="font-display text-[36px] leading-tight max-w-[16ch]">
            Gestão de auditorias sem planilhas soltas.
          </h1>
          <p className="text-white/60 text-[14px] mt-4 max-w-[44ch] leading-relaxed">
            Itens PBC, evidências e revisões num só lugar — para o seu escritório e para os seus
            clientes.
          </p>
        </div>
        <div className="text-[11.5px] text-white/40 flex items-center gap-2">
          <I.shield size={13} />
          Ambiente seguro · dados isolados por escritório
        </div>
      </div>

      {/* formulário */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: "#00C896" }}>
              <span className="font-display text-[20px] leading-none" style={{ color: "#0D1F2D", marginTop: 2 }}>
                A
              </span>
            </div>
            <div className="font-display text-[18px] text-text">AuditFlow</div>
          </div>

          <h2 className="font-display text-[28px] text-text leading-tight">Entrar</h2>
          <p className="text-[13px] text-sub mt-1.5 mb-7">
            Use as credenciais do seu escritório ou o acesso de cliente.
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
            <label className="block text-[11px] tracking-[0.16em] uppercase text-sub mb-1.5">
              E-mail
            </label>
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

            <label className="block text-[11px] tracking-[0.16em] uppercase text-sub mb-1.5 mt-5">
              Senha
            </label>
            <input
              type="password"
              autoComplete="current-password"
              {...register("senha")}
              placeholder="••••••••"
              className="w-full h-11 px-3 rounded-md border border-line bg-white text-[13.5px] placeholder:text-sub outline-none focus:border-mint focus:ring-2 focus:ring-mint/20"
            />
            {errors.senha && (
              <div className="mt-1.5 text-[12px] text-rust flex items-center gap-1.5">
                <I.alert size={12} />
                {errors.senha.message}
              </div>
            )}

            <div className="mt-2 text-right">
              <a href="/esqueci-senha" className="text-[12px] text-sub hover:text-text">
                Esqueci minha senha
              </a>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-7 w-full h-11 rounded-md text-[13.5px] font-semibold inline-flex items-center justify-center gap-2 text-white transition-opacity disabled:opacity-70"
              style={{ background: "#0D1F2D" }}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Entrando…
                </>
              ) : (
                <>
                  Entrar <I.arrowR size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-[12px] text-sub leading-relaxed">
            Cliente do escritório? Use o e-mail e a senha provisória enviados pelo seu auditor.
          </div>
        </div>
      </div>
    </div>
  );
}
