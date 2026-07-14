import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { setSsoToken, clearSsoToken } from '@/services/auth/ssoToken';
import { getUserByEmail } from '@/services/userService';
import { UserStatus } from '@/types/user';
import Box from '@/components/ui/Box';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';
import toast from 'react-hot-toast';

/**
 * Đích redirect sau đăng nhập Google (luồng server-side qua RiceService).
 * RiceService → 302 về `/auth/callback?token=<SSO JWT>`. Trang này lưu token,
 * đọc email từ JWT → lấy hồ sơ (role/status) từ BE → áp phiên → về trang chủ.
 */

/** Giải mã payload JWT (base64url) chỉ để đọc email — KHÔNG dùng để tin cậy quyền. */
const decodeJwtEmail = (token: string): string => {
  try {
    const part = token.split('.')[1] || '';
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as { email?: string };
    return payload.email || '';
  } catch {
    return '';
  }
};

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { applyLogin } = useAuth();
  const [params] = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard StrictMode double-run
    ran.current = true;

    const token = params.get('token') || '';
    void (async () => {
      if (!token) {
        toast.error('Đăng nhập thất bại: thiếu token.');
        navigate('/login', { replace: true });
        return;
      }
      setSsoToken(token);
      try {
        const email = decodeJwtEmail(token);
        const data = email ? await getUserByEmail(email) : null;
        if (!data) {
          clearSsoToken();
          toast.error('Tài khoản chưa được cấp quyền. Liên hệ quản trị viên.');
          navigate('/login', { replace: true });
          return;
        }
        if (data.status !== UserStatus.ACTIVE) {
          clearSsoToken();
          toast.error('Tài khoản chưa được phê duyệt. Vui lòng chờ quản trị viên.');
          navigate('/login', { replace: true });
          return;
        }
        applyLogin(data);
        toast.success('Đăng nhập thành công');
        navigate('/', { replace: true });
      } catch {
        clearSsoToken();
        toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
        navigate('/login', { replace: true });
      }
    })();
  }, [params, navigate, applyLogin]);

  return (
    <Box
      layoutClassName="min-h-screen flex flex-col items-center justify-center gap-4"
      backgroundClassName="bg-gradient-to-br from-primary-100 via-primary-50 to-primary-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
    >
      <Spinner size="lg" textClassName="text-primary-500" />
      <Typography variant="muted">Đang hoàn tất đăng nhập…</Typography>
    </Box>
  );
};

export default AuthCallbackPage;
