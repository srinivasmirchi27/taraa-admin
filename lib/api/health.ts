import { request } from "./client";

export const health = {
  check: () =>
    request<{ status: string; timestamp: string; service: string }>(
      "/health",
      { auth: false },
    ),
};
