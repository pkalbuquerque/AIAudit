"use client";

/* Perfil de visualização derivado do usuário autenticado (JWT):
   ADMIN → "manager" · AUDITOR → "auditor".
   (CLIENTE não usa estas telas — é redirecionado para /portal.) */

import { useAuth } from "@/contexts/auth-context";
import type { Perfil } from "@/types";

export function usePerfil(): { perfil: Perfil; ready: boolean } {
  const { user, ready } = useAuth();
  return {
    perfil: user?.perfil === "ADMIN" ? "manager" : "auditor",
    ready,
  };
}

/* Metadados visuais por perfil (tom do avatar, rótulo do portal). */
export const PERFIL_META: Record<Perfil, { role: string; portal: string; tone: string }> = {
  manager: { role: "Admin da Firma", portal: "Firm Portal", tone: "#2C7BE5" },
  auditor: { role: "Auditor", portal: "Auditor Portal", tone: "#1A3A4A" },
};
