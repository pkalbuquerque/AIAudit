"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auditClientsService } from "@/services/audit-clients.service";
import type {
  CreateAuditClientRequest,
  CreateClientUserRequest,
  UpdateAuditClientRequest,
} from "@/types/api";
import { queryKeys } from "./query-keys";

export function useAuditClients(enabled = true) {
  return useQuery({
    queryKey: queryKeys.clients,
    queryFn: auditClientsService.list,
    staleTime: 60_000,
    enabled,
  });
}

export function useAuditClient(id: string) {
  return useQuery({
    queryKey: queryKeys.client(id),
    queryFn: () => auditClientsService.get(id),
    staleTime: 60_000,
    enabled: !!id,
  });
}

/** Usuários CLIENTE de um cliente — para atribuir o responsável de um item PBC. */
export function useClientUsers(clientId?: string | null) {
  return useQuery({
    queryKey: queryKeys.clientUsers(clientId ?? ""),
    queryFn: () => auditClientsService.listUsers(clientId as string),
    staleTime: 60_000,
    enabled: !!clientId,
  });
}

/** Documentos enviados em todos os ciclos do cliente. */
export function useClientDocuments(clientId?: string | null) {
  return useQuery({
    queryKey: queryKeys.clientDocuments(clientId ?? ""),
    queryFn: () => auditClientsService.listDocuments(clientId as string),
    staleTime: 60_000,
    enabled: !!clientId,
  });
}

/** Cria um usuário CLIENTE adicional para o cliente. */
export function useAddClientUser(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientUserRequest) => auditClientsService.addUser(clientId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.clientUsers(clientId) }),
  });
}

export function useCreateAuditClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAuditClientRequest) => auditClientsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.clients }),
  });
}

export function useUpdateAuditClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAuditClientRequest }) =>
      auditClientsService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.clients });
      qc.invalidateQueries({ queryKey: queryKeys.client(id) });
    },
  });
}

export function useAssignAuditor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, auditorId }: { id: string; auditorId: string }) =>
      auditClientsService.assignAuditor(id, { auditorId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.clients }),
  });
}
