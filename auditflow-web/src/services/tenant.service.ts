import api from "@/lib/api";
import type { TenantResponse, UpdateTenantRequest } from "@/types/api";

export const tenantService = {
  current: (): Promise<TenantResponse> => api.get("/api/tenant").then((r) => r.data),

  update: (data: UpdateTenantRequest): Promise<TenantResponse> =>
    api.patch("/api/tenant", data).then((r) => r.data),
};
