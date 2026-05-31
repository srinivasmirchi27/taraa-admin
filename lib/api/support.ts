import { request } from "./client";
import type {
  SupportTicket,
  SupportTicketFilters,
  SupportStats,
  UpdateTicketDto,
  ReplyTicketDto,
  PaginatedResponse,
} from "./types";

function buildQs(filters: SupportTicketFilters): string {
  const merged = { page: 1, limit: 20, ...filters };
  return new URLSearchParams(
    Object.entries(merged)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();
}

export const support = {
  list: (filters: SupportTicketFilters = {}) =>
    request<PaginatedResponse<SupportTicket>>(`/support?${buildQs(filters)}`),

  getById: (id: string) =>
    request<SupportTicket>(`/support/${id}`),

  stats: () =>
    request<SupportStats>("/support/admin/stats"),

  reply: (id: string, data: ReplyTicketDto) =>
    request<SupportTicket>(`/support/${id}/reply`, { method: "POST", body: data }),

  update: (id: string, data: UpdateTicketDto) =>
    request<SupportTicket>(`/support/${id}`, { method: "PATCH", body: data }),
};
