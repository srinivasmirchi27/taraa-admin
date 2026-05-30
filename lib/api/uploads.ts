import { request, uploadFile } from "./client";
import type { UploadResult } from "./types";

export const uploads = {
  image: (file: File) =>
    uploadFile("/uploads/image", file) as Promise<UploadResult>,

  profileImage: (file: File) =>
    uploadFile("/uploads/profile-image", file) as Promise<UploadResult>,

  delete: (publicId: string) =>
    request<{ message: string }>(
      `/uploads/${encodeURIComponent(publicId)}`,
      { method: "DELETE" },
    ),
};
