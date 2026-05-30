import { request } from "./client";
import type { Category, CreateCategoryDto, UpdateCategoryDto } from "./types";

export const categories = {
  list: (all = false) =>
    request<Category[]>(`/categories${all ? "?all=true" : ""}`, { auth: false }),

  getById: (id: string) =>
    request<Category>(`/categories/${id}`, { auth: false }),

  getBySlug: (slug: string) =>
    request<Category>(`/categories/${slug}/by-slug`, { auth: false }),

  create: (data: CreateCategoryDto) =>
    request<Category>("/categories", { method: "POST", body: data }),

  update: (id: string, data: UpdateCategoryDto) =>
    request<Category>(`/categories/${id}`, { method: "PATCH", body: data }),

  delete: (id: string) =>
    request<null>(`/categories/${id}`, { method: "DELETE" }),
};
