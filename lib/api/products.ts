import { request } from "./client";
import type { Product, PaginatedResponse } from "./types";

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  inStock?: boolean;
}

export type CreateProductDto = Omit<Product, "_id" | "createdAt">;
export type UpdateProductDto = Partial<CreateProductDto>;

export const products = {
  list: (filters: ProductFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined) params.set(k, String(v));
    });
    const qs = params.toString();
    return request<PaginatedResponse<Product>>(
      `/products${qs ? `?${qs}` : ""}`,
      { auth: false },
    );
  },

  categories: () =>
    request<string[]>("/products/categories", { auth: false }),

  getById: (id: string) =>
    request<Product>(`/products/${id}`, { auth: false }),

  create: (data: CreateProductDto) =>
    request<Product>("/products", { method: "POST", body: data }),

  update: (id: string, data: UpdateProductDto) =>
    request<Product>(`/products/${id}`, { method: "PATCH", body: data }),

  delete: (id: string) =>
    request<null>(`/products/${id}`, { method: "DELETE" }),
};
