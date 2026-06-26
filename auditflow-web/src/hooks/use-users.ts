"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";
import type { CreateUserRequest, UpdateProfileRequest, UserUpdateRequest } from "@/types/api";
import { queryKeys } from "./query-keys";

/** Atualiza o próprio perfil (PATCH /api/users/me). */
export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => usersService.updateMe(data),
  });
}

/** Lista de usuários do tenant — endpoint restrito a ADMIN (403 para AUDITOR). */
export function useUsers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: usersService.list,
    staleTime: 60_000,
    enabled,
    retry: false, // não insistir num 403
  });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserRequest) => usersService.invite(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdateRequest }) =>
      usersService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users }),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersService.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users }),
  });
}
