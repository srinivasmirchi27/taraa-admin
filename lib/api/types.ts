// --- Shared ---

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

// --- Auth ---

export type UserRole = "customer" | "admin" | "super_admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profileImage?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser;
}

// --- Users ---

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  isActive: boolean;
  phoneVerified: boolean;
  profileImage?: string | null;
  createdAt: string;
}

// --- Products ---

export interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  images: string[];
  badge?: string;
  description: string;
  inStock: boolean;
  rating: number;
  reviews: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  createdAt: string;
}

// --- Orders ---

export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentMethod = "COD" | "online";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  razorpayPaymentId?: string;
  paidAt?: string;
  createdAt: string;
}

// --- Payments ---

export interface RazorpayInitResponse {
  appOrderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  prefill: { name: string; contact: string };
}

// --- Categories ---

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export type CreateCategoryDto = Omit<Category, "_id" | "createdAt">;
export type UpdateCategoryDto = Partial<CreateCategoryDto>;

// --- Uploads ---

export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}
