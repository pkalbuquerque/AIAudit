"use client";

import { usePerfil } from "@/store/perfil-context";
import { DashboardAuditor } from "@/components/dashboard/dashboard-auditor";
import { DashboardManager } from "@/components/dashboard/dashboard-manager";

export default function DashboardPage() {
  const { perfil } = usePerfil();
  return perfil === "manager" ? <DashboardManager /> : <DashboardAuditor />;
}
