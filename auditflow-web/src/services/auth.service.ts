import api from "@/lib/api";
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

  changePassword: (data: ChangePasswordRequest): Promise<void> =>
    api.post("/api/auth/change-password", data).then((r) => r.data),

  forgotPassword: (data: ForgotPasswordRequest): Promise<void> =>
    api.post("/api/auth/forgot-password", data).then((r) => r.data),

  tokenInfo: (token: string): Promise<TokenInfoResponse> =>
    api
      .get("/api/auth/token-info", { params: { token } })
      .then((r) => r.data),

  resetPassword: (data: ResetPasswordRequest): Promise<void> =>
    api.post("/api/auth/reset-password", data).then((r) => r.data),
};
