import api from "@/lib/api";
import type {
  ApproveRequest,
  CreatePbcItemRequest,
  PbcItemResponse,
  RejectRequest,
} from "@/types/api";

export const pbcItemsService = {
  list: (cycleId: string): Promise<PbcItemResponse[]> =>
    api.get("/api/pbc-items", { params: { cycleId } }).then((r) => r.data),

  get: (id: string): Promise<PbcItemResponse> =>
    api.get(`/api/pbc-items/${id}`).then((r) => r.data),

  create: (cycleId: string, data: CreatePbcItemRequest): Promise<PbcItemResponse> =>
    api.post("/api/pbc-items", data, { params: { cycleId } }).then((r) => r.data),

  delete: (id: string): Promise<void> => api.delete(`/api/pbc-items/${id}`).then((r) => r.data),

  approve: (id: string, data: ApproveRequest = {}): Promise<PbcItemResponse> =>
    api.post(`/api/pbc-items/${id}/approve`, data).then((r) => r.data),

  reject: (id: string, data: RejectRequest): Promise<PbcItemResponse> =>
    api.post(`/api/pbc-items/${id}/reject`, data).then((r) => r.data),
};
