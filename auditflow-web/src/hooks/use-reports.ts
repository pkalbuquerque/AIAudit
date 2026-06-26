"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/services/reports.service";
import { queryKeys } from "./query-keys";

export function useReports(enabled = true) {
  return useQuery({
    queryKey: queryKeys.reports,
    queryFn: reportsService.summary,
    staleTime: 30_000,
    enabled,
  });
}
