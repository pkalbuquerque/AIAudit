"use client";

import { cloneElement, forwardRef, type ReactElement } from "react";
import { cn } from "@/lib/utils";
import { I } from "./icons";

export function FormField({
  label,
  required,
  hint,
  children,
  className = "",
}: {
  label?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="flex items-center justify-between text-[11px] tracking-[0.14em] uppercase text-sub mb-1.5">
          <span>
            {label}
            {required && <span className="text-rust ml-0.5">*</span>}
          </span>
          {hint && (
            <span className="text-[10px] normal-case tracking-normal text-sub/80">{hint}</span>
          )}
        </label>
      )}
      {children}
    </div>
  );
}

export const TextField = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { icon?: ReactElement }
>(function TextField({ icon, className, ...props }, ref) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sub">
          {cloneElement(icon, { size: 14 })}
        </span>
      )}
      <input
        ref={ref}
        {...props}
        className={cn(
          "w-full h-11 pr-3 rounded-md border border-line bg-white text-[13px] placeholder:text-sub outline-none focus:border-mint focus:ring-2 focus:ring-mint/20 transition-shadow",
          icon ? "pl-9" : "pl-3",
          className
        )}
      />
    </div>
  );
});

export const SelectField = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { options?: string[] }
>(function SelectField({ options, className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        {...props}
        className={cn(
          "w-full h-11 pl-3 pr-9 rounded-md border border-line bg-white text-[13px] text-text outline-none focus:border-mint focus:ring-2 focus:ring-mint/20 appearance-none cursor-pointer",
          className
        )}
      >
        {options
          ? options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))
          : children}
      </select>
      <I.chevD
        size={13}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none"
      />
    </div>
  );
});

export function Toggle({
  on,
  onChange,
  size = "md",
}: {
  on: boolean;
  onChange?: (next: boolean) => void;
  size?: "sm" | "md";
}) {
  const w = size === "sm" ? 36 : 42;
  const h = size === "sm" ? 20 : 24;
  const k = h - 6;
  return (
    <button
      onClick={() => onChange && onChange(!on)}
      type="button"
      className="relative rounded-full transition-colors shrink-0"
      style={{ width: w, height: h, background: on ? "#00C896" : "#D5DBE2" }}
    >
      <span
        className="absolute top-[3px] rounded-full bg-white shadow-sm transition-all"
        style={{ width: k, height: k, left: on ? w - k - 3 : 3 }}
      />
    </button>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  sub,
}: {
  checked: boolean;
  onChange?: (next: boolean) => void;
  label: string;
  sub?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange && onChange(!checked)}
      className="flex items-start gap-3 text-left w-full group"
    >
      <span
        className={`mt-0.5 w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center shrink-0 transition-colors ${
          checked ? "bg-ink-900 border-ink-900" : "bg-white border-line group-hover:border-ink-800/50"
        }`}
      >
        {checked && <I.check size={12} className="text-white" />}
      </span>
      <span className="leading-tight">
        <span className="text-[13px] text-text">{label}</span>
        {sub && <span className="block text-[11.5px] text-sub mt-0.5">{sub}</span>}
      </span>
    </button>
  );
}

export function SegTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 bg-paper border border-line rounded-md p-1">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-3.5 h-8 rounded text-[12.5px] transition-colors ${
            active === t
              ? "bg-white text-text shadow-sm border border-line"
              : "text-sub hover:text-text"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function FormSection({ title, className = "" }: { title: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 mb-3 ${className}`}>
      <span className="text-[11px] tracking-[0.16em] uppercase text-ink-900 font-semibold">
        {title}
      </span>
      <span className="flex-1 h-px bg-line" />
    </div>
  );
}
