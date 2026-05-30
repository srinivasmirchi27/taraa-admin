import { request } from "./client";
import type {
  Order,
  OrderStatus,
  OrderItem,
  ShippingAddress,
  PaymentMethod,
  PaginatedResponse,
} from "./types";

export interface CreateOrderDto {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
}

export const orders = {
  create: (data: CreateOrderDto) =>
    request<Order>("/orders", { method: "POST", body: data }),

  myOrders: (page = 1, limit = 10) =>
    request<PaginatedResponse<Order>>(
      `/orders/my?page=${page}&limit=${limit}`,
    ),

  getById: (id: string) => request<Order>(`/orders/${id}`),

  list: (page = 1, limit = 20, status?: OrderStatus) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status) params.set("status", status);
    return request<PaginatedResponse<Order>>(`/orders?${params}`);
  },

  updateStatus: (id: string, status: OrderStatus) =>
    request<Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
};
