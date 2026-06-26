"use client";

import { I } from "@/components/ui/icons";
import { useToasts } from "@/store/toast-store";
import type { ToastType } from "@/types";

const CONF: Record<ToastType, { c: string; bar: string; Ic: typeof I.check }> = {
  success: { c: "#0A8F6A", bar: "#00C896", Ic: I.check },
  error: { c: "#E5533C", bar: "#E5533C", Ic: I.x },
  info: { c: "#1F5FB4", bar: "#2C7BE5", Ic: I.bell },
};

export function ToastHost() {
  const toasts = useToasts();
  return (
    <div className="fixed z-[80] bottom-4 right-4 flex flex-col gap-2.5" style={{ width: 320 }}>
      {toasts.map((t) => {
        const k = CONF[t.type] || CONF.info;
        const Icon = k.Ic;
        return (
          <div
            key={t.id}
            className="toast-in bg-white rounded-lg shadow-[0_8px_30px_rgba(13,31,45,0.16)] border border-line flex items-start gap-3 pl-4 pr-3.5 py-3.5"
            style={{ borderLeft: `4px solid ${k.bar}` }}
          >
            <span className="mt-0.5 shrink-0" style={{ color: k.c }}>
              <Icon size={16} />
            </span>
            <div className="text-[13px] text-text leading-snug flex-1">{t.text}</div>
          </div>
        );
      })}
    </div>
  );
}
