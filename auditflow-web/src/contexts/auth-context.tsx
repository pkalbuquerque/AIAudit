"use client";

/* ============================================================
   Autenticação real — token JWT do auditflow-api.
   Token em localStorage (auditflow_token) + usuário (auditflow_user).
   A proteção de rota é client-side (ver <RequireAuth/>): como o token
   vive em localStorage (sem cookie no MVP), o middleware do Next não
   consegue lê-lo no servidor.
   ============================================================ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { clearSession, setAuthToken, TOKEN_KEY, USER_KEY } from "@/lib/api";
import type { AuthResponse, Perfil, UserResponse } from "@/types/api";

interface AuthContextValue {
  user: UserResponse | null;
  token: string | null;
  /** true depois de hidratar do localStorage (evita flash de redirect) */
  ready: boolean;
  isAuthenticated: boolean;
  perfil: Perfil | null;
  login: (email: string, senha: string) => Promise<AuthResponse>;
  logout: () => void;
  /** Atualiza o usuário em memória + localStorage (ex.: após editar o próprio perfil). */
  updateUser: (user: UserResponse) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  ready: false,
  isAuthenticated: false,
  perfil: null,
  login: async () => {
    throw new Error("AuthProvider ausente");
  },
  logout: () => {},
  updateUser: () => {},
});

function jwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    ) as { exp?: number };
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

/** Rota inicial de cada perfil após o login. */
export function homeFor(perfil: Perfil): string {
  return perfil === "CLIENTE" ? "/portal" : "/dashboard";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedToken = window.localStorage.getItem(TOKEN_KEY);
    const savedUser = window.localStorage.getItem(USER_KEY);
    if (savedToken && savedUser && !jwtExpired(savedToken)) {
      try {
        setUser(JSON.parse(savedUser) as UserResponse);
        setToken(savedToken);
      } catch {
        clearSession();
      }
    } else if (savedToken || savedUser) {
      clearSession();
    }
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const res = await authService.login({ email, senha });
    setAuthToken(res.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(res.usuario));
    setToken(res.token);
    setUser(res.usuario);
    return res;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const updateUser = useCallback((u: UserResponse) => {
    window.localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        ready,
        isAuthenticated: !!token && !!user,
        perfil: user?.perfil ?? null,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
