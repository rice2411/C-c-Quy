import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, PlusCircle, ShoppingCart, Users, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenConfig } from '@/contexts/ScreenConfigContext';
import { getAccessibleRoutes, buildNavTree } from '@/config/routes';
import { getUserFromLocalStorage } from '@/utils/user/userUtil';

const MobileFooterNav: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { screenVisibility, screenRoles } = useScreenConfig();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const storedUser = React.useMemo(() => getUserFromLocalStorage(), []);
  const userRole = userData?.role || storedUser?.role;
  const accessibleRoutes = getAccessibleRoutes(userRole, screenVisibility, screenRoles);
  const routeByPath = React.useMemo(
    () => Object.fromEntries(accessibleRoutes.map((route) => [route.path, route])),
    [accessibleRoutes]
  );

  const mainTabs = ['/', '/orders', '/customers', '/storage'];

  // Cây nav: gom các route thuộc nhóm; lọc bỏ các tab chính khỏi menu "Thêm"
  const navTree = buildNavTree(userRole, screenVisibility, screenRoles);
  const moreNodes = navTree.filter(
    (node) => node.type === 'group' || !mainTabs.includes(node.route.path)
  );
  const moreLeafRoutes = moreNodes.flatMap((node) =>
    node.type === 'group' ? node.children : [node.route]
  );

  const isMoreActive = moreLeafRoutes.some((route) => route.path === location.pathname);
  const activeMoreRoute = moreLeafRoutes.find((route) => route.path === location.pathname);

  const tabs = [
    {
      id: '/orders',
      label: t('nav.orders'),
      icon: ShoppingCart,
    },
    {
      id: '/customers',
      label: t('nav.customers'),
      icon: Users,
    },
    {
      id: '/',
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
    },
    {
      id: '/storage',
      label: t('nav.inventory'),
      icon: Package,
    },
    {
      id: 'more',
      label: t('nav.add'),
      icon: PlusCircle,
    },
  ];

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMoreMenuOpen) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isMoreMenuOpen]);

  const handleMoreClick = () => {
    if (isMoreMenuOpen) {
      handleCloseMenu();
    } else {
      setIsMoreMenuOpen(true);
      setIsClosing(false);
    }
  };

  const handleCloseMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsMoreMenuOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const handleRouteClick = (path: string) => {
    navigate(path);
    handleCloseMenu();
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-700 z-30 backdrop-blur">
        <div className="relative flex justify-between px-3 pb-3 pt-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = location.pathname === tab.id;
            const isMore = tab.id === 'more';
            const isDashboard = tab.id === '/';
            const routeMeta = routeByPath[tab.id];
            const isDisabled = !isMore && !isDashboard ? !routeMeta || Boolean(routeMeta.disabled) : false;

            if (isDashboard) {
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate('/')}
                  className="relative flex flex-1 flex-col items-center gap-0.5 text-[11px] pt-3"
                >
                  <div className="w-full h-full opacity-0 pointer-events-none" />
                  <span
                    className={` ${
                      active
                        ? 'text-primary-600 dark:text-primary-300 font-semibold'
                        : 'text-slate-500 dark:text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </span>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-primary-300 dark:shadow-none border-2 border-white dark:border-slate-900">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                </button>
              );
            }

            const displayLabel = isMore && isMoreActive && activeMoreRoute
              ? t(activeMoreRoute.labelKey)
              : tab.label;

            return (
              <button
                key={tab.id}
                onClick={isMore ? handleMoreClick : () => !isDisabled && navigate(tab.id)}
                className={`flex flex-1 flex-col items-center gap-0.5 text-[11px] min-w-0 ${isDisabled ? 'opacity-50' : ''}`}
                title={displayLabel}
                disabled={isDisabled}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                    isMore && (isMoreMenuOpen || isMoreActive)
                      ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
                      : isDisabled
                        ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                      : active
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'text-slate-500 dark:text-slate-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`mt-0.5 w-full text-center truncate px-0.5 ${
                    isMore && (isMoreMenuOpen || isMoreActive)
                      ? 'text-primary-600 dark:text-primary-300 font-semibold'
                      : isDisabled
                        ? 'text-slate-400 dark:text-slate-500'
                      : active
                        ? 'text-primary-600 dark:text-primary-300 font-semibold'
                        : 'text-slate-500 dark:text-slate-300'
                  }`}
                >
                  {displayLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {isMoreMenuOpen && (
        <>
          <div
            className={`md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
              isClosing ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={handleCloseMenu}
          />
          <div
            ref={menuRef}
            className={`md:hidden fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white dark:bg-slate-800 shadow-2xl transition-transform duration-300 ease-out ${
              isClosing ? 'translate-y-full' : 'translate-y-0'
            }`}
          >
            {/* Thanh kéo (grab handle) — cảm giác bottom-sheet mobile */}
            <div className="flex shrink-0 justify-center pt-2.5 pb-1">
              <div className="h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>
            <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-1 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('nav.add')}
              </h2>
              <button
                onClick={handleCloseMenu}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pb-8">
              {moreNodes.length > 0 ? (
                <div className="space-y-1">
                  {moreNodes.map((node) => {
                    const renderRouteButton = (route: typeof moreLeafRoutes[number], indented = false) => {
                      const Icon = route.icon;
                      const active = location.pathname === route.path;
                      return (
                        <button
                          key={route.path}
                          onClick={() => !route.disabled && handleRouteClick(route.path)}
                          className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${indented ? 'pl-8' : ''} ${
                            active
                              ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400'
                              : route.disabled
                                ? 'text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/40'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                          disabled={route.disabled}
                        >
                          <Icon
                            className={`${indented ? 'w-4 h-4' : 'w-5 h-5'} mr-3 ${
                              active ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          />
                          {t(route.labelKey)}
                          {route.disabled && (
                            <span className="ml-auto text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                              Bảo trì
                            </span>
                          )}
                        </button>
                      );
                    };

                    if (node.type === 'route') return renderRouteButton(node.route);

                    const GroupIcon = node.group.icon;
                    return (
                      <div key={node.group.key} className="pt-1">
                        <div className="flex items-center gap-2 px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          <GroupIcon className="w-4 h-4" />
                          {t(node.group.labelKey)}
                        </div>
                        {node.children.map((child) => renderRouteButton(child, true))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <p className="text-sm">{t('nav.noMorePages') || 'No additional pages available'}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileFooterNav;


