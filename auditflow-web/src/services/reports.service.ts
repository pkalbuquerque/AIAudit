import api from "@/lib/api";
import type { ReportResponse } from "@/types/api";

export const reportsService = {
  summary: (): Promise<ReportResponse> => api.get("/api/reports").then((r) => r.data),
};
