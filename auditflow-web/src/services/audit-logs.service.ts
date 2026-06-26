import api from "@/lib/api";
import type { AuditLogResponse } from "@/types/api";

export const auditLogsService = {
  recent: (limit = 50): Promise<AuditLogResponse[]> =>
    api.get("/api/audit-logs", { params: { limit } }).then((r) => r.data),
};
