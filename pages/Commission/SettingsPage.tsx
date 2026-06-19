import React, { useEffect, useState } from 'react';
import { Settings2, Percent, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProducts } from '@/hooks/queries/useProductsQuery';
import { useCommissionGroups } from '@/hooks/queries/useCommissionQuery';
import Spinner from '@/components/ui/Spinner';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import GroupsTab from './components/GroupsTab';
import ProductsTab from './components/ProductsTab';

type SettingsTab = 'groups' | 'products';

/* ════════════════════════════════════════ CÀI ĐẶT HOA HỒNG (super admin) ════ */
const CommissionSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('groups');
  const { groups, loading: groupsLoading, error: groupsError } = useCommissionGroups();
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const loading = groupsLoading || productsLoading;

  useEffect(() => {
    if (groupsError || productsError) toast.error('Không thể tải dữ liệu');
  }, [groupsError, productsError]);

  const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'groups',   label: 'Nhóm HH',  icon: <Percent className="h-3.5 w-3.5" /> },
    { key: 'products', label: 'Sản phẩm', icon: <DollarSign className="h-3.5 w-3.5" /> },
  ];

  return (
    <Box layoutClassName="flex h-full flex-col space-y-4 sm:space-y-5">
      {/* Header */}
      <Box layoutClassName="flex items-center gap-3">
        <Box layoutClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
          <Settings2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </Box>
        <Box>
          <Typography as="h1" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-slate-900 dark:text-white">
            Cài đặt hoa hồng
          </Typography>
          <Typography as="p" size="xs" variant="muted">
            Nhóm hoa hồng · Giá cost sản phẩm
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box layoutClassName="flex gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/60">
        {tabs.map(({ key, label, icon }) => {
          const active = activeTab === key;
          return (
            <Button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              variant="ghost"
              disableVariantHover
              disableVariantTextColor
              borderClassName="border-transparent"
              layoutClassName="flex flex-1 items-center justify-center gap-1.5"
              roundedClassName="rounded-lg"
              sizeClassName="px-3 py-2 text-xs"
              stateClassName="transition-all"
              backgroundClassName={active ? 'bg-white shadow-sm dark:bg-slate-700' : 'bg-transparent'}
              textClassName={active ? 'font-semibold text-slate-900 dark:text-white' : 'font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}>
              <Box layoutClassName={active ? 'text-primary-500' : ''}>{icon}</Box>
              {label}
            </Button>
          );
        })}
      </Box>

      {/* Content */}
      <Box layoutClassName="flex-1 overflow-y-auto">
        {loading ? (
          <Box layoutClassName="flex justify-center py-16">
            <Spinner size="lg" textClassName="text-primary-500" />
          </Box>
        ) : activeTab === 'groups' ? (
          <GroupsTab groups={groups} products={products} />
        ) : (
          <ProductsTab groups={groups} products={products} />
        )}
      </Box>
    </Box>
  );
};

export default CommissionSettingsPage;
