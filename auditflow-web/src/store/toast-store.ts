"use client";

/* Store mínimo de toasts (independente de dados de domínio). */

import { useSyncExternalStore } from "react";
import type { Toast, ToastType } from "@/types";

let toasts: Toast[] = [];
let seq = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function pushToast(type: ToastType, text: string) {
  const id = ++seq;
  toasts = [...toasts.slice(-2), { id, type, text }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 3200);
}

const EMPTY: Toast[] = [];

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => toasts,
    () => EMPTY
  );
}
