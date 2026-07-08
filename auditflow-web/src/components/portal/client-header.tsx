"use client";

import { I } from "@/components/ui/icons";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

export function ClientHeader() {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08]" style={{ background: "#0D1F2D" }}>
      <div className="max-w-[1180px] mx-auto px-8 h-16 flex items-center gap-7">
        {/* marca */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "#00C896" }}>
            <span className="font-display text-[16px] leading-none mt-0.5" style={{ color: "#0D1F2D" }}>
              A
            </span>
          </div>
          <div className="leading-tight">
            <div className="font-display text-[16px] text-white">AuditFlow</div>
            <div className="text-[9px] tracking-[0.22em] uppercase text-white/40">Portal do Cliente</div>
          </div>
        </div>

        {/* cluster direito */}
        <div className="ml-auto flex items-center gap-2.5">
          <Avatar name={user?.nome ?? "—"} size={34} tone="#7E3AF2" />
          <div className="leading-tight">
            <div className="text-[12.5px] text-white font-medium">{user?.nome}</div>
            <button
              onClick={logout}
              className="text-[10.5px] text-white/50 hover:text-white inline-flex items-center gap-1"
            >
              <I.logout size={10} />
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
