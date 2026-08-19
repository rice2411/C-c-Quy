import React, { useEffect, useMemo, useState } from 'react';
import { Save, Settings } from 'lucide-react';
import { getRouteConfigKey, routes, storageTabRoutes } from '@/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScreenConfig } from '@/contexts/ScreenConfigContext';
import { useRoles } from '@/hooks/queries/useRolesQuery';
import { ScreenVisibilityMap, ScreenRolesMap } from '@/types';
import { UserRole } from '@/types/user';
import RoleManagerCard from './RoleManagerCard';
import toast from 'react-hot-toast';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Spinner from '@/components/ui/Spinner';
import Switch from '@/components/ui/Switch';
import Typography from '@/components/ui/Typography';

const sameSet = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((x) => b.includes(x));

/** Tab "Màn hình" của Cài đặt — bật/tắt hiển thị + chỉnh ROLE được truy cập mỗi màn. Route /settings/screens. */
const ScreenVisibilityTab: React.FC = () => {
  const { t } = useLanguage();
  const { screenVisibility, screenRoles, loading, saving, saveConfig } = useScreenConfig();
  const { roles } = useRoles();
  const [draftVisibility, setDraftVisibility] = useState<ScreenVisibilityMap>({});
  const [draftRoles, setDraftRoles] = useState<ScreenRolesMap>({});

  // Options role cho chip phân quyền màn — lấy từ danh sách vai trò ĐỘNG.
  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r.key as UserRole, label: r.name })),
    [roles],
  );

  useEffect(() => {
    setDraftVisibility(screenVisibility);
    setDraftRoles(screenRoles);
  }, [screenVisibility, screenRoles]);

  // Loại trừ chính các route Cài đặt (/settings/*) + Dashboard khỏi danh sách — tránh tự khoá mình ra.
  const pageItems = useMemo(
    () => routes.filter((route) => !route.path.startsWith('/settings') && route.path !== '/'),
    [],
  );
  const tabItems = useMemo(() => storageTabRoutes, []);

  const childTabsByParent = useMemo(() => {
    return tabItems.reduce<Record<string, typeof tabItems>>((acc, tab) => {
      const parent = tab.parentPath || '';
      if (!acc[parent]) acc[parent] = [];
      acc[parent].push(tab);
      return acc;
    }, {});
  }, [tabItems]);

  /** Role hiệu lực đang chỉnh cho 1 màn (override draft, else mặc định route.roles). */
  const rolesOf = (key: string, def: UserRole[]): UserRole[] =>
    (draftRoles[key] as UserRole[] | undefined) ?? def;

  const hasChanged = useMemo(() => {
    const allItems = [...pageItems, ...tabItems];
    return allItems.some((item) => {
      const key = getRouteConfigKey(item);
      const visChanged = (draftVisibility[key] !== false) !== (screenVisibility[key] !== false);
      const savedRoles = screenRoles[key] ?? item.roles;
      const rolesChanged = !sameSet(rolesOf(key, item.roles), savedRoles);
      return visChanged || rolesChanged;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftVisibility, draftRoles, pageItems, tabItems, screenVisibility, screenRoles]);

  const handleToggle = (configKey: string) => {
    setDraftVisibility((prev) => ({
      ...prev,
      [configKey]: prev[configKey] === false ? true : false,
    }));
  };

  const toggleRole = (key: string, def: UserRole[], role: UserRole) => {
    setDraftRoles((prev) => {
      const cur = prev[key] ?? def;
      const next = cur.includes(role) ? cur.filter((r) => r !== role) : [...cur, role];
      return { ...prev, [key]: next };
    });
  };

  const handleSave = async () => {
    // Gửi FULL visibility (mọi màn) + roles CHỈ nơi khác mặc định (BE: mảng rỗng → dùng mặc định).
    const allItems = [...pageItems, ...tabItems];
    const visPayload: ScreenVisibilityMap = { ...draftVisibility };
    const rolesPayload: ScreenRolesMap = {};
    allItems.forEach((item) => {
      const key = getRouteConfigKey(item);
      visPayload[key] = draftVisibility[key] !== false;
      const eff = rolesOf(key, item.roles);
      if (!sameSet(eff, item.roles)) rolesPayload[key] = eff;
    });
    try {
      await saveConfig(visPayload, rolesPayload);
      toast.success('Đã lưu cấu hình màn hình');
    } catch (error) {
      console.error('Failed to save screen config', error);
      toast.error('Không thể lưu cấu hình màn hình');
    }
  };

  /** Hàng chip chọn role được phép truy cập 1 màn. */
  const roleChips = (key: string, def: UserRole[]) => {
    const cur = rolesOf(key, def);
    const overridden = draftRoles[key] !== undefined && !sameSet(cur, def);
    return (
      <Box layoutClassName="flex flex-wrap items-center gap-1.5">
        <Typography size="xs" variant="muted">Quyền:</Typography>
        {roleOptions.map((r) => {
          const on = cur.includes(r.value);
          return (
            <Button
              key={r.value}
              type="button"
              onClick={() => toggleRole(key, def, r.value)}
              variant={on ? 'primary' : 'secondary'}
              sizeClassName="px-2 py-0.5 text-[11px]"
              roundedClassName="rounded"
              borderClassName={on ? 'border border-primary-600' : 'border border-slate-200 dark:border-slate-600'}
              backgroundClassName={on ? 'bg-primary-600' : 'bg-white dark:bg-slate-800'}
              textClassName={on ? 'font-medium text-white' : 'text-slate-500 dark:text-slate-400'}
              disableVariantHover
              disableVariantTextColor
            >
              {r.label}
            </Button>
          );
        })}
        {overridden && (
          <Badge
            size="sm"
            layoutClassName="px-1.5 py-0.5 text-[10px]"
            borderClassName="border-transparent"
            backgroundClassName="bg-amber-100 dark:bg-amber-900/30"
            textClassName="text-amber-700 dark:text-amber-300"
          >
            đã đổi
          </Badge>
        )}
      </Box>
    );
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
            Bật/tắt hiển thị + chọn role được truy cập từng màn (thay vì cố định trong code).
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

      <RoleManagerCard />

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
              {roleChips(pageConfigKey, page.roles)}

              {childTabs.map((tab) => {
                const tabConfigKey = getRouteConfigKey(tab);
                const tabEnabled = draftVisibility[tabConfigKey] !== false;
                return (
                  <Box
                    key={tabConfigKey}
                    layoutClassName="ml-6 space-y-2 border-l-2 pl-4"
                    borderClassName="border-slate-200 dark:border-slate-700"
                  >
                    <Box layoutClassName="flex items-center justify-between gap-4">
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
                    {roleChips(tabConfigKey, tab.roles)}
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
