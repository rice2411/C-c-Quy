import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getAccessibleRoutes } from '@/config/routes';
import { getUserFromLocalStorage } from '@/utils/userStorage';
import ThemeToggle from './ThemeToggle';
import toast from 'react-hot-toast';

const Layout: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('nav.signOut') + ' success');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  // Lấy danh sách routes mà user có quyền truy cập dựa trên role
  // Fallback: Nếu chưa có userData, load từ localStorage
  const storedUser = React.useMemo(() => getUserFromLocalStorage(), []);
  const userRole = userData?.role || storedUser?.role;
  
  
  const accessibleRoutes = getAccessibleRoutes(userRole);
  
  // Map routes config thành navItems với translation
  const navItems = accessibleRoutes.map(route => ({
    id: route.path,
    label: t(route.labelKey),
    icon: route.icon,
    disabled: route.disabled
  }));

  const getPageTitle = () => {
    if (location.pathname === '/') return t('header.dashboardTitle');
    if (location.pathname === '/orders') return t('header.ordersTitle');
    if (location.pathname === '/transactions') return t('header.transactionsTitle');
    if (location.pathname === '/inventory') return t('header.inventoryTitle');
    if (location.pathname === '/storage') return t('header.storageTitle');
    if (location.pathname === '/customers') return t('header.customersTitle');
    if (location.pathname === '/users') return t('header.usersTitle');
    return 'CucQuyBakery';
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-20 transition-colors duration-200">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-700">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold mr-3 shadow-sm shadow-orange-300 dark:shadow-none">
            C
          </div>
          <span className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">CucQuy<span className="text-orange-600 dark:text-orange-500">Bakery</span></span>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.disabled ? '#' : item.id}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === item.id
                  ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 shadow-sm'
                  : item.disabled 
                    ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${location.pathname === item.id ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`} />
              {item.label}
              {item.disabled && <span className="ml-auto text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded">{t('nav.soon')}</span>}
            </Link>
          ))}
          
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              {t('nav.signOut')}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-8 z-10 sticky top-0 transition-colors duration-200">
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="ml-3 text-lg font-bold text-slate-800 dark:text-white">CucQuyBakery</span>
          </div>

          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            
            <button
              onClick={toggleLanguage}
              className="px-3 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
            >
              <img 
                src={language === 'en' ? "https://flagcdn.com/w40/us.png" : "https://flagcdn.com/w40/vn.png"} 
                alt={language === 'en' ? "English" : "Vietnamese"}
                className="w-5 h-auto rounded-sm shadow-sm object-cover"
              />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {language === 'en' ? 'EN' : 'VI'}
              </span>
            </button>

            <ThemeToggle />

             <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline-block">{t('header.systemOp')}</span>
             </div>
             
             <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-700">
                 <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">
                      {currentUser?.displayName || 'Admin'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {currentUser?.email || 'admin@cucquy.com'}
                    </p>
                 </div>
                 <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-slate-700 overflow-hidden border border-slate-300 dark:border-slate-600 flex items-center justify-center">
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-orange-600 font-bold">
                        {currentUser?.displayName?.charAt(0).toUpperCase() || 'A'}
                      </span>
                    )}
                 </div>
             </div>
          </div>
        </header>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-30 shadow-lg animate-fade-in">
             <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.disabled ? '#' : item.id}
                  onClick={(e) => {
                    if (item.disabled) {
                      e.preventDefault();
                      return;
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === item.id
                      ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400'
                      : item.disabled
                        ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${location.pathname === item.id ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  {item.label}
                  {item.disabled && <span className="ml-auto text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded">{t('nav.soon')}</span>}
                </Link>
              ))}
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-all"
              >
                <LogOut className="w-5 h-5 mr-3" />
                {t('nav.signOut')}
              </button>
            </nav>
          </div>
        )}

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className=" mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;