"use client";

import { RequireAuth } from "@/components/auth/require-auth";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth allow={["CLIENTE"]}>{children}</RequireAuth>;
}
