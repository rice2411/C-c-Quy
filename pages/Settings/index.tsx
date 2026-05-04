import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Database, MessageCircle, Save, Settings, Trash2 } from 'lucide-react';
import { getRouteConfigKey, routes, storageTabRoutes } from '@/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScreenConfig } from '@/contexts/ScreenConfigContext';
import { ScreenVisibilityMap } from '@/types';
import toast from 'react-hot-toast';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/config/firebase';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Spinner from '@/components/ui/Spinner';
import Switch from '@/components/ui/Switch';
import Typography from '@/components/ui/Typography';
import ZaloSettingsTab from '@/pages/Settings/ZaloSettingsTab';
import ProductDatabaseToolsPanel from '@/pages/Settings/ProductDatabaseToolsPanel';

interface DbCollectionConfig {
  id: string;
  label: string;
}

interface DbRecord {
  id: string;
  data: Record<string, any>;
}

const DATABASE_COLLECTIONS: DbCollectionConfig[] = [
  { id: 'orders', label: 'Orders' },
  { id: 'products', label: 'Products' },
  { id: 'stock_receipts', label: 'Stock Receipts' },
  { id: 'customers', label: 'Customers' },
  { id: 'users', label: 'Users' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'configurations', label: 'Configurations' },
];

const FIRESTORE_BATCH_MAX = 500;

const toSerializable = (value: any): any => {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(toSerializable);
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      try {
        return value.toDate().toISOString();
      } catch {
        return String(value);
      }
    }
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toSerializable(v)]));
  }
  return value;
};

const SettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const { screenVisibility, loading, saving, saveVisibility } = useScreenConfig();
  const [draftVisibility, setDraftVisibility] = useState<ScreenVisibilityMap>({});
  const [activeTab, setActiveTab] = useState<'screens' | 'database' | 'zalo'>('screens');
  const [selectedCollection, setSelectedCollection] = useState<string>(DATABASE_COLLECTIONS[0].id);
  const [collectionRecords, setCollectionRecords] = useState<Record<string, DbRecord[]>>({});
  const [loadingCollectionId, setLoadingCollectionId] = useState<string | null>(null);
  const [deletingCollectionId, setDeletingCollectionId] = useState<string | null>(null);
  const [productToolsStatsNonce, setProductToolsStatsNonce] = useState(0);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

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

  const loadCollectionRecords = async (collectionId: string) => {
    setLoadingCollectionId(collectionId);
    try {
      const snapshot = await getDocs(collection(db, collectionId));
      const records: DbRecord[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        data: toSerializable(docSnap.data()) as Record<string, any>,
      }));
      setCollectionRecords((prev) => ({ ...prev, [collectionId]: records }));
    } catch (error) {
      console.error(`Failed to load collection ${collectionId}`, error);
      toast.error(`Không thể tải bảng ${collectionId}`);
    } finally {
      setLoadingCollectionId(null);
    }
  };

  useEffect(() => {
    if (activeTab !== 'database') return;
    if (collectionRecords[selectedCollection]) return;
    loadCollectionRecords(selectedCollection);
  }, [activeTab, selectedCollection]);

  const selectedRecords = collectionRecords[selectedCollection] || [];

  const handleDeleteEntireCollection = async () => {
    const collectionId = selectedCollection;
    const label = DATABASE_COLLECTIONS.find((c) => c.id === collectionId)?.label ?? collectionId;
    const count = selectedRecords.length;

    const msg1 = `Xóa HẾT document trong bảng "${label}" (${collectionId})?\nHiện có ${count} record (theo lần tải gần nhất).\n\nThao tác không hoàn tác.`;
    if (!window.confirm(msg1)) return;
    if (!window.confirm('Xác nhận lần 2: tiếp tục xóa toàn bộ document trong bảng này?')) return;

    setDeletingCollectionId(collectionId);
    try {
      const snapshot = await getDocs(collection(db, collectionId));
      const refs = snapshot.docs.map((d) => doc(db, collectionId, d.id));
      for (let i = 0; i < refs.length; i += FIRESTORE_BATCH_MAX) {
        const batch = writeBatch(db);
        for (const ref of refs.slice(i, i + FIRESTORE_BATCH_MAX)) {
          batch.delete(ref);
        }
        await batch.commit();
      }
      setCollectionRecords((prev) => ({ ...prev, [collectionId]: [] }));
      setExpandedRecordId(null);
      if (collectionId === 'products') {
        setProductToolsStatsNonce((n) => n + 1);
      }
      toast.success(`Đã xóa ${refs.length} document trong ${collectionId}`);
    } catch (error) {
      console.error(`Failed to delete collection ${collectionId}`, error);
      toast.error(`Không thể xóa bảng ${collectionId}`);
    } finally {
      setDeletingCollectionId(null);
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
                ? 'text-orange-500 dark:text-orange-400'
                : 'text-slate-500 hover:text-orange-500 dark:text-slate-300 dark:hover:text-orange-400'
            }
            stateClassName="transition-colors duration-200"
          >
            Màn hình
            {activeTab === 'screens' && (
              <Box
                layoutClassName="absolute -bottom-[1px] left-0 right-0 h-0.5"
                roundedClassName="rounded-full"
                backgroundClassName="bg-orange-500 dark:bg-orange-400"
              />
            )}
          </Button>
          <Button
            type="button"
            onClick={() => setActiveTab('database')}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            roundedClassName="rounded-none"
            layoutClassName="relative pb-2 text-sm font-semibold uppercase tracking-wide"
            textClassName={
              activeTab === 'database'
                ? 'text-orange-500 dark:text-orange-400'
                : 'text-slate-500 hover:text-orange-500 dark:text-slate-300 dark:hover:text-orange-400'
            }
            stateClassName="transition-colors duration-200"
          >
            Database
            {activeTab === 'database' && (
              <Box
                layoutClassName="absolute -bottom-[1px] left-0 right-0 h-0.5"
                roundedClassName="rounded-full"
                backgroundClassName="bg-orange-500 dark:bg-orange-400"
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
                ? 'text-orange-500 dark:text-orange-400'
                : 'text-slate-500 hover:text-orange-500 dark:text-slate-300 dark:hover:text-orange-400'
            }
            stateClassName="transition-colors duration-200"
          >
            Zalo
            {activeTab === 'zalo' && (
              <Box
                layoutClassName="absolute -bottom-[1px] left-0 right-0 h-0.5"
                roundedClassName="rounded-full"
                backgroundClassName="bg-orange-500 dark:bg-orange-400"
              />
            )}
          </Button>
        </Box>
      </Box>

      <Box layoutClassName="flex items-center justify-between">
        <Box>
          {activeTab === 'screens' ? (
            <>
              <Heading level={2} textClassName="text-xl font-semibold">Quản lý màn hình</Heading>
              <Typography size="sm" variant="muted" layoutClassName="mt-1">
                Bật/tắt quyền hiển thị các màn hình trên menu điều hướng.
              </Typography>
            </>
          ) : activeTab === 'database' ? (
            <>
              <Heading level={2} textClassName="text-xl font-semibold">Quản lý database</Heading>
              <Typography size="sm" variant="muted" layoutClassName="mt-1">
                Theo dõi cấu hình dữ liệu hệ thống và các bộ sưu tập đang dùng.
              </Typography>
            </>
          ) : (
            <>
              <Heading level={2} textClassName="flex items-center gap-2 text-xl font-semibold">
                <MessageCircle className="h-6 w-6 text-orange-500" />
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
            backgroundClassName="bg-orange-600"
            hoverClassName="hover:bg-orange-700"
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

      {activeTab === 'zalo' ? (
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
      ) : (
        <Card
          padding="none"
          borderClassName="border-slate-200 dark:border-slate-700"
          layoutClassName="space-y-4 p-4 md:p-5"
        >
          <Card
            padding="md"
            roundedClassName="rounded-lg"
            borderClassName="border-slate-200 dark:border-slate-700"
            backgroundClassName="bg-slate-50 dark:bg-slate-800/60"
          >
            <Typography size="sm" layoutClassName="flex items-center gap-2 font-semibold">
              <Database className="h-4 w-4 text-orange-500" />
              Database Explorer
            </Typography>
            <Typography size="xs" variant="muted" layoutClassName="mt-1">
              Danh sách bảng và record bên trái; công cụ bulk cho collection{' '}
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">products</span> bên phải — màn hẹp: cuộn xuống để dùng cả hai.
            </Typography>
          </Card>

          <Box layoutClassName="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
            <Box layoutClassName="min-w-0 space-y-4 lg:col-span-7">
          <Box layoutClassName="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card padding="none" roundedClassName="rounded-lg" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="overflow-hidden">
              <Box
                layoutClassName="border-b px-3 py-2"
                borderClassName="border-slate-200 dark:border-slate-700"
                backgroundClassName="bg-slate-50 dark:bg-slate-700/50"
              >
                <Typography size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-600 dark:text-slate-300">
                  Bảng dữ liệu
                </Typography>
              </Box>
              <Box layoutClassName="max-h-[500px] space-y-1 overflow-y-auto p-2">
                {DATABASE_COLLECTIONS.map((item) => {
                  const active = selectedCollection === item.id;
                  const loadedCount = collectionRecords[item.id]?.length;
                  return (
                    <Button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedCollection(item.id);
                        setExpandedRecordId(null);
                        if (!collectionRecords[item.id]) {
                          loadCollectionRecords(item.id);
                        }
                      }}
                      variant="ghost"
                      disableVariantHover
                      disableVariantTextColor
                      sizeClassName="px-3 py-2"
                      roundedClassName="rounded-lg"
                      borderClassName={
                        active
                          ? 'border border-orange-200 dark:border-orange-700'
                          : 'border border-slate-200 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-700'
                      }
                      backgroundClassName={active ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-white dark:bg-slate-800'}
                      textClassName={
                        active
                          ? 'text-sm text-orange-700 dark:text-orange-300'
                          : 'text-sm text-slate-700 dark:text-slate-300'
                      }
                      layoutClassName="w-full items-center justify-between"
                      stateClassName="transition-colors"
                    >
                      <Typography as="span" layoutClassName="font-medium text-left">{item.label}</Typography>
                      <Typography as="span" size="xs" variant="muted">{loadedCount != null ? loadedCount : '-'}</Typography>
                    </Button>
                  );
                })}
              </Box>
            </Card>

            <Card padding="none" roundedClassName="rounded-lg" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="overflow-hidden lg:col-span-2">
              <Box
                layoutClassName="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"
                borderClassName="border-slate-200 dark:border-slate-700"
                backgroundClassName="bg-slate-50 dark:bg-slate-700/50"
              >
                <Typography size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-600 dark:text-slate-300">
                  Records: {selectedCollection}
                </Typography>
                <Box layoutClassName="flex flex-wrap items-center justify-end gap-2">
                  {loadingCollectionId === selectedCollection ? (
                    <Typography size="xs" variant="muted">Đang tải...</Typography>
                  ) : (
                    <Typography size="xs" variant="muted">{selectedRecords.length} record</Typography>
                  )}
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => void handleDeleteEntireCollection()}
                    disabled={
                      loadingCollectionId === selectedCollection || deletingCollectionId === selectedCollection
                    }
                    leftIcon={
                      deletingCollectionId === selectedCollection ? (
                        <Spinner size="sm" textClassName="text-white" borderClassName="border-white" />
                      ) : (
                        <Trash2 />
                      )
                    }
                    iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
                    sizeClassName="px-2.5 py-1 text-xs"
                    roundedClassName="rounded-md"
                    layoutClassName="inline-flex items-center gap-1.5"
                    stateClassName="disabled:cursor-not-allowed disabled:opacity-50"
                    disableVariantHover
                    disableVariantTextColor
                  >
                    Xóa bảng
                  </Button>
                </Box>
              </Box>
              <Box layoutClassName="max-h-[500px] overflow-y-auto">
                {selectedRecords.length === 0 && loadingCollectionId !== selectedCollection ? (
                  <Typography size="sm" variant="muted" layoutClassName="p-4">
                    Không có record hoặc chưa tải dữ liệu.
                  </Typography>
                ) : (
                  <Box layoutClassName="divide-y divide-slate-100 dark:divide-slate-700">
                    {selectedRecords.map((record) => {
                      const expanded = expandedRecordId === record.id;
                      const previewKeys = Object.keys(record.data).slice(0, 3);
                      return (
                        <Box key={record.id}>
                          <Button
                            type="button"
                            onClick={() => setExpandedRecordId(expanded ? null : record.id)}
                            variant="ghost"
                            disableVariantHover
                            disableVariantTextColor
                            sizeClassName="px-4 py-3"
                            layoutClassName="w-full justify-start text-left"
                            hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700/40"
                            stateClassName="transition-colors"
                          >
                            <Box layoutClassName="flex w-full items-center justify-between gap-3 text-left">
                              <Box layoutClassName="min-w-0">
                                <Typography size="sm" layoutClassName="truncate font-semibold">{record.id}</Typography>
                                <Typography size="xs" variant="muted" layoutClassName="truncate">
                                  {previewKeys.length > 0 ? previewKeys.join(', ') : '(no fields)'}
                                </Typography>
                              </Box>
                              {expanded ? (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              )}
                            </Box>
                          </Button>
                          {expanded && (
                            <Box layoutClassName="px-4 pb-4">
                              <Box
                                layoutClassName="overflow-auto p-3 text-xs"
                                roundedClassName="rounded-lg"
                                backgroundClassName="bg-slate-900"
                                textClassName="text-slate-100"
                              >
                                <pre>{JSON.stringify(record.data, null, 2)}</pre>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Card>
          </Box>
            </Box>

            <Box
              layoutClassName="min-w-0 lg:col-span-5 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-1"
              borderClassName="lg:border-l lg:border-slate-200 lg:pl-4 lg:dark:border-slate-700"
            >
              <ProductDatabaseToolsPanel
                refreshStatsNonce={productToolsStatsNonce}
                onMutate={() => {
                  void loadCollectionRecords('products');
                }}
              />
            </Box>
          </Box>
        </Card>
      )}
    </Box>
  );
};

export default SettingsPage;