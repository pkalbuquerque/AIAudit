import type { BadgeKind, PbcItem } from "@/types";
import { daysLeft } from "./format";

/* status → cor de exibição do badge */
export const STATUS: Record<BadgeKind, { l: string; c: string; b: string }> = {
  atrasado: { l: "Atrasado", c: "#E5533C", b: "rgba(229,83,60,0.14)" },
  vencehoje: { l: "Vence hoje", c: "#B47600", b: "rgba(240,165,0,0.18)" },
  pendente: { l: "Pendente", c: "#B47600", b: "rgba(240,165,0,0.18)" },
  revisao: { l: "Em Revisão", c: "#1F5FB4", b: "rgba(44,123,229,0.14)" },
  aprovado: { l: "Aprovado", c: "#0A8F6A", b: "rgba(0,200,150,0.18)" },
  rejeitado: { l: "Rejeitado", c: "#E5533C", b: "rgba(229,83,60,0.14)" },
  planejamento: { l: "Planejamento", c: "#4B5563", b: "rgba(107,114,128,0.16)" },
  andamento: { l: "Em Andamento", c: "#1F5FB4", b: "rgba(44,123,229,0.14)" },
  revisaofinal: { l: "Revisão Final", c: "#B47600", b: "rgba(240,165,0,0.18)" },
  encerrado: { l: "Encerrado", c: "#0A8F6A", b: "rgba(0,200,150,0.18)" },
};

/* status do item → tipo de badge exibido */
export function badgeKind(item: PbcItem): BadgeKind {
  switch (item.status) {
    case "APROVADO":
      return "aprovado";
    case "REJEITADO":
      return "rejeitado";
    case "ENVIADO":
    case "EM_REVISAO":
      return "revisao";
    default: {
      // PENDENTE
      const d = daysLeft(item.prazo);
      if (d !== null && d < 0) return "atrasado";
      if (d === 0) return "vencehoje";
      return "pendente";
    }
  }
}

export const isOverdue = (item: PbcItem) =>
  item.status === "PENDENTE" && (daysLeft(item.prazo) ?? 99) < 0;

export const isReviewable = (item: PbcItem) =>
  item.status === "EM_REVISAO" || item.status === "ENVIADO";

export const isActionableByClient = (item: PbcItem) =>
  item.status === "PENDENTE" || item.status === "REJEITADO";
