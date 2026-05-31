import { request, formRequest } from "./client";
import type { Product, PaginatedResponse, BulkProductInput, BulkUploadResult } from "./types";

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  inStock?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  sort?: "price_asc" | "price_desc" | "popular" | "newest";
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

  bulkUpload: (productList: BulkProductInput[], images: (File | null)[]) => {
    const form = new FormData();
    form.append("products", JSON.stringify(productList));
    images.forEach((file, i) => {
      if (file) form.append(`images[${i}]`, file);
    });
    return formRequest<BulkUploadResult>("/products/bulk", form);
  },

  appendImages: (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append("images", f));
    return formRequest<Product>(`/products/${id}/images`, form);
  },
};
