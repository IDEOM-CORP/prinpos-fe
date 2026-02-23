// Application routes configuration

export const ROUTES = {
  // Auth
  LOGIN: "/login",

  // Dashboard
  DASHBOARD: "/",

  // Cashier
  CASHIER: "/cashier",

  // Production
  PRODUCTION: "/production",

  // Orders
  ORDERS: "/orders",
  ORDER_DETAIL: "/orders/:id",
  ORDER_INVOICE: "/orders/:id/invoice",
  CREATE_ORDER: "/create-order",

  // Categories
  CATEGORIES: "/categories",

  // Customers
  CUSTOMERS: "/customers",

  // Items
  ITEMS: "/items",

  // Finishing
  FINISHING: "/finishing",
  FINISHING_ADD: "/finishing/add",
  FINISHING_EDIT: "/finishing/edit/:id",

  // Material
  MATERIAL: "/material",
  MATERIAL_ADD: "/material/add",
  MATERIAL_EDIT: "/material/edit/:id",

  // Users
  USERS: "/users",

  // Organization
  ORGANIZATIONS: "/organizations",
  BRANCHES: "/branches",

  // Reports
  REPORTS: "/reports",
  SHIFT_REPORT: "/shift-report",

  // Profile
  PROFILE: "/profile",

  // Admin (Internal)
  ADMIN_LOGIN: "/admin/login",
  ADMIN_DASHBOARD: "/admin",
  ADMIN_ORGANIZATIONS: "/admin/organizations",
  ADMIN_USERS: "/admin/users",
  ADMIN_BRANCHES: "/admin/branches",
} as const;

export type RouteKeys = keyof typeof ROUTES;
