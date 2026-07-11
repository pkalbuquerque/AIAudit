import api from "@/lib/api";
import type { AuditLogResponse, PageResponse } from "@/types/api";

export const auditLogsService = {
  /** Página da trilha de auditoria (envelope com metadados de paginação). */
  page: (page = 0, size = 50): Promise<PageResponse<AuditLogResponse>> =>
    api.get("/api/audit-logs", { params: { page, size } }).then((r) => r.data),

  /** Atalho: só o conteúdo da primeira página (usado pela tela atual, sem controles de paginação). */
  recent: (size = 50): Promise<AuditLogResponse[]> =>
    auditLogsService.page(0, size).then((p) => p.content),
};
