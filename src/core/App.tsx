import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useItemStore } from "../shared/stores/itemStore";
import { useUserStore } from "../shared/stores/userStore";
import { useBusinessStore } from "../shared/stores/businessStore";
import { ROUTES } from "./routes";

// Lazy load pages
import LoginPage from "../features/auth/pages/LoginPage";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import CashierPage from "../features/cashier/pages/CashierPage";
import OrdersPage from "../features/orders/pages/OrdersPage";
import OrderDetailPage from "../features/orders/pages/OrderDetailPage";

import ItemsPage from "../features/items/pages/ItemsPage";
import CategoriesPage from "../features/categories/pages/CategoriesPage";
import CustomersPage from "../features/customers/pages/CustomersPage";
import UsersPage from "../features/users/pages/UsersPage";
import BusinessesPage from "../features/business/pages/BusinessesPage";
import BranchesPage from "../features/business/pages/BranchesPage";
import ReportsPage from "../features/reports/pages/ReportsPage";
import ShiftReportPage from "../features/cashier/pages/ShiftReportPage";
import ProfilePage from "../features/profile/pages/ProfilePage";
import ProtectedRoute from "../shared/components/ProtectedRoute";

// Superadmin pages
import SuperAdminLoginPage from "../features/superadmin/pages/SuperAdminLoginPage";
import SuperAdminDashboardPage from "../features/superadmin/pages/SuperAdminDashboardPage";
import { useCategoryStore } from "../shared/stores/categoryStore";
import { useCustomerStore } from "../shared/stores/customerStore";
import { useOrderStore } from "../shared/stores/orderStore";
import CreateOrderPage from "../features/orders/pages/CreateOrderPage";
import InvoicePage from "../features/orders/pages/InvoicePage";

function App() {
  const initializeItems = useItemStore((state) => state.initializeItems);
  const initializeUsers = useUserStore((state) => state.initializeUsers);
  const initializeBusinessData = useBusinessStore(
    (state) => state.initializeData,
  );
  const initializeCategories = useCategoryStore(
    (state) => state.initializeCategories,
  );
  const initializeCustomers = useCustomerStore(
    (state) => state.initializeCustomers,
  );
  const checkExpiredOrders = useOrderStore((state) => state.checkExpiredOrders);

  useEffect(() => {
    // Initialize dummy data on app start
    initializeItems();
    initializeUsers();
    initializeBusinessData();
    initializeCategories();
    initializeCustomers();

    // Check for expired orders on app start
    checkExpiredOrders();
  }, [
    initializeItems,
    initializeUsers,
    initializeBusinessData,
    initializeCategories,
    initializeCustomers,
    checkExpiredOrders,
  ]);

  return (
    <BrowserRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        {/* Client Routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* Owner-only routes */}
        <Route element={<ProtectedRoute allowedRoles={["owner"]} />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.ITEMS} element={<ItemsPage />} />
          <Route path={ROUTES.CATEGORIES} element={<CategoriesPage />} />
          <Route path={ROUTES.USERS} element={<UsersPage />} />
          <Route path={ROUTES.ORGANIZATIONS} element={<BusinessesPage />} />
          <Route path={ROUTES.BRANCHES} element={<BranchesPage />} />
          <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
          <Route path={ROUTES.SHIFT_REPORT} element={<ShiftReportPage />} />
        </Route>

        {/* Kasir routes */}
        <Route element={<ProtectedRoute allowedRoles={["kasir"]} />}>
          <Route path={ROUTES.CASHIER} element={<CashierPage />} />
        </Route>

        {/* Designer + Owner: create order */}
        <Route
          element={<ProtectedRoute allowedRoles={["designer", "owner"]} />}
        >
          <Route path={ROUTES.CREATE_ORDER} element={<CreateOrderPage />} />
        </Route>

        {/* All client roles: orders, detail, invoice, customers, profile */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["owner", "kasir", "designer"]} />
          }
        >
          <Route path={ROUTES.ORDERS} element={<OrdersPage />} />
          <Route path={ROUTES.ORDER_DETAIL} element={<OrderDetailPage />} />
          <Route path={ROUTES.ORDER_INVOICE} element={<InvoicePage />} />
          <Route path={ROUTES.CUSTOMERS} element={<CustomersPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        </Route>

        {/* Admin Routes */}
        <Route path={ROUTES.ADMIN_LOGIN} element={<SuperAdminLoginPage />} />

        <Route element={<ProtectedRoute isSuperAdmin={true} />}>
          <Route
            path={ROUTES.ADMIN_DASHBOARD}
            element={<SuperAdminDashboardPage />}
          />
          <Route
            path={ROUTES.ADMIN_ORGANIZATIONS}
            element={<BusinessesPage />}
          />
          <Route path={ROUTES.ADMIN_USERS} element={<UsersPage />} />
          <Route path={ROUTES.ADMIN_BRANCHES} element={<BranchesPage />} />
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
