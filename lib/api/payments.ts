import { request } from "./client";
import type { RazorpayInitResponse, OrderItem, ShippingAddress } from "./types";

export interface InitiatePaymentDto {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  currency?: string;
}

export interface VerifyPaymentDto {
  appOrderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  order: {
    _id: string;
    orderNumber: string;
    isPaid: boolean;
    razorpayPaymentId: string;
    paidAt: string;
  };
}

export const payments = {
  initiate: (data: InitiatePaymentDto) =>
    request<RazorpayInitResponse>("/payments/initiate", {
      method: "POST",
      body: data,
    }),

  verify: (data: VerifyPaymentDto) =>
    request<VerifyPaymentResponse>("/payments/verify", {
      method: "POST",
      body: data,
    }),

  refund: (paymentId: string, amount?: number) =>
    request<unknown>(`/payments/refund/${paymentId}`, {
      method: "POST",
      body: amount !== undefined ? { amount } : {},
    }),
};
