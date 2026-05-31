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

// --- Bulk Upload ---

export interface BulkProductInput {
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  discount: number;
  description: string;
  image?: string;
  inStock?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
}

export interface BulkUploadResult {
  summary: { total: number; created: number; failed: number };
  created: Product[];
  failed: { index: number; name: string; error: string }[];
}

// --- Banners ---

export type BannerType = "hero" | "promotional" | "announcement" | "sale";

export interface Banner {
  _id: string;
  type: BannerType;
  title: string;
  subtitle?: string;
  image: string;
  cloudinaryPublicId?: string;
  isActive: boolean;
  sortOrder: number;
  startDate?: string;
  endDate?: string;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
  createdAt: string;
}

export interface CreateBannerDto {
  title: string;
  type: BannerType;
  subtitle?: string;
  isActive?: boolean;
  sortOrder?: number;
  startDate?: string;
  endDate?: string;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
  file?: File;
}

export type UpdateBannerDto = Partial<Omit<CreateBannerDto, "file">>;

// --- Support Tickets ---

export type TicketStatus   = "open" | "in_progress" | "resolved" | "closed";
export type TicketCategory = "order" | "payment" | "product" | "shipping" | "return" | "other";
export type TicketPriority = "low" | "medium" | "high";
export type ReplySentBy    = "customer" | "admin" | "guest";

export interface SupportReply {
  _id: string;
  message: string;
  sentBy: ReplySentBy;
  senderName: string;
  createdAt: string;
}

export interface SupportTicket {
  _id: string;
  ticketNumber: string;
  subject: string;
  message: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  orderNumber?: string;
  guestName?: string;
  guestEmail?: string;
  userId?: { _id: string; name: string; email: string } | null;
  replies: SupportReply[];
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketFilters {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  search?: string;
}

export interface SupportStats {
  total: number;
  byStatus:   Record<TicketStatus,   number>;
  byCategory: Record<TicketCategory, number>;
  byPriority: Record<TicketPriority, number>;
}

export interface UpdateTicketDto {
  status?: TicketStatus;
  priority?: TicketPriority;
}

export interface ReplyTicketDto {
  message: string;
}

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
