import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ChefHat, UserPlus, LogIn, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { getAccountsHistory, removeAccountFromHistory } from '@/utils/userStorage';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [useCurrentAccount, setUseCurrentAccount] = useState(false);
  const [accountsHistory, setAccountsHistory] = useState(getAccountsHistory());

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
      
      await signInWithPopup(auth, provider);
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
      await signInWithPopup(auth, provider);
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
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-orange-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle variant="floating" />
      </div>

      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-8 animate-fade-in border border-slate-100 dark:border-slate-700">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mb-4 transform rotate-3">
            <ChefHat className="w-10 h-10 text-orange-600 dark:text-orange-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            CucQuy<span className="text-orange-600 dark:text-orange-500">Bakery</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {t('login.welcome')}
          </p>
        </div>

        <div className="space-y-4">
          {/* Danh sách tài khoản đã từng đăng nhập */}
          {accountsHistory.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('login.recentAccounts')}
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {accountsHistory
                  .filter(acc => acc.uid !== currentUser?.uid) // Loại bỏ tài khoản hiện tại
                  .map((account) => (
                    <div
                      key={account.uid}
                      onClick={() => handleSelectAccount(account)}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-slate-600 overflow-hidden border border-slate-200 dark:border-slate-500 flex items-center justify-center flex-shrink-0">
                        {account.photoURL ? (
                          <img 
                            src={account.photoURL} 
                            alt={account.displayName || 'User'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                            {account.displayName?.charAt(0).toUpperCase() || account.email?.charAt(0).toUpperCase() || 'A'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {account.displayName || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {account.email}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleRemoveAccount(account.uid, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title={t('login.removeAccount')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Hiển thị tài khoản hiện tại nếu có */}
          {currentUser && (
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                {t('login.currentAccount')}
              </p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-slate-600 overflow-hidden border border-slate-200 dark:border-slate-500 flex items-center justify-center flex-shrink-0">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                      {currentUser.displayName?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {currentUser.displayName || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleUseCurrentAccount}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('login.useCurrentAccount')}</span>
              </button>
            </div>
          )}

          {/* Nút đăng nhập với tài khoản khác hoặc thêm tài khoản mới */}
          <button
            onClick={() => handleGoogleLogin(true)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-white font-medium hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="Google" 
                  className="w-5 h-5"
                />
              </>
            )}
            <span>{currentUser ? t('login.switchAccount') : t('login.googleButton')}</span>
          </button>
        </div>

        <div className="text-center text-xs text-slate-400 dark:text-slate-500">
          <p>&copy; {new Date().getFullYear()} CucQuyBakery. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;