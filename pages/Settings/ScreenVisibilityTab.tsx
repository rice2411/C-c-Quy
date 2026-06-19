import React, { useEffect, useMemo, useState } from 'react';
import { Save, Settings } from 'lucide-react';
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

/** Tab "Màn hình" của Cài đặt — bật/tắt hiển thị các màn hình trên menu. Là 1 route /settings/screens. */
const ScreenVisibilityTab: React.FC = () => {
  const { t } = useLanguage();
  const { screenVisibility, loading, saving, saveVisibility } = useScreenConfig();
  const [draftVisibility, setDraftVisibility] = useState<ScreenVisibilityMap>({});

  useEffect(() => {
    setDraftVisibility(screenVisibility);
  }, [screenVisibility]);

  // Loại trừ chính các route Cài đặt (/settings/*) khỏi danh sách — tránh tự tắt trang cài đặt.
  const pageItems = useMemo(() => {
    return routes.filter((route) => !route.path.startsWith('/settings') && route.path !== '/');
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
      <Box layoutClassName="flex items-center justify-between">
        <Box>
          <Heading level={2} textClassName="text-xl font-semibold">Quản lý màn hình</Heading>
          <Typography size="sm" variant="muted" layoutClassName="mt-1">
            Bật/tắt quyền hiển thị các màn hình trên menu điều hướng.
          </Typography>
        </Box>
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
      </Box>

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
    </Box>
  );
};

export default ScreenVisibilityTab;
