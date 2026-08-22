import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenConfig } from '@/contexts/ScreenConfigContext';
import { useNetworkStatus } from '@/hooks/queries/useNetworkQuery';
import { UserRole } from '@/types/user';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';

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
  const { status, isBlocked } = useNetworkStatus();
  const location = useLocation();

  // Override role theo config (Cài đặt → Màn hình) cho path hiện tại; không có → dùng mặc định.
  const override = screenRoles[location.pathname];
  const effectiveRole: UserRole | UserRole[] | undefined =
    override && override.length ? (override as UserRole[]) : requiredRole;

  // Chặn theo MẠNG: màn bật guard + IP ngoài dải cho phép → hiện màn "cần mạng quán".
  if (isBlocked(location.pathname)) {
    return (
      <Box layoutClassName="flex min-h-screen items-center justify-center p-6" backgroundClassName="bg-slate-50 dark:bg-slate-900">
        <Box
          layoutClassName="w-full max-w-md p-8 text-center"
          roundedClassName="rounded-2xl"
          borderClassName="border border-amber-200 dark:border-amber-800/50"
          backgroundClassName="bg-white dark:bg-slate-800"
          shadowClassName="shadow-sm"
        >
          <Box layoutClassName="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" backgroundClassName="bg-amber-100 dark:bg-amber-900/40">
            <WifiOff className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </Box>
          <Heading level={2} layoutClassName="mb-2" textClassName="text-lg font-bold text-slate-900 dark:text-white">
            Cần mạng được duyệt
          </Heading>
          <Typography as="p" size="sm" textClassName="text-slate-500 dark:text-slate-400">
            Màn hình này chỉ truy cập được khi thiết bị ở trong mạng của quán. Vui lòng kết nối Wi-Fi quán rồi thử lại.
          </Typography>
          <Typography as="p" size="xs" layoutClassName="mt-3" textClassName="text-slate-400 dark:text-slate-500">
            IP hiện tại: {status.ip || '—'}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Nếu không có role yêu cầu, cho phép tất cả user đã đăng nhập
  if (!effectiveRole) {
    return <>{children}</>;
  }

  // Nếu chưa có userData, đợi load (có thể hiển thị loading)
  if (!userData) {
    return (
      <Box layoutClassName="flex min-h-screen items-center justify-center" backgroundClassName="bg-slate-50 dark:bg-slate-900">
        <Spinner size="lg" textClassName="text-primary-500" />
      </Box>
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

