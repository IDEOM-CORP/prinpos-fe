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

  // Categories
  CATEGORIES: "/categories",

  // Customers
  CUSTOMERS: "/customers",

  // Items
  ITEMS: "/items",

  // Users
  USERS: "/users",

  // Organization
  ORGANIZATIONS: "/organizations",
  BRANCHES: "/branches",

  // Reports
  REPORTS: "/reports",

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
