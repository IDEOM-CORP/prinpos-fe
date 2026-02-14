// Shared TypeScript types and interfaces

export type UserRole =
  | "owner"
  | "kasir"
  | "produksi"
  | "designer"
  | "superadmin";

export type OrderStatus =
  | "draft"
  | "awaiting_payment"
  | "pending_dp"
  | "ready_production"
  | "in_progress"
  | "completed"
  | "settled"
  | "cancelled"
  | "expired";

export type BranchType = "outlet" | "produksi";

export type PaymentType = "full" | "dp" | "installment";

export type PaymentStatus = "unpaid" | "partial" | "paid";

export type DpStatus = "none" | "insufficient" | "sufficient" | "paid";

export interface StatusLog {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null; // null = initial creation
  toStatus: OrderStatus;
  changedBy: string; // userId
  note?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  method: string; // cash, transfer, qris, e-wallet
  note?: string;
  paidBy: string; // userId
  createdAt: string;
}

export type PricingModel = "fixed" | "area" | "tiered";

export interface TierPrice {
  minQty: number;
  maxQty: number | null; // null = unlimited
  price: number;
}

export type FinishingPricingType = "per_unit" | "per_area" | "flat";

export interface FinishingOption {
  id: string;
  name: string;
  price: number; // additional price
  pricingType: FinishingPricingType; // per_unit = per pcs, per_area = per m², flat = one-time
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  branchId: string;
  businessId: string;
  phone?: string;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  createdAt: string;

  // Business settings
  taxEnabled?: boolean; // PPN enabled (default false)
  taxRate?: number; // Tax rate decimal (e.g. 0.11 = 11%)
}

export interface Branch {
  id: string;
  name: string;
  type: BranchType;
  businessId: string;
  address: string;
  phone: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  businessId: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  company?: string; // nama perusahaan / instansi
  notes?: string;
  businessId: string;
  createdAt: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  businessId: string;
  createdAt: string;

  // Identity
  sku?: string; // unique product code / SKU

  // Pricing
  pricingModel: PricingModel;
  price: number; // base price (fixed: per unit, area: per m²)
  pricePerSqm?: number; // alias for area pricing (backward compat)
  tiers?: TierPrice[]; // tiered pricing tiers
  costPrice?: number; // harga modal / cost price for margin calc

  // Unit & measurement
  unit: string; // 'pcs', 'box', 'lembar', 'meter', 'paket', etc.
  areaUnit?: "m" | "cm"; // meter or centimeter for area-based
  defaultWidth?: number; // default width for area-based (template)
  defaultHeight?: number; // default height for area-based (template)

  // Finishing add-ons (available options for this product)
  finishingOptions?: FinishingOption[];

  // Material options (available for this product)
  materialOptions?: string[];

  // Order constraints
  minOrder?: number; // minimum order qty
  setupFee?: number; // one-time setup/design fee

  // Pricing controls
  maxDiscount?: number; // max discount % allowed (0-100)

  // Production
  productionDays?: number; // estimated production days
  notes?: string; // internal notes for production team

  // Status
  isActive: boolean;
}

export interface OrderItem {
  itemId: string;
  name: string;
  category: string;

  // Dimensions (for area-based pricing)
  width?: number; // Panjang (P) in meters
  height?: number; // Lebar (L) in meters
  area?: number; // P × L calculated

  // Material & Options
  material?: string;
  finishing?: string[];

  // Pricing
  pricePerSqm?: number; // Price per m² (for area-based)
  originalPrice: number; // Original catalog price before discount
  price: number; // Final unit price (after discount)
  discountPercent?: number; // Manual discount % applied (0-100)
  quantity: number; // How many pieces/units
  subtotal: number; // price × quantity (or area × pricePerSqm × quantity)

  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;

  // Payment tracking
  paymentType: PaymentType; // full, dp, installment
  paymentStatus: PaymentStatus; // unpaid, partial, paid
  dpStatus: DpStatus; // none, insufficient, sufficient, paid
  downPayment: number; // Amount paid upfront (DP)
  remainingPayment: number; // Sisa tagihan
  paidAmount: number; // Total yang sudah dibayar
  paymentMethod?: string; // cash, transfer, e-wallet
  minDpPercent: number; // minimum DP % required (default 50)
  payments: PaymentRecord[]; // Payment history records

  // Production & Delivery
  deadline?: string; // Target completion date
  deliveryDate?: string; // Actual delivery date

  status: OrderStatus;
  statusLogs: StatusLog[]; // Log of all status changes
  branchId: string;
  businessId: string;
  createdBy: string;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  settledAt?: string; // When order was fully paid & settled
  settledBy?: string; // User who confirmed settlement

  // Soft delete
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface CartItem {
  item: Item;
  quantity: number;

  // Custom dimensions (for area-based items)
  width?: number;
  height?: number;
  area?: number;

  // Material & Options
  material?: string;
  finishing?: string[];

  notes?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
