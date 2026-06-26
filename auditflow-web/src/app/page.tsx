"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homeFor, useAuth } from "@/contexts/auth-context";

export default function Home() {
  const { ready, isAuthenticated, perfil } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (isAuthenticated && perfil) router.replace(homeFor(perfil));
    else router.replace("/login");
  }, [ready, isAuthenticated, perfil, router]);

  return null;
}
