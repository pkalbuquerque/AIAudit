import api from "@/lib/api";
import type { AuditorLoadResponse, DashboardResponse } from "@/types/api";

export const dashboardService = {
  summary: (): Promise<DashboardResponse> => api.get("/api/dashboard").then((r) => r.data),

  /** Carga por auditor — somente ADMIN. */
  auditorLoad: (): Promise<AuditorLoadResponse[]> =>
    api.get("/api/dashboard/auditor-load").then((r) => r.data),
};
