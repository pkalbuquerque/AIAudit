"use client";

import { I } from "@/components/ui/icons";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

export function ClientHeader() {
  const { user, logout } = useAuth();
  const tabs: [string, boolean][] = [
    ["Minhas tarefas", true],
    ["Histórico", false],
    ["Documentos", false],
  ];
  return (
    <header className="bg-white border-b border-line sticky top-0 z-30">
      <div className="max-w-[1180px] mx-auto px-8 h-16 flex items-center gap-7">
        {/* marca */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "#0D1F2D" }}>
            <span className="font-display text-[16px] leading-none text-mint mt-0.5">A</span>
          </div>
          <div className="leading-tight">
            <div className="font-display text-[16px] text-text">AuditFlow</div>
            <div className="text-[9px] tracking-[0.22em] uppercase text-sub">Portal do Cliente</div>
          </div>
        </div>

        {/* abas */}
        <nav className="hidden md:flex items-center gap-1 text-[13px] h-full">
          {tabs.map(([label, active]) => (
            <button
              key={label}
              className={`relative h-full px-3 transition-colors ${
                active ? "text-text font-medium" : "text-sub hover:text-text"
              }`}
            >
              {label}
              {active && <span className="absolute left-3 right-3 bottom-0 h-0.5 rounded-full bg-ink-900" />}
            </button>
          ))}
        </nav>

        {/* cluster direito */}
        <div className="ml-auto flex items-center gap-3">
          <button
            title="Notificações"
            className="w-9 h-9 rounded-md border border-line bg-white flex items-center justify-center text-sub hover:text-text hover:bg-paper relative"
          >
            <I.bell size={15} />
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-line">
            <Avatar name={user?.nome ?? "—"} size={34} tone="#7E3AF2" />
            <div className="leading-tight">
              <div className="text-[12.5px] text-text font-medium">{user?.nome}</div>
              <button
                onClick={logout}
                className="text-[10.5px] text-sub hover:text-text inline-flex items-center gap-1"
              >
                <I.logout size={10} />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
