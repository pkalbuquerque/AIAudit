"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tenantService } from "@/services/tenant.service";
import type { UpdateTenantRequest } from "@/types/api";
import { queryKeys } from "./query-keys";

export function useTenant(enabled = true) {
  return useQuery({
    queryKey: queryKeys.tenant,
    queryFn: tenantService.current,
    staleTime: 60_000,
    enabled,
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTenantRequest) => tenantService.update(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tenant }),
  });
}
