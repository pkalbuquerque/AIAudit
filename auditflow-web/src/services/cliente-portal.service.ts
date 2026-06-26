import api from "@/lib/api";
import type { PbcItemResponse } from "@/types/api";

export const clientePortalService = {
  listMyItems: (cycleId?: string): Promise<PbcItemResponse[]> =>
    api.get("/api/portal/items", { params: cycleId ? { cycleId } : undefined }).then((r) => r.data),

  getItem: (id: string): Promise<PbcItemResponse> =>
    api.get(`/api/portal/items/${id}`).then((r) => r.data),

  /** Upload de evidência (multipart). Move o item para EM_REVISAO. */
  submit: (id: string, file: File, onProgress?: (percent: number) => void): Promise<PbcItemResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post(`/api/portal/items/${id}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      })
      .then((r) => r.data);
  },
};
