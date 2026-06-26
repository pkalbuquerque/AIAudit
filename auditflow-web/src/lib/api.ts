import axios from "axios";

/* Cliente HTTP do backend auditflow-api (Spring Boot).
   Configure NEXT_PUBLIC_API_URL no .env.local — ex.: http://localhost:8080 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

export const TOKEN_KEY = "auditflow_token";
export const USER_KEY = "auditflow_user";

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      const isAuthCall = String(error.config?.url ?? "").includes("/api/auth/");
      // 401 → sessão inválida/expirada: limpa e volta para o login
      if (status === 401 && !isAuthCall && !window.location.pathname.startsWith("/login")) {
        clearSession();
        window.location.href = "/login";
      }
      // 403 → sem permissão: o backend já bloqueou; a UI trata via toast (error-handler)
    }
    return Promise.reject(error);
  }
);

export default api;
