import { request, formRequest, patchFormRequest } from "./client";
import type { Banner, BannerType, CreateBannerDto, UpdateBannerDto } from "./types";

function buildCreateForm(data: CreateBannerDto): FormData {
  const form = new FormData();
  form.append("title", data.title);
  form.append("type", data.type);
  form.append("isActive", String(data.isActive ?? true));
  form.append("sortOrder", String(data.sortOrder ?? 0));
  if (data.subtitle)  form.append("subtitle",  data.subtitle);
  if (data.badge)     form.append("badge",     data.badge);
  if (data.ctaText)   form.append("ctaText",   data.ctaText);
  if (data.ctaLink)   form.append("ctaLink",   data.ctaLink);
  if (data.startDate) form.append("startDate", data.startDate);
  if (data.endDate)   form.append("endDate",   data.endDate);
  if (data.file)      form.append("image",     data.file);
  return form;
}

export const banners = {
  // Admin — all banners (including inactive)
  adminList: (type?: BannerType) => {
    const qs = type ? `?type=${type}` : "";
    return request<Banner[]>(`/banners/admin/all${qs}`);
  },

  // Public — active banners only
  list: (type?: BannerType) => {
    const qs = type ? `?type=${type}` : "";
    return request<Banner[]>(`/banners${qs}`, { auth: false });
  },

  getById: (id: string) =>
    request<Banner>(`/banners/${id}`, { auth: false }),

  // Create — multipart/form-data (image + fields)
  create: (data: CreateBannerDto) =>
    formRequest<Banner>("/banners", buildCreateForm(data)),

  // Update fields — JSON
  update: (id: string, data: UpdateBannerDto) =>
    request<Banner>(`/banners/${id}`, { method: "PATCH", body: data }),

  // Replace image only — multipart PATCH
  replaceImage: (id: string, file: File) => {
    const form = new FormData();
    form.append("image", file);
    return patchFormRequest<Banner>(`/banners/${id}/image`, form);
  },

  // Toggle isActive shorthand
  toggleActive: (id: string, isActive: boolean) =>
    request<Banner>(`/banners/${id}`, { method: "PATCH", body: { isActive } }),

  delete: (id: string) =>
    request<null>(`/banners/${id}`, { method: "DELETE" }),
};
