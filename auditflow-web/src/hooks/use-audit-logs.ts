"use client";

import { useQuery } from "@tanstack/react-query";
import { auditLogsService } from "@/services/audit-logs.service";
import { queryKeys } from "./query-keys";

/** Trilha de auditoria — somente ADMIN (403 para AUDITOR). */
export function useAuditLogs(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auditLogs,
    queryFn: () => auditLogsService.recent(50),
    staleTime: 30_000,
    enabled,
    retry: false,
  });
}
