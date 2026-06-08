import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth } from '@/config/firebase';

/** PWA standalone (iOS/Android cài về màn hình chính) không chạy được popup
 *  → phải dùng redirect, nếu không login sẽ treo loading mãi. */
const isStandalonePWA = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (window.navigator as any).standalone === true);

const signInGoogle = async (provider: GoogleAuthProvider) => {
  if (isStandalonePWA()) {
    await signInWithRedirect(auth, provider); // PWA → redirect (page rời đi rồi quay lại)
  } else {
    await signInWithPopup(auth, provider); // trình duyệt thường → popup
  }
};
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ChefHat, UserPlus, LogIn, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Image from '@/components/ui/Image';
import IconButton from '@/components/ui/IconButton';
import Spinner from '@/components/ui/Spinner';
import AvatarImage from '@/components/ui/AvatarImage';
import Typography from '@/components/ui/Typography';
import ThemeToggle from '@/components/ThemeToggle';
import { getAccountsHistory, removeAccountFromHistory } from '@/utils/user/userUtil';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [useCurrentAccount, setUseCurrentAccount] = useState(false);
  const [accountsHistory, setAccountsHistory] = useState(getAccountsHistory());

  // PWA: sau khi đăng nhập bằng redirect, Google trả về đây → nhận kết quả + vào app.
  useEffect(() => {
    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) setUseCurrentAccount(true); // kích hoạt useEffect điều hướng bên dưới
      })
      .catch((err) => console.error('Redirect login error:', err));
  }, []);

  // Tự động redirect về trang chủ nếu user đã đăng nhập và không muốn chọn tài khoản khác
  useEffect(() => {
    if (currentUser && useCurrentAccount) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate, useCurrentAccount]);

  // Reset loading khi currentUser thay đổi (có thể do bị logout vì status không phải active)
  useEffect(() => {
    if (!currentUser && loading) {
      setLoading(false);
    }
  }, [currentUser, loading]);

  const handleGoogleLogin = async (promptAccountSelection: boolean = false) => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      
      // Nếu muốn chọn tài khoản khác, thêm prompt để hiển thị account picker
      if (promptAccountSelection) {
        provider.setCustomParameters({
          prompt: 'select_account'
        });
      }
      
      await signInGoogle(provider);
      // Nếu là PWA redirect: page đã rời đi, các dòng dưới không chạy.
      toast.success('Login successful!');
      setUseCurrentAccount(true);
      // Redirect sẽ được xử lý bởi useEffect khi currentUser được cập nhật
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error('Failed to login. Please try again.');
      }
    } finally {
      // Đảm bảo luôn tắt loading dù có lỗi hay không
      setLoading(false);
    }
  };

  const handleUseCurrentAccount = () => {
    if (currentUser) {
      setUseCurrentAccount(true);
      navigate('/', { replace: true });
    }
  };

  const handleSelectAccount = async (account: typeof accountsHistory[0]) => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Set email để Google tự động chọn tài khoản này
      if (account.email) {
        provider.setCustomParameters({
          login_hint: account.email
        });
      }
      await signInGoogle(provider);
      toast.success('Login successful!');
      setUseCurrentAccount(true);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error('Failed to login. Please try again.');
      }
    } finally {
      // Đảm bảo luôn tắt loading dù có lỗi hay không
      setLoading(false);
    }
  };

  const handleRemoveAccount = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeAccountFromHistory(uid);
    setAccountsHistory(getAccountsHistory());
    toast.success(t('login.accountRemoved'));
  };

  // Cập nhật danh sách khi component mount
  useEffect(() => {
    setAccountsHistory(getAccountsHistory());
  }, []);

  return (
    <Box
      layoutClassName="min-h-screen flex flex-col items-center justify-center relative p-4"
      backgroundClassName="bg-gradient-to-br from-orange-100 via-orange-50 to-orange-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
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
            backgroundClassName="bg-orange-100 dark:bg-orange-900/20"
            roundedClassName="rounded-2xl"
          >
            <ChefHat className="w-10 h-10 text-orange-600 dark:text-orange-500" />
          </Box>
          <Heading level={2} layoutClassName="mb-2">
            CucQuy
            <Typography as="span" textClassName="font-inherit text-orange-600 dark:text-orange-500">
              Bakery
            </Typography>
          </Heading>
          <Typography variant="muted">{t('login.welcome')}</Typography>
        </Box>

        <Box layoutClassName="space-y-4">
          {/* Danh sách tài khoản đã từng đăng nhập */}
          {accountsHistory.length > 0 && (
            <Box layoutClassName="space-y-2">
              <Typography size="sm" layoutClassName="mb-2" textClassName="font-medium">
                {t('login.recentAccounts')}
              </Typography>
              <Box layoutClassName="space-y-2 max-h-64 overflow-y-auto">
                {accountsHistory
                  .filter(acc => acc.uid !== currentUser?.uid) // Loại bỏ tài khoản hiện tại
                  .map((account) => (
                    <Card
                      key={account.uid}
                      onClick={() => handleSelectAccount(account)}
                      padding="none"
                      layoutClassName="group flex cursor-pointer items-center gap-3 p-3"
                      roundedClassName="rounded-lg"
                      borderClassName="border-slate-200 dark:border-slate-600"
                      backgroundClassName="bg-slate-50 dark:bg-slate-700/50"
                      hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700"
                      stateClassName="transition-colors"
                    >
                      <AvatarImage
                        src={account.photoURL || undefined}
                        alt={account.displayName || 'User'}
                        fallback={
                          <Typography as="span" textClassName="text-sm font-bold text-orange-600 dark:text-orange-400">
                            {account.displayName?.charAt(0).toUpperCase() || account.email?.charAt(0).toUpperCase() || 'A'}
                          </Typography>
                        }
                      />
                      <Box layoutClassName="flex-1 min-w-0">
                        <Typography size="sm" variant="primary" layoutClassName="truncate" textClassName="font-medium">
                          {account.displayName || 'User'}
                        </Typography>
                        <Typography size="xs" variant="muted" layoutClassName="truncate">
                          {account.email}
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={(e) => handleRemoveAccount(account.uid, e)}
                        label={t('login.removeAccount')}
                        size="sm"
                        sizeClassName="h-7 w-7"
                        roundedClassName="rounded-lg"
                        textClassName="text-slate-400"
                        stateClassName="opacity-0 transition-all group-hover:opacity-100"
                        hoverClassName="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        title={t('login.removeAccount')}
                      >
                        <X className="w-4 h-4" />
                      </IconButton>
                    </Card>
                  ))}
              </Box>
            </Box>
          )}

          {/* Hiển thị tài khoản hiện tại nếu có */}
          {currentUser && (
            <Card roundedClassName="rounded-xl" backgroundClassName="bg-slate-50 dark:bg-slate-700/50">
              <Typography size="sm" variant="muted" layoutClassName="mb-3">
                {t('login.currentAccount')}
              </Typography>
              <Box layoutClassName="mb-3 flex items-center gap-3">
                <AvatarImage
                  src={currentUser.photoURL || undefined}
                  alt={currentUser.displayName || 'User'}
                  fallback={
                    <Typography as="span" textClassName="text-sm font-bold text-orange-600 dark:text-orange-400">
                      {currentUser.displayName?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'A'}
                    </Typography>
                  }
                />
                <Box layoutClassName="flex-1 min-w-0">
                  <Typography size="sm" variant="primary" layoutClassName="truncate" textClassName="font-medium">
                    {currentUser.displayName || 'User'}
                  </Typography>
                  <Typography size="xs" variant="muted" layoutClassName="truncate">
                    {currentUser.email}
                  </Typography>
                </Box>
              </Box>
              <Button
                onClick={handleUseCurrentAccount}
                disabled={loading}
                fullWidth
                backgroundClassName="bg-orange-600"
                hoverClassName="hover:bg-orange-700"
                leftIcon={<LogIn className="w-4 h-4" />}
              >
                {t('login.useCurrentAccount')}
              </Button>
            </Card>
          )}

          {/* Nút đăng nhập với tài khoản khác hoặc thêm tài khoản mới */}
          <Button
            onClick={() => handleGoogleLogin(true)}
            disabled={loading}
            variant="secondary"
            fullWidth
            roundedClassName="rounded-xl"
            sizeClassName="py-3"
            shadowClassName="shadow-sm"
            hoverClassName="hover:shadow-md"
          >
            {loading ? (
              <Spinner size="md" textClassName="text-slate-400" />
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <Image
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="Google" 
                  layoutClassName="w-5 h-5"
                />
              </>
            )}
            {currentUser ? t('login.switchAccount') : t('login.googleButton')}
          </Button>
        </Box>

        <Box layoutClassName="text-center text-xs" textClassName="text-slate-400 dark:text-slate-500">
          <Typography size="xs" variant="muted">
            &copy; {new Date().getFullYear()} CucQuyBakery. All rights reserved.
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default LoginPage;