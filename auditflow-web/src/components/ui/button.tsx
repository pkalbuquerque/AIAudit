"use client";

import { cloneElement, type ReactElement } from "react";
import { cn } from "@/lib/utils";

export type BtnKind = "primary" | "accent" | "ghost" | "danger" | "subtle" | "link";

export function Btn({
  kind = "ghost",
  icon,
  children,
  onClick,
  size = "md",
  className = "",
  type = "button",
  disabled,
}: {
  kind?: BtnKind;
  icon?: ReactElement;
  children?: React.ReactNode;
  onClick?: () => void;
  size?: "sm" | "md";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const sz = size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-10 px-4 text-[13px]";
  const styles: Record<BtnKind, string> = {
    primary: "bg-ink-900 text-white hover:bg-ink-800",
    accent: "bg-mint text-ink-900 hover:brightness-[0.96] font-semibold",
    ghost: "bg-white border border-line text-text hover:bg-paper",
    danger: "bg-rust text-white hover:brightness-95",
    subtle: "bg-paper text-text hover:bg-white border border-line",
    link: "text-ink-900 hover:underline px-0 h-auto",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        sz,
        styles[kind],
        className
      )}
    >
      {icon && cloneElement(icon, { size: 15 })}
      {children}
    </button>
  );
}
