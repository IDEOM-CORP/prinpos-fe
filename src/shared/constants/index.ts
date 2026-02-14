// Application constants

export const APP_NAME = "PrinPOS";
export const APP_VERSION = "1.0.0";

// API Configuration (dummy)
export const API_BASE_URL = "http://localhost:3000/api";

// Default pagination
export const DEFAULT_PAGE_SIZE = 10;

// Order statuses (new flow)
export const ORDER_STATUSES = {
  DRAFT: "draft",
  AWAITING_PAYMENT: "awaiting_payment",
  PENDING_DP: "pending_dp",
  READY_PRODUCTION: "ready_production",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  SETTLED: "settled",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const;

// Order status labels (Indonesian)
export const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  awaiting_payment: "Menunggu Pembayaran",
  pending_dp: "Menunggu DP",
  ready_production: "Siap Produksi",
  in_progress: "Proses",
  completed: "Selesai",
  settled: "Lunas",
  cancelled: "Dibatalkan",
  expired: "Expired",
};

// Order status colors for badges
export const ORDER_STATUS_COLORS: Record<string, string> = {
  draft: "gray",
  awaiting_payment: "yellow",
  pending_dp: "orange",
  ready_production: "aqua",
  in_progress: "indigo",
  completed: "teal",
  settled: "green",
  cancelled: "red",
  expired: "dark",
};

// Valid status transitions (from → allowed to[])
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["pending_dp", "ready_production", "settled", "cancelled"],
  pending_dp: ["ready_production", "cancelled", "expired"],
  ready_production: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: ["settled", "cancelled"],
  settled: [], // terminal
  cancelled: [], // terminal
  expired: ["pending_dp"], // can be revived by paying DP
};

// Expired order threshold in hours
export const EXPIRED_THRESHOLD_HOURS = 48; // 2 days without DP

// User roles
export const USER_ROLES = {
  OWNER: "owner",
  KASIR: "kasir",
  PRODUKSI: "produksi",
  DESIGNER: "designer",
} as const;

// Role labels
export const USER_ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  kasir: "Kasir",
  produksi: "Produksi",
  designer: "Designer",
};

// Branch types
export const BRANCH_TYPES = {
  OUTLET: "outlet",
  PRODUKSI: "produksi",
} as const;

// Item categories
export const ITEM_CATEGORIES = [
  "Banner",
  "Spanduk",
  "Stiker",
  "Kartu Nama",
  "Brosur",
  "Poster",
  "X-Banner",
  "Roll Banner",
  "Neon Box",
  "Letter Timbul",
];

// Unsplash images for dummy data
export const DUMMY_IMAGES = {
  banner: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
  spanduk: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
  stiker: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400",
  kartuNama:
    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400",
  brosur: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400",
  poster: "https://images.unsplash.com/photo-1543487945-139a97f387d5?w=400",
  xBanner: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
  rollBanner: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
  neonBox: "https://images.unsplash.com/photo-1534802046520-4f27db7f3ae5?w=400",
  letterTimbul:
    "https://images.unsplash.com/photo-1565106430482-8f6e74349ca1?w=400",
};

// Default tax rate (fallback when business has no taxRate set)
export const DEFAULT_TAX_RATE = 0.11; // 11% PPN

// Minimum DP percentage (default threshold for production readiness)
export const MIN_DP_PERCENT = 50; // 50% minimum DP

// Quick DP percentage options for cashier
export const DP_QUICK_OPTIONS = [30, 50, 75] as const;

// Payment types
export const PAYMENT_TYPES = {
  FULL: "full",
  DP: "dp",
  INSTALLMENT: "installment",
} as const;

// Payment statuses
export const PAYMENT_STATUSES = {
  UNPAID: "unpaid",
  PARTIAL: "partial",
  PAID: "paid",
} as const;

// Pricing models
export const PRICING_MODELS = {
  FIXED: "fixed", // Fixed price per unit (e.g., business cards)
  AREA: "area", // Price per m² (e.g., banner, spanduk)
  TIERED: "tiered", // Tiered pricing by quantity (e.g., brosur bulk)
} as const;

// Unit options
export const UNIT_OPTIONS = [
  "pcs",
  "lembar",
  "box",
  "rim",
  "paket",
  "meter",
  "roll",
  "set",
];

// Area unit options
export const AREA_UNIT_OPTIONS = [
  { value: "m", label: "Meter (m²)" },
  { value: "cm", label: "Centimeter (cm²)" },
];

// Material options for digital printing
export const MATERIALS = [
  "MMT",
  "Flexi Korea",
  "Flexi China",
  "Vinyl",
  "Albatros",
  "One Way Vision",
  "Backlit",
  "Luster",
  "Art Paper",
  "HVS",
];

// Finishing options
export const FINISHING_OPTIONS = [
  "Laminating Glossy",
  "Laminating Doff",
  "Cutting",
  "Mata Ayam",
  "Tali",
  "Standing",
  "Pole",
];

// Finishing pricing types
export const FINISHING_PRICING_TYPES = [
  { value: "per_unit", label: "Per Unit" },
  { value: "per_area", label: "Per m²" },
  { value: "flat", label: "Flat (sekali)" },
] as const;

// Date filter presets for order list
export const DATE_FILTER_OPTIONS = [
  { value: "all", label: "Semua Waktu" },
  { value: "today", label: "Hari Ini" },
  { value: "yesterday", label: "Kemarin" },
  { value: "this_week", label: "Minggu Ini" },
  { value: "this_month", label: "Bulan Ini" },
] as const;
