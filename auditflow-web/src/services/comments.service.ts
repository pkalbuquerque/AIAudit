import api from "@/lib/api";
import type { CommentResponse, CreateCommentRequest } from "@/types/api";

export const commentsService = {
  list: (pbcItemId: string): Promise<CommentResponse[]> =>
    api.get(`/api/pbc/${pbcItemId}/comments`).then((r) => r.data),

  create: (pbcItemId: string, data: CreateCommentRequest): Promise<CommentResponse> =>
    api.post(`/api/pbc/${pbcItemId}/comments`, data).then((r) => r.data),
};
