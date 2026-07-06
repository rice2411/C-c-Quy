import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { ChefHat } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { exchangeGoogleCredential } from '@/services/auth/googleSso';
import { setSsoToken, clearSsoToken } from '@/services/auth/ssoToken';
import { getUserByEmail } from '@/services/userService';
import { UserStatus } from '@/types/user';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';
import ThemeToggle from '@/components/ThemeToggle';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, applyLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) navigate('/', { replace: true });
  }, [currentUser, navigate]);

  const handleCredential = async (res: CredentialResponse) => {
    const credential = res.credential;
    if (!credential) {
      toast.error('Không lấy được thông tin Google');
      return;
    }
    setLoading(true);
    try {
      // 1) Đổi Google ID token → SSO JWT qua RiceService
      const { token, user } = await exchangeGoogleCredential(credential);
      setSsoToken(token);
      // 2) Lấy hồ sơ (role/status) từ BE CucQuy theo email (đã có token để verify)
      const data = await getUserByEmail(user.email);
      if (!data) {
        clearSsoToken();
        toast.error('Tài khoản chưa được cấp quyền. Liên hệ quản trị viên.');
        return;
      }
      if (data.status !== UserStatus.ACTIVE) {
        clearSsoToken();
        toast.error('Tài khoản chưa được phê duyệt. Vui lòng chờ quản trị viên.');
        return;
      }
      applyLogin(data);
      toast.success('Đăng nhập thành công');
      navigate('/', { replace: true });
    } catch {
      clearSsoToken();
      toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      layoutClassName="min-h-screen flex flex-col items-center justify-center relative p-4"
      backgroundClassName="bg-gradient-to-br from-primary-100 via-primary-50 to-primary-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
    >
      <Box layoutClassName="absolute top-4 right-4">
        <ThemeToggle variant="floating" />
      </Box>

      <Card
        padding="none"
        layoutClassName="max-w-md w-full space-y-8 animate-fade-in p-8"
        roundedClassName="rounded-2xl"
        shadowClassName="shadow-xl"
      >
        <Box layoutClassName="text-center">
          <Box
            layoutClassName="mx-auto w-16 h-16 flex items-center justify-center mb-4 transform rotate-3"
            backgroundClassName="bg-primary-100 dark:bg-primary-900/20"
            roundedClassName="rounded-2xl"
          >
            <ChefHat className="w-10 h-10 text-primary-600 dark:text-primary-500" />
          </Box>
          <Heading level={2} layoutClassName="mb-2">
            Tiệm Bánh{' '}
            <Typography as="span" textClassName="font-inherit text-primary-600 dark:text-primary-500">
              Cúc Quy
            </Typography>
          </Heading>
          <Typography variant="muted">{t('login.welcome')}</Typography>
        </Box>

        <Box layoutClassName="flex flex-col items-center gap-4">
          {loading ? (
            <Spinner size="md" textClassName="text-primary-500" />
          ) : (
            <GoogleLogin
              onSuccess={handleCredential}
              onError={() => { toast.error('Đăng nhập Google thất bại'); }}
              text="signin_with"
              shape="pill"
            />
          )}
          <Typography size="xs" variant="muted" layoutClassName="text-center">
            Đăng nhập bằng tài khoản Google đã được cấp quyền.
          </Typography>
        </Box>

        <Box layoutClassName="text-center text-xs" textClassName="text-slate-400 dark:text-slate-500">
          <Typography size="xs" variant="muted">
            &copy; {new Date().getFullYear()} Tiệm Bánh Cúc Quy. All rights reserved.
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default LoginPage;
