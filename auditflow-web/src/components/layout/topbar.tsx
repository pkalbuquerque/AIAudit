"use client";

import { Fragment } from "react";
import { I } from "@/components/ui/icons";
import { Avatar } from "@/components/ui/avatar";
import { PERFIL_META } from "@/store/perfil-context";
import { useAuth } from "@/contexts/auth-context";
import type { Perfil } from "@/types";

export function Topbar({
  greeting,
  title,
  subtitle,
  action,
  breadcrumb,
  children,
  perfil,
}: {
  greeting?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  breadcrumb?: string[];
  children?: React.ReactNode;
  perfil?: Perfil;
}) {
  return (
    <header className="px-10 pt-7 pb-6 bg-white border-b border-line">
      {breadcrumb && (
        <div className="text-[12px] text-sub mb-3 flex items-center gap-1.5">
          {breadcrumb.map((b, i) => (
            <Fragment key={i}>
              <span
                className={
                  i === breadcrumb.length - 1 ? "text-text font-medium" : "hover:text-text cursor-pointer"
                }
              >
                {b}
              </span>
              {i < breadcrumb.length - 1 && <I.chev size={12} className="text-sub/60" />}
            </Fragment>
          ))}
        </div>
      )}
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0">
          {greeting && (
            <div className="text-[12px] tracking-[0.18em] uppercase text-sub mb-1.5">{greeting}</div>
          )}
          <h1 className="font-display text-[34px] leading-[1.1] text-text">{title}</h1>
          {subtitle && <div className="mt-2 text-[14px] text-sub">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {perfil && <PerfilBadge perfil={perfil} />}
          {children}
          {action}
        </div>
      </div>
    </header>
  );
}

export function PerfilBadge({ perfil }: { perfil: Perfil }) {
  const isM = perfil === "manager";
  return (
    <span
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[12px] font-medium border"
      style={
        isM
          ? { color: "#FFFFFF", background: "#1A3A4A", borderColor: "#1A3A4A" }
          : { color: "#4B5563", background: "rgba(107,114,128,0.1)", borderColor: "#E2E8F0" }
      }
    >
      <I.shield size={13} />
      {isM ? "Manager" : "Auditor"}
    </span>
  );
}

export function TopbarChrome({ perfil }: { perfil: Perfil }) {
  const meta = PERFIL_META[perfil];
  const { user } = useAuth();
  const nome = user?.nome ?? "—";
  return (
    <>
      <button className="h-10 w-10 rounded-md border border-line bg-white flex items-center justify-center text-sub hover:text-text relative">
        <I.bell size={16} />
        <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full" style={{ background: "#E5533C" }} />
      </button>
      <button className="h-10 px-1.5 rounded-md border border-line bg-white flex items-center gap-2.5 hover:bg-paper">
        <Avatar name={nome} size={26} tone={meta.tone} />
        <span className="text-[12.5px] text-text pr-2">{nome.split(" ")[0]}</span>
        <I.chevD size={13} className="text-sub mr-2" />
      </button>
    </>
  );
}

export function SectionTitle({
  children,
  hint,
  action,
}: {
  children: React.ReactNode;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <h2 className="font-display text-[20px] text-text">{children}</h2>
        {hint && <div className="text-[12.5px] text-sub mt-0.5">{hint}</div>}
      </div>
      {action}
    </div>
  );
}
