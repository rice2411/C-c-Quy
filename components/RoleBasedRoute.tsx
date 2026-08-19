import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenConfig } from '@/contexts/ScreenConfigContext';
import { UserRole } from '@/types/user';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[]; // Role mặc định (hard-code) được phép truy cập
  fallbackPath?: string; // Path để redirect nếu không có quyền
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/'
}) => {
  const { userData } = useAuth();
  const { screenRoles } = useScreenConfig();
  const location = useLocation();

  // Override role theo config (Cài đặt → Màn hình) cho path hiện tại; không có → dùng mặc định.
  const override = screenRoles[location.pathname];
  const effectiveRole: UserRole | UserRole[] | undefined =
    override && override.length ? (override as UserRole[]) : requiredRole;

  // Nếu không có role yêu cầu, cho phép tất cả user đã đăng nhập
  if (!effectiveRole) {
    return <>{children}</>;
  }

  // Nếu chưa có userData, đợi load (có thể hiển thị loading)
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const userRole = userData.role;

  // Kiểm tra quyền truy cập
  const hasPermission = Array.isArray(effectiveRole)
    ? effectiveRole.includes(userRole)
    : effectiveRole === userRole;

  if (!hasPermission) {
    // Redirect về trang không có quyền hoặc dashboard
    // Nếu đang ở trang không có quyền, redirect về dashboard
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;

