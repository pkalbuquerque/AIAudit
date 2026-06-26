"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pbcItemsService } from "@/services/pbc-items.service";
import type { CreatePbcItemRequest } from "@/types/api";
import { queryKeys } from "./query-keys";

export function usePbcItems(cycleId: string | null) {
  return useQuery({
    queryKey: queryKeys.pbcItems(cycleId ?? ""),
    queryFn: () => pbcItemsService.list(cycleId!),
    staleTime: 60_000,
    enabled: !!cycleId,
  });
}

export function usePbcItem(id: string) {
  return useQuery({
    queryKey: queryKeys.pbcItem(id),
    queryFn: () => pbcItemsService.get(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

function useInvalidatePbc() {
  const qc = useQueryClient();
  return (cycleId?: string, itemId?: string) => {
    if (cycleId) qc.invalidateQueries({ queryKey: queryKeys.pbcItems(cycleId) });
    else qc.invalidateQueries({ queryKey: ["pbc-items"] });
    if (itemId) qc.invalidateQueries({ queryKey: queryKeys.pbcItem(itemId) });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard });
  };
}

export function useCreatePbcItem() {
  const invalidate = useInvalidatePbc();
  return useMutation({
    mutationFn: ({ cycleId, data }: { cycleId: string; data: CreatePbcItemRequest }) =>
      pbcItemsService.create(cycleId, data),
    onSuccess: (_, { cycleId }) => invalidate(cycleId),
  });
}

export function useApprovePbcItem() {
  const invalidate = useInvalidatePbc();
  return useMutation({
    mutationFn: ({ id, comentario }: { id: string; comentario?: string; cycleId?: string }) =>
      pbcItemsService.approve(id, comentario ? { comentario } : {}),
    onSuccess: (_, { id, cycleId }) => invalidate(cycleId, id),
  });
}

export function useRejectPbcItem() {
  const invalidate = useInvalidatePbc();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string; cycleId?: string }) =>
      pbcItemsService.reject(id, { motivo }),
    onSuccess: (_, { id, cycleId }) => invalidate(cycleId, id),
  });
}

export function useDeletePbcItem() {
  const invalidate = useInvalidatePbc();
  return useMutation({
    mutationFn: ({ id }: { id: string; cycleId?: string }) => pbcItemsService.delete(id),
    onSuccess: (_, { cycleId }) => invalidate(cycleId),
  });
}
