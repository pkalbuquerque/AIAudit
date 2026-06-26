"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auditCyclesService } from "@/services/audit-cycles.service";
import type {
  CreateAuditCycleRequest,
  CycleStatusApi,
  UpdateCycleStatusRequest,
} from "@/types/api";
import { queryKeys } from "./query-keys";

export function useAuditCycles(filters?: { status?: CycleStatusApi; auditClientId?: string }) {
  return useQuery({
    queryKey: queryKeys.cycles(filters),
    queryFn: () => auditCyclesService.list(filters),
    staleTime: 60_000,
  });
}

export function useAuditCycle(id: string) {
  return useQuery({
    queryKey: queryKeys.cycle(id),
    queryFn: () => auditCyclesService.get(id),
    staleTime: 60_000,
    enabled: !!id,
  });
}

export function useCreateAuditCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAuditCycleRequest) => auditCyclesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["audit-cycles"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateCycleStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCycleStatusRequest }) =>
      auditCyclesService.updateStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["audit-cycles"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeleteCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => auditCyclesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["audit-cycles"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
