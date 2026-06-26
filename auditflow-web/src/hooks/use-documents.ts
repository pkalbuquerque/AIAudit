"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { documentsService } from "@/services/documents.service";
import { queryKeys } from "./query-keys";

export function useDocuments(pbcItemId: string) {
  return useQuery({
    queryKey: queryKeys.documents(pbcItemId),
    queryFn: () => documentsService.listByPbcItem(pbcItemId),
    staleTime: 60_000,
    enabled: !!pbcItemId,
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: ({ id, fileName }: { id: string; fileName?: string }) =>
      documentsService.download(id, fileName),
  });
}
