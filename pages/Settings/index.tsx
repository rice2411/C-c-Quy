import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Save, Settings } from 'lucide-react';
import { getRouteConfigKey, routes, storageTabRoutes } from '@/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScreenConfig } from '@/contexts/ScreenConfigContext';
import { ScreenVisibilityMap } from '@/types';
import toast from 'react-hot-toast';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Spinner from '@/components/ui/Spinner';
import Switch from '@/components/ui/Switch';
import Typography from '@/components/ui/Typography';
import ZaloSettingsTab from '@/pages/Settings/ZaloSettingsTab';
import OrderSettingsTab from '@/pages/Settings/OrderSettingsTab';
import BadgesTab from '@/pages/Settings/BadgesTab';
import CategoriesTab from '@/pages/Settings/CategoriesTab';

const SettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const { screenVisibility, loading, saving, saveVisibility } = useScreenConfig();
  const [draftVisibility, setDraftVisibility] = useState<ScreenVisibilityMap>({});
  const [activeTab, setActiveTab] = useState<'screens' | 'zalo' | 'order' | 'badges' | 'categories'>('screens');

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
      <Box
        layoutClassName="flex h-full flex-col items-center justify-center"
        textClassName="text-slate-400 dark:text-slate-500"
      >
        <Settings className="mb-4 h-16 w-16 animate-spin opacity-20" />
        <Typography>Đang tải cấu hình màn hình...</Typography>
      </Box>
    );
  }

  return (
    <Box layoutClassName="mx-auto max-w-8xl space-y-6">
      <Box layoutClassName="w-full border-b border-slate-200 dark:border-slate-700">
        <Box layoutClassName="flex gap-6">
          <Button
            type="button"
            onClick={() => setActiveTab('screens')}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            roundedClassName="rounded-none"
            layoutClassName="relative pb-2 text-sm font-semibold uppercase tracking-wide"
            textClassName={
              activeTab === 'screens'
                ? 'text-primary-500 dark:text-primary-400'
                : 'text-slate-500 hover:text-primary-500 dark:text-slate-300 dark:hover:text-primary-400'
            }
            stateClassName="transition-colors duration-200"
          >
            Màn hình
            {activeTab === 'screens' && (
              <Box
                layoutClassName="absolute -bottom-[1px] left-0 right-0 h-0.5"
                roundedClassName="rounded-full"
                backgroundClassName="bg-primary-500 dark:bg-primary-400"
              />
            )}
          </Button>
          <Button
            type="button"
            onClick={() => setActiveTab('zalo')}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            roundedClassName="rounded-none"
            layoutClassName="relative pb-2 text-sm font-semibold uppercase tracking-wide"
            textClassName={
              activeTab === 'zalo'
                ? 'text-primary-500 dark:text-primary-400'
                : 'text-slate-500 hover:text-primary-500 dark:text-slate-300 dark:hover:text-primary-400'
            }
            stateClassName="transition-colors duration-200"
          >
            Zalo
            {activeTab === 'zalo' && (
              <Box
                layoutClassName="absolute -bottom-[1px] left-0 right-0 h-0.5"
                roundedClassName="rounded-full"
                backgroundClassName="bg-primary-500 dark:bg-primary-400"
              />
            )}
          </Button>
          <Button
            type="button"
            onClick={() => setActiveTab('order')}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            roundedClassName="rounded-none"
            layoutClassName="relative pb-2 text-sm font-semibold uppercase tracking-wide"
            textClassName={
              activeTab === 'order'
                ? 'text-primary-500 dark:text-primary-400'
                : 'text-slate-500 hover:text-primary-500 dark:text-slate-300 dark:hover:text-primary-400'
            }
            stateClassName="transition-colors duration-200"
          >
            Đơn hàng
            {activeTab === 'order' && (
              <Box
                layoutClassName="absolute -bottom-[1px] left-0 right-0 h-0.5"
                roundedClassName="rounded-full"
                backgroundClassName="bg-primary-500 dark:bg-primary-400"
              />
            )}
          </Button>
          <Button
            type="button"
            onClick={() => setActiveTab('badges')}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            roundedClassName="rounded-none"
            layoutClassName="relative pb-2 text-sm font-semibold uppercase tracking-wide"
            textClassName={
              activeTab === 'badges'
                ? 'text-primary-500 dark:text-primary-400'
                : 'text-slate-500 hover:text-primary-500 dark:text-slate-300 dark:hover:text-primary-400'
            }
            stateClassName="transition-colors duration-200"
          >
            Badges
            {activeTab === 'badges' && (
              <Box
                layoutClassName="absolute -bottom-[1px] left-0 right-0 h-0.5"
                roundedClassName="rounded-full"
                backgroundClassName="bg-primary-500 dark:bg-primary-400"
              />
            )}
          </Button>
          <Button
            type="button"
            onClick={() => setActiveTab('categories')}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            roundedClassName="rounded-none"
            layoutClassName="relative pb-2 text-sm font-semibold uppercase tracking-wide"
            textClassName={
              activeTab === 'categories'
                ? 'text-primary-500 dark:text-primary-400'
                : 'text-slate-500 hover:text-primary-500 dark:text-slate-300 dark:hover:text-primary-400'
            }
            stateClassName="transition-colors duration-200"
          >
            Danh mục
            {activeTab === 'categories' && (
              <Box
                layoutClassName="absolute -bottom-[1px] left-0 right-0 h-0.5"
                roundedClassName="rounded-full"
                backgroundClassName="bg-primary-500 dark:bg-primary-400"
              />
            )}
          </Button>
        </Box>
      </Box>

      <Box layoutClassName="flex items-center justify-between">
        <Box>
          {activeTab === 'order' || activeTab === 'badges' || activeTab === 'categories' ? null : activeTab === 'screens' ? (
            <>
              <Heading level={2} textClassName="text-xl font-semibold">Quản lý màn hình</Heading>
              <Typography size="sm" variant="muted" layoutClassName="mt-1">
                Bật/tắt quyền hiển thị các màn hình trên menu điều hướng.
              </Typography>
            </>
          ) : (
            <>
              <Heading level={2} textClassName="flex items-center gap-2 text-xl font-semibold">
                <MessageCircle className="h-6 w-6 text-primary-500" />
                Cấu hình Zalo
              </Heading>
              <Typography size="sm" variant="muted" layoutClassName="mt-1">
                Nhóm gửi thông báo Zalo và gán CTV theo từng nhóm.
              </Typography>
            </>
          )}
        </Box>
        {activeTab === 'screens' && (
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanged}
            leftIcon={saving ? <Spinner size="sm" textClassName="text-white" borderClassName="border-white" /> : <Save />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-4 py-2"
            backgroundClassName="bg-primary-600"
            hoverClassName="hover:bg-primary-700"
            textClassName="text-sm font-medium text-white"
            roundedClassName="rounded-lg"
            layoutClassName="inline-flex items-center gap-2"
            stateClassName="transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            disableVariantHover
            disableVariantTextColor
          >
            {saving ? (t('form.saving') || 'Đang lưu...') : (t('form.save') || 'Lưu')}
          </Button>
        )}
      </Box>

      {activeTab === 'order' ? (
        <OrderSettingsTab />
      ) : activeTab === 'badges' ? (
        <BadgesTab />
      ) : activeTab === 'categories' ? (
        <CategoriesTab />
      ) : activeTab === 'zalo' ? (
        <ZaloSettingsTab />
      ) : activeTab === 'screens' ? (
        <Card
          padding="none"
          borderClassName="border-slate-200 dark:border-slate-700"
          layoutClassName="divide-y divide-slate-100 dark:divide-slate-700"
        >
          {pageItems.map((page) => {
            const pageConfigKey = getRouteConfigKey(page);
            const pageEnabled = draftVisibility[pageConfigKey] !== false;
            const childTabs = childTabsByParent[page.path] || [];

            return (
              <Box key={pageConfigKey} layoutClassName="space-y-3 p-4">
                <Box layoutClassName="flex items-center justify-between gap-4">
                  <Box layoutClassName="min-w-0">
                    <Box layoutClassName="flex items-center gap-2">
                      <Typography size="sm" layoutClassName="font-semibold">{t(page.labelKey)}</Typography>
                      <Badge
                        size="sm"
                        layoutClassName="px-2 py-0.5 text-[10px] uppercase"
                        borderClassName="border-transparent"
                        backgroundClassName="bg-slate-100 dark:bg-slate-700"
                        textClassName="text-slate-500 dark:text-slate-300"
                      >
                        page
                      </Badge>
                    </Box>
                    <Typography size="xs" variant="muted" layoutClassName="mt-0.5">{page.path}</Typography>
                  </Box>
                  <Switch
                    checked={pageEnabled}
                    onCheckedChange={() => handleToggle(pageConfigKey)}
                    aria-label={`Toggle ${pageConfigKey}`}
                  />
                </Box>

                {childTabs.map((tab) => {
                  const tabConfigKey = getRouteConfigKey(tab);
                  const tabEnabled = draftVisibility[tabConfigKey] !== false;
                  return (
                    <Box
                      key={tabConfigKey}
                      layoutClassName="ml-6 flex items-center justify-between gap-4 border-l-2 pl-4"
                      borderClassName="border-slate-200 dark:border-slate-700"
                    >
                      <Box layoutClassName="min-w-0 py-1">
                        <Box layoutClassName="flex items-center gap-2">
                          <Typography size="sm" layoutClassName="font-medium" textClassName="text-slate-800 dark:text-slate-100">
                            {t(tab.labelKey)}
                          </Typography>
                          <Badge
                            size="sm"
                            layoutClassName="px-2 py-0.5 text-[10px] uppercase"
                            borderClassName="border-transparent"
                            backgroundClassName="bg-blue-50 dark:bg-blue-900/20"
                            textClassName="text-blue-600 dark:text-blue-300"
                          >
                            tab
                          </Badge>
                        </Box>
                        <Typography size="xs" variant="muted" layoutClassName="mt-0.5">
                          {tab.parentPath} / {tab.tabId}
                        </Typography>
                      </Box>
                      <Switch
                        checked={tabEnabled}
                        onCheckedChange={() => handleToggle(tabConfigKey)}
                        aria-label={`Toggle ${tabConfigKey}`}
                      />
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Card>
      ) : null}
    </Box>
  );
};

export default SettingsPage;
