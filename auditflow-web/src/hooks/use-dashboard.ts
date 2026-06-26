"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import { queryKeys } from "./query-keys";

export function useDashboardSummary(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardService.summary,
    staleTime: 30_000,
    enabled,
  });
}

/** Carga por auditor — somente ADMIN (403 para AUDITOR). */
export function useAuditorLoad(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auditorLoad,
    queryFn: dashboardService.auditorLoad,
    staleTime: 30_000,
    enabled,
    retry: false,
  });
}
