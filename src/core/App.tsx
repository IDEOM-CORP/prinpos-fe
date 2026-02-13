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
import ProductionPage from "../features/production/pages/ProductionPage";
import OrdersPage from "../features/orders/pages/OrdersPage";
import OrderDetailPage from "../features/orders/pages/OrderDetailPage";
import ItemsPage from "../features/items/pages/ItemsPage";
import CategoriesPage from "../features/categories/pages/CategoriesPage";
import UsersPage from "../features/users/pages/UsersPage";
import BusinessesPage from "../features/business/pages/BusinessesPage";
import BranchesPage from "../features/business/pages/BranchesPage";
import ReportsPage from "../features/reports/pages/ReportsPage";
import ProfilePage from "../features/profile/pages/ProfilePage";
import ProtectedRoute from "../shared/components/ProtectedRoute";

// Superadmin pages
import SuperAdminLoginPage from "../features/superadmin/pages/SuperAdminLoginPage";
import SuperAdminDashboardPage from "../features/superadmin/pages/SuperAdminDashboardPage";
import { useCategoryStore } from "../shared/stores/categoryStore";

function App() {
  const initializeItems = useItemStore((state) => state.initializeItems);
  const initializeUsers = useUserStore((state) => state.initializeUsers);
  const initializeBusinessData = useBusinessStore(
    (state) => state.initializeData,
  );
  const initializeCategories = useCategoryStore(
    (state) => state.initializeCategories,
  );

  useEffect(() => {
    // Initialize dummy data on app start
    initializeItems();
    initializeUsers();
    initializeBusinessData();
    initializeCategories();
  }, [
    initializeItems,
    initializeUsers,
    initializeBusinessData,
    initializeCategories,
  ]);

  return (
    <BrowserRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        {/* Client Routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.CASHIER} element={<CashierPage />} />
          <Route path={ROUTES.PRODUCTION} element={<ProductionPage />} />
          <Route path={ROUTES.ORDERS} element={<OrdersPage />} />
          <Route path={ROUTES.ORDER_DETAIL} element={<OrderDetailPage />} />
          <Route path={ROUTES.ITEMS} element={<ItemsPage />} />
          <Route path={ROUTES.CATEGORIES} element={<CategoriesPage />} />
          <Route path={ROUTES.USERS} element={<UsersPage />} />
          <Route path={ROUTES.ORGANIZATIONS} element={<BusinessesPage />} />
          <Route path={ROUTES.BRANCHES} element={<BranchesPage />} />
          <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
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
