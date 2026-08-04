import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { setSsoToken, clearSsoToken } from '@/services/auth/ssoToken';
import { syncCurrentUser } from '@/services/userService';
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
        // Sync: upsert user theo token. User MỚI → BE tạo record status 'pending'
        // (để admin thấy trong QL người dùng + duyệt). User cũ → trả hồ sơ hiện tại.
        const data = await syncCurrentUser();
        if (!data) {
          clearSsoToken();
          toast.error('Đăng nhập thất bại: không tạo được hồ sơ. Thử lại hoặc liên hệ quản trị viên.');
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
