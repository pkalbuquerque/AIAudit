"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { I, type IconComponent } from "@/components/ui/icons";
import { Avatar } from "@/components/ui/avatar";
import { usePerfil, PERFIL_META } from "@/store/perfil-context";
import { useAuth } from "@/contexts/auth-context";
import { useDashboardSummary } from "@/hooks/use-dashboard";

interface NavItem {
  href: string;
  label: string;
  Ic: IconComponent;
  badge?: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Ic: I.layout },
  { href: "/cycles", label: "Projetos de Auditoria", Ic: I.cycle },
  { href: "/pbc", label: "Lista PBC", Ic: I.list, badge: true },
  { href: "/clients", label: "Clientes", Ic: I.client },
  { href: "/reports", label: "Relatórios", Ic: I.report },
];

export function Sidebar() {
  const pathname = usePathname();
  const { perfil } = usePerfil();
  const { user, logout } = useAuth();
  const meta = PERFIL_META[perfil];

  const { data: dashboard } = useDashboardSummary();
  const pbcBadge = dashboard?.filaRevisao ?? 0;

  const nav =
    perfil === "manager"
      ? [...NAV.slice(0, 4), { href: "/assignments", label: "Atribuições", Ic: I.users }, NAV[4]]
      : NAV;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className="w-[240px] shrink-0 flex flex-col text-white sticky top-0 max-h-screen overflow-y-auto"
      style={{ background: "#0D1F2D", minHeight: "100vh" }}
    >
      <div className="px-5 pt-6 pb-6 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: "#00C896" }}>
          <span className="font-display text-[20px] leading-none" style={{ color: "#0D1F2D", marginTop: 2 }}>
            A
          </span>
        </div>
        <div className="leading-tight">
          <div className="font-display text-[18px]">AuditFlow</div>
          <div className="text-[9.5px] tracking-[0.22em] uppercase text-white/40 mt-0.5">{meta.portal}</div>
        </div>
      </div>

      <div className="px-4 mb-2 text-[9.5px] tracking-[0.22em] uppercase text-white/30">Workspace</div>
      <nav className="px-2 flex flex-col gap-0.5">
        {nav.map((n) => {
          const A = n.Ic;
          const is = isActive(n.href);
          const showBadge = n.badge && pbcBadge > 0;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`group flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] text-left transition-colors ${
                is ? "bg-white/[0.08] text-white" : "text-white/70 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <A size={17} className={is ? "" : "text-white/55"} style={{ color: is ? "#00C896" : undefined }} />
              <span>{n.label}</span>
              {showBadge && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/80 tabular-nums">
                  {pbcBadge}
                </span>
              )}
              {is && !showBadge && <span className="ml-auto w-1 h-4 rounded-sm" style={{ background: "#00C896" }} />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-7 px-4 mb-2 text-[9.5px] tracking-[0.22em] uppercase text-white/30">Acessos</div>
      <div className="px-2 flex flex-col gap-0.5">
        <Link
          href="/email-template"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] text-white/70 hover:bg-white/[0.04] hover:text-white"
        >
          <I.mail size={17} className="text-white/55" />
          <span>Templates de e-mail</span>
        </Link>
      </div>

      <div className="mt-auto">
        <nav className="px-2 pb-5 pt-6 flex flex-col gap-0.5">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors ${
              isActive("/settings")
                ? "bg-white/[0.08] text-white"
                : "text-white/55 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            <I.cog size={17} style={{ color: isActive("/settings") ? "#00C896" : undefined }} />
            Configurações
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] text-white/55 hover:bg-white/[0.04] hover:text-white text-left"
          >
            <I.logout size={17} />
            Sair
          </button>
        </nav>
        <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-3">
          <Avatar name={user?.nome ?? "—"} size={32} tone={meta.tone} />
          <div className="leading-tight min-w-0">
            <div className="text-[12.5px] truncate">{user?.nome}</div>
            <div className="text-[10.5px] text-white/45 truncate">{meta.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
