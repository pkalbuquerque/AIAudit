"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientePortalService } from "@/services/cliente-portal.service";
import { queryKeys } from "./query-keys";

export function usePortalItems() {
  return useQuery({
    queryKey: queryKeys.portalItems,
    queryFn: () => clientePortalService.listMyItems(),
    staleTime: 30_000,
  });
}

export function usePortalItem(id: string) {
  return useQuery({
    queryKey: queryKeys.portalItem(id),
    queryFn: () => clientePortalService.getItem(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function useSubmitPortalItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      file,
      onProgress,
    }: {
      id: string;
      file: File;
      onProgress?: (percent: number) => void;
    }) => clientePortalService.submit(id, file, onProgress),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.portalItems });
      qc.invalidateQueries({ queryKey: queryKeys.portalItem(id) });
    },
  });
}
