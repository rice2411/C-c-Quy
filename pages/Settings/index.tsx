import React, { useEffect, useMemo, useState } from 'react';
import { Save, Settings } from 'lucide-react';
import { getRouteConfigKey, routes, storageTabRoutes } from '@/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScreenConfig } from '@/contexts/ScreenConfigContext';
import { ScreenVisibilityMap } from '@/types';
import toast from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const { screenVisibility, loading, saving, saveVisibility } = useScreenConfig();
  const [draftVisibility, setDraftVisibility] = useState<ScreenVisibilityMap>({});
  const [activeTab, setActiveTab] = useState<'screens' | 'database'>('screens');

  useEffect(() => {
    setDraftVisibility(screenVisibility);
  }, [screenVisibility]);

  const pageItems = useMemo(() => {
    return routes.filter((route) => route.path !== '/settings' && route.path !== '/');
  }, []);

  const tabItems = useMemo(() => storageTabRoutes, []);

  const childTabsByParent = useMemo(() => {
    return tabItems.reduce<Record<string, typeof tabItems>>((acc, tab) => {
      const parent = tab.parentPath || '';
      if (!acc[parent]) acc[parent] = [];
      acc[parent].push(tab);
      return acc;
    }, {});
  }, [tabItems]);

  const hasChanged = useMemo(() => {
    const allItems = [...pageItems, ...tabItems];
    return allItems.some((item) => {
      const key = getRouteConfigKey(item);
      return (draftVisibility[key] !== false) !== (screenVisibility[key] !== false);
    });
  }, [draftVisibility, pageItems, tabItems, screenVisibility]);

  const handleToggle = (configKey: string) => {
    setDraftVisibility((prev) => ({
      ...prev,
      [configKey]: prev[configKey] === false ? true : false,
    }));
  };

  const handleSave = async () => {
    try {
      await saveVisibility(draftVisibility);
      toast.success('Đã lưu cấu hình màn hình');
    } catch (error) {
      console.error('Failed to save screen visibility', error);
      toast.error('Không thể lưu cấu hình màn hình');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
        <Settings className="w-16 h-16 mb-4 opacity-20 animate-spin" />
        <p>Đang tải cấu hình màn hình...</p>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto space-y-6">
      <div className="w-full border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('screens')}
            className={`relative pb-2 text-sm font-semibold tracking-wide uppercase transition-colors duration-200 ${
              activeTab === 'screens'
                ? 'text-orange-500 dark:text-orange-400'
                : 'text-slate-500 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400'
            }`}
          >
            Màn hình
            {activeTab === 'screens' && (
              <span className="absolute left-0 right-0 -bottom-[1px] h-0.5 bg-orange-500 dark:bg-orange-400 rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`relative pb-2 text-sm font-semibold tracking-wide uppercase transition-colors duration-200 ${
              activeTab === 'database'
                ? 'text-orange-500 dark:text-orange-400'
                : 'text-slate-500 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400'
            }`}
          >
            Database
            {activeTab === 'database' && (
              <span className="absolute left-0 right-0 -bottom-[1px] h-0.5 bg-orange-500 dark:bg-orange-400 rounded-full" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          {activeTab === 'screens' ? (
            <>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Quản lý màn hình</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Bật/tắt quyền hiển thị các màn hình trên menu điều hướng.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Quản lý database</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Theo dõi cấu hình dữ liệu hệ thống và các bộ sưu tập đang dùng.
              </p>
            </>
          )}
        </div>
        {activeTab === 'screens' && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanged}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? (t('form.saving') || 'Đang lưu...') : (t('form.save') || 'Lưu')}
          </button>
        )}
      </div>

      {activeTab === 'screens' ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700">
          {pageItems.map((page) => {
            const pageConfigKey = getRouteConfigKey(page);
            const pageEnabled = draftVisibility[pageConfigKey] !== false;
            const childTabs = childTabsByParent[page.path] || [];

            return (
              <div key={pageConfigKey} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{t(page.labelKey)}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 uppercase">
                        page
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{page.path}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle(pageConfigKey)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      pageEnabled ? 'bg-orange-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                    aria-label={`Toggle ${pageConfigKey}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        pageEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {childTabs.map((tab) => {
                  const tabConfigKey = getRouteConfigKey(tab);
                  const tabEnabled = draftVisibility[tabConfigKey] !== false;
                  return (
                    <div
                      key={tabConfigKey}
                      className="ml-6 pl-4 border-l-2 border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 py-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{t(tab.labelKey)}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 uppercase">
                            tab
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {tab.parentPath} / {tab.tabId}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle(tabConfigKey)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          tabEnabled ? 'bg-orange-600' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                        aria-label={`Toggle ${tabConfigKey}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            tabEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Firestore Document</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">`configurations/screen-visibility`</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Tổng cấu hình page + tab</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {pageItems.length + tabItems.length}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Đang bật</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {[...pageItems, ...tabItems].filter((item) => draftVisibility[getRouteConfigKey(item)] !== false).length}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Tab Database hiện hiển thị thông tin cấu hình cơ bản. Nếu bạn muốn, mình có thể bổ sung thêm công cụ backup/restore và export JSON ở bước tiếp theo.
          </p>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;