import React, { useEffect, useMemo, useState } from 'react';
import { Save, Settings, Database, ChevronRight, ChevronDown } from 'lucide-react';
import { getRouteConfigKey, routes, storageTabRoutes } from '@/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScreenConfig } from '@/contexts/ScreenConfigContext';
import { ScreenVisibilityMap } from '@/types';
import toast from 'react-hot-toast';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

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
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'customers', label: 'Customers' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'users', label: 'Users' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'configurations', label: 'Configurations' },
];

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
  const [activeTab, setActiveTab] = useState<'screens' | 'database'>('screens');
  const [selectedCollection, setSelectedCollection] = useState<string>(DATABASE_COLLECTIONS[0].id);
  const [collectionRecords, setCollectionRecords] = useState<Record<string, DbRecord[]>>({});
  const [loadingCollectionId, setLoadingCollectionId] = useState<string | null>(null);
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
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-5 space-y-4">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/60">
            <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-orange-500" />
              Database Explorer
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hiển thị toàn bộ record của bảng được chọn.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Bảng dữ liệu</p>
              </div>
              <div className="max-h-[500px] overflow-y-auto p-2 space-y-1">
                {DATABASE_COLLECTIONS.map((item) => {
                  const active = selectedCollection === item.id;
                  const loadedCount = collectionRecords[item.id]?.length;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedCollection(item.id);
                        setExpandedRecordId(null);
                        if (!collectionRecords[item.id]) {
                          loadCollectionRecords(item.id);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm border transition-colors ${
                        active
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-orange-200 dark:hover:border-orange-700'
                      }`}
                    >
                      <span className="font-medium text-left">{item.label}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{loadedCount != null ? loadedCount : '-'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Records: {selectedCollection}
                </p>
                {loadingCollectionId === selectedCollection ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Đang tải...</p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedRecords.length} record</p>
                )}
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {selectedRecords.length === 0 && loadingCollectionId !== selectedCollection ? (
                  <p className="p-4 text-sm text-slate-500 dark:text-slate-400">Không có record hoặc chưa tải dữ liệu.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {selectedRecords.map((record) => {
                      const expanded = expandedRecordId === record.id;
                      const previewKeys = Object.keys(record.data).slice(0, 3);
                      return (
                        <div key={record.id}>
                          <button
                            type="button"
                            onClick={() => setExpandedRecordId(expanded ? null : record.id)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{record.id}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {previewKeys.length > 0 ? previewKeys.join(', ') : '(no fields)'}
                                </p>
                              </div>
                              {expanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </button>
                          {expanded && (
                            <div className="px-4 pb-4">
                              <pre className="text-xs bg-slate-900 text-slate-100 rounded-lg p-3 overflow-auto">
                                {JSON.stringify(record.data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;