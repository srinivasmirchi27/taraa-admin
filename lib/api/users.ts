import { request } from "./client";
import type { User, UserRole, PaginatedResponse } from "./types";

export const users = {
  me: () => request<User>("/users/me"),

  updateMe: (data: Partial<Pick<User, "name" | "phone" | "address">>) =>
    request<User>("/users/me", { method: "PATCH", body: data }),

  list: (page = 1, limit = 20) =>
    request<PaginatedResponse<User>>(`/users?page=${page}&limit=${limit}`),

  getById: (id: string) => request<User>(`/users/${id}`),

  updateRole: (id: string, role: UserRole) =>
    request<User>(`/users/${id}/role`, { method: "PATCH", body: { role } }),

  delete: (id: string) => request<null>(`/users/${id}`, { method: "DELETE" }),
};
