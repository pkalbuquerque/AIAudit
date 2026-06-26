import api from "@/lib/api";
import type {
  CreateUserRequest,
  UpdateProfileRequest,
  UserResponse,
  UserUpdateRequest,
} from "@/types/api";

export const usersService = {
  me: (): Promise<UserResponse> => api.get("/api/users/me").then((r) => r.data),

  updateMe: (data: UpdateProfileRequest): Promise<UserResponse> =>
    api.patch("/api/users/me", data).then((r) => r.data),

  list: (): Promise<UserResponse[]> => api.get("/api/users").then((r) => r.data),

  get: (id: string): Promise<UserResponse> => api.get(`/api/users/${id}`).then((r) => r.data),

  invite: (data: CreateUserRequest): Promise<UserResponse> =>
    api.post("/api/users/invite", data).then((r) => r.data),

  update: (id: string, data: UserUpdateRequest): Promise<UserResponse> =>
    api.patch(`/api/users/${id}`, data).then((r) => r.data),

  deactivate: (id: string): Promise<void> =>
    api.patch(`/api/users/${id}/deactivate`).then((r) => r.data),
};
