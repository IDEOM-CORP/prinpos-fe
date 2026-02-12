import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { ROUTES } from "../../core/routes";
import MainLayout from "../../layouts/MainLayout";
import SuperAdminLayout from "../../layouts/SuperAdminLayout";

interface ProtectedRouteProps {
  allowedRoles?: string[];
  isSuperAdmin?: boolean;
}

export default function ProtectedRoute({
  allowedRoles,
  isSuperAdmin = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // CashierPage runs in fullscreen mode without layout
  const isFullscreenRoute = location.pathname === ROUTES.CASHIER;

  // Superadmin routes require superadmin authentication
  if (isSuperAdmin) {
    if (!isAuthenticated || user?.role !== "superadmin") {
      return <Navigate to={ROUTES.ADMIN_LOGIN} replace />;
    }

    return (
      <SuperAdminLayout>
        <Outlet />
      </SuperAdminLayout>
    );
  }

  // Regular client routes
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Prevent superadmin from accessing client routes
  if (user?.role === "superadmin") {
    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Fullscreen routes (Cashier) render without MainLayout
  if (isFullscreenRoute) {
    return <Outlet />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
