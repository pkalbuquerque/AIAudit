"use client";

/* Guarda de rota client-side por perfil.
   - Não autenticado → /login
   - Perfil sem acesso → home do próprio perfil (ex.: CLIENTE não vê /dashboard) */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homeFor, useAuth } from "@/contexts/auth-context";
import type { Perfil } from "@/types/api";

export function RequireAuth({
  allow,
  children,
}: {
  allow: Perfil[];
  children: React.ReactNode;
}) {
  const { ready, isAuthenticated, perfil } = useAuth();
  const router = useRouter();

  const allowed = !!perfil && allow.includes(perfil);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) router.replace("/login");
    else if (!allowed && perfil) router.replace(homeFor(perfil));
  }, [ready, isAuthenticated, allowed, perfil, router]);

  if (!ready || !isAuthenticated || !allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="flex items-center gap-3 text-sub text-[13px]">
          <span className="w-4 h-4 rounded-full border-2 border-line border-t-ink-900 animate-spin" />
          Verificando sessão…
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
