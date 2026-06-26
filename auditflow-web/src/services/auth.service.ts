import api from "@/lib/api";
import type {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
} from "@/types/api";

export const authService = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    api.post("/api/auth/login", data).then((r) => r.data),

  register: (data: RegisterRequest): Promise<AuthResponse> =>
    api.post("/api/auth/register", data).then((r) => r.data),

  changePassword: (data: ChangePasswordRequest): Promise<void> =>
    api.post("/api/auth/change-password", data).then((r) => r.data),
};
