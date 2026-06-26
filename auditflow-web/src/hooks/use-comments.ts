"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commentsService } from "@/services/comments.service";
import { queryKeys } from "./query-keys";

export function useComments(pbcItemId: string) {
  return useQuery({
    queryKey: queryKeys.comments(pbcItemId),
    queryFn: () => commentsService.list(pbcItemId),
    staleTime: 30_000,
    enabled: !!pbcItemId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pbcItemId, texto }: { pbcItemId: string; texto: string }) =>
      commentsService.create(pbcItemId, { texto }),
    onSuccess: (_, { pbcItemId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.comments(pbcItemId) }),
  });
}
