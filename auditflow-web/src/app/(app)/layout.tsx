"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { RequireAuth } from "@/components/auth/require-auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth allow={["ADMIN", "AUDITOR"]}>
      <div className="flex" style={{ minHeight: "100vh" }}>
        <Sidebar />
        <main className="flex-1 min-w-0 bg-paper">
          <div style={{ minWidth: 1280 }}>{children}</div>
        </main>
      </div>
    </RequireAuth>
  );
}
