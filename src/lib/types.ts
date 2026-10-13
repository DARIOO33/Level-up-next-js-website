export type Variant = { id: string; title: string; price: number; stock: number; image: string };

export type Product = {
  id: string;
  slug: string | null;
  name: string;
  description: string;
  featured: boolean;
  category: string;
  subCategory: string | null;
  images: string[];
  variants: Variant[];
  specifications: Record<string, string>;
  createdAt: string | null;
};

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderCustomer = { fullname: string; email: string; phone: string; address: string };
export type OrderItem = {
  id: string;
  product: string;
  variantID: string;
  quantity: number;
  productName: string;
  variantName: string;
  variantImage: string | null;
};
export type Order = {
  id: string;
  customer: OrderCustomer;
  items: OrderItem[];
  totalAmount: number;
  couponCode: string | null;
  status: OrderStatus;
  createdAt: string | null;
  updatedAt: string | null;
};

export type Review = {
  id: string;
  name: string | null;
  showName: boolean;
  rating: number | null;
  comment: string | null;
  source: string;
  productName: string | null;
  productId: string | null;
  orderId: string | null;
  token: string | null;
  isApproved: boolean;
  createdAt: string | null;
};

export type Coupon = {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string | null;
};

export type Activity = { id: string; user: string; label: string; content: string; createdAt: string | null };
export type ContactMessage = { id: string; name: string; email: string; message: string; isRead: boolean; createdAt: string | null };
export type Settings = { brands: string[]; deliveryPaused: boolean; deliveryNotice: string };

export type Address = {
  id: string;
  label: string;
  fullname: string;
  phone: string;
  address: string;
  governorate: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string | null;
};

export type Role = 'user' | 'admin' | 'owner';
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  phoneNumber: string | null;
};
export type AdminUser = SessionUser & { authProvider: string; createdAt: string | null; orderCount: number };

export type Audience = {
  registeredCount: number;
  guestCount: number;
  subscriberCount: number;
  totalCount: number;
  noOrdersCount: number;
  singleOrderCount: number;
  returningCount: number;
  loyalCount: number;
};

/** Every server action answers with this shape, so the UI never has to catch. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; message: string; code?: string };

export type CartItem = {
  productId: string;
  productSlug: string | null;
  variantId: string;
  name: string;
  variantName: string;
  price: number;
  image: string;
  quantity: number;
};
