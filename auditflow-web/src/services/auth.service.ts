import api, { setAuthToken } from "@/lib/api";
import type {
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  TokenInfoResponse,
} from "@/types/api";

export const authService = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    api.post("/api/auth/login", data).then((r) => r.data),

  register: (data: RegisterRequest): Promise<AuthResponse> =>
    api.post("/api/auth/register", data).then((r) => r.data),

  /** Troca a senha; o backend revoga as sessões antigas e devolve um token novo — guardamos-o. */
  changePassword: (data: ChangePasswordRequest): Promise<AuthResponse> =>
    api.post("/api/auth/change-password", data).then((r) => {
      if (r.data?.token) setAuthToken(r.data.token);
      return r.data;
    }),

  /** "Sair de todos os dispositivos": revoga tokens e renova o da sessão atual. */
  logoutAll: (): Promise<AuthResponse> =>
    api.post("/api/auth/logout-all").then((r) => {
      if (r.data?.token) setAuthToken(r.data.token);
      return r.data;
    }),

  forgotPassword: (data: ForgotPasswordRequest): Promise<void> =>
    api.post("/api/auth/forgot-password", data).then((r) => r.data),

  tokenInfo: (token: string): Promise<TokenInfoResponse> =>
    api
      .get("/api/auth/token-info", { params: { token } })
      .then((r) => r.data),

  resetPassword: (data: ResetPasswordRequest): Promise<void> =>
    api.post("/api/auth/reset-password", data).then((r) => r.data),

  /** Confirma o e-mail do registro a partir do token do link. */
  verifyEmail: (token: string): Promise<void> =>
    api.post("/api/auth/verify-email", { token }).then((r) => r.data),

  /** Reenvia o e-mail de verificação (resposta sempre genérica). */
  resendVerification: (email: string): Promise<void> =>
    api.post("/api/auth/resend-verification", { email }).then((r) => r.data),
};
