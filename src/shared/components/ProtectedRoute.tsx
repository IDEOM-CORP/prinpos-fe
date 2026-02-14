import { Navigate, Outlet } from "react-router-dom";
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
    // Redirect to role-appropriate default page
    if (user.role === "kasir") {
      return <Navigate to={ROUTES.CASHIER} replace />;
    }
    if (user.role === "produksi") {
      return <Navigate to={ROUTES.PRODUCTION} replace />;
    }
    if (user.role === "designer") {
      return <Navigate to={ROUTES.CREATE_ORDER} replace />;
    }
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
