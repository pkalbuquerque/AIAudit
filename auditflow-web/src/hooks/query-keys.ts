/* queryKeys padronizados — uma fonte única para invalidação entre domínios */
export const queryKeys = {
  dashboard: ["dashboard"] as const,
  auditorLoad: ["dashboard", "auditor-load"] as const,
  tenant: ["tenant"] as const,
  users: ["users"] as const,
  clients: ["audit-clients"] as const,
  client: (id: string) => ["audit-clients", id] as const,
  clientUsers: (id: string) => ["audit-clients", id, "users"] as const,
  clientDocuments: (id: string) => ["audit-clients", id, "documents"] as const,
  reports: ["reports"] as const,
  auditLogs: ["audit-logs"] as const,
  cycles: (filters?: { status?: string; auditClientId?: string }) =>
    filters && (filters.status || filters.auditClientId)
      ? (["audit-cycles", filters] as const)
      : (["audit-cycles"] as const),
  cycle: (id: string) => ["audit-cycles", "detail", id] as const,
  pbcItems: (cycleId: string) => ["pbc-items", cycleId] as const,
  pbcItem: (id: string) => ["pbc-items", "detail", id] as const,
  comments: (pbcItemId: string) => ["comments", pbcItemId] as const,
  documents: (pbcItemId: string) => ["documents", pbcItemId] as const,
  portalItems: ["portal", "items"] as const,
  portalItem: (id: string) => ["portal", "items", id] as const,
};
