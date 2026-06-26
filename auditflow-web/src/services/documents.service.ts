import api from "@/lib/api";
import type { DocumentResponse } from "@/types/api";

export const documentsService = {
  listByPbcItem: (pbcItemId: string): Promise<DocumentResponse[]> =>
    api.get(`/api/pbc/${pbcItemId}/documents`).then((r) => r.data),

  /** O backend serve o arquivo direto (stream autenticado), não há presigned URL. */
  download: async (id: string, fileName?: string): Promise<void> => {
    const response = await api.get(`/api/documents/${id}/download`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ?? "documento";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
