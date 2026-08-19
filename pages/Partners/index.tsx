import React, { useState } from 'react';
import { Handshake, Users, Factory, Truck } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import CustomersPage from '@/pages/Customers';
import SuppliersPage from '@/pages/Suppliers';
import CarriersPage from './CarriersPage';

type Tab = 'customers' | 'suppliers' | 'carriers';

/**
 * Hub ĐỐI TÁC — gom 3 loại bên ngoài quán giao dịch, lọc theo loại:
 *  - Khách hàng (bên mua)  - Nhà cung cấp (bên bán NVL)  - Đơn vị vận chuyển (dịch vụ giao).
 */
const PartnersPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('customers');

  const tabBtn = (value: Tab, label: string, icon: React.ReactNode) => (
    <Button
      type="button"
      onClick={() => setTab(value)}
      variant={tab === value ? 'primary' : 'secondary'}
      leftIcon={icon}
      iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
      sizeClassName="px-3.5 py-1.5 text-sm"
      roundedClassName="rounded-lg"
      borderClassName={tab === value ? 'border border-primary-600' : 'border border-slate-200 dark:border-slate-600'}
      backgroundClassName={tab === value ? 'bg-primary-600' : 'bg-white dark:bg-slate-800'}
      textClassName={tab === value ? 'font-medium text-white' : 'text-slate-700 dark:text-slate-200'}
      layoutClassName="inline-flex items-center gap-1.5"
      disableVariantHover
      disableVariantTextColor
    >
      {label}
    </Button>
  );

  return (
    <Box layoutClassName="space-y-5">
      <Box layoutClassName="flex items-center gap-2.5">
        <Box layoutClassName="flex h-9 w-9 items-center justify-center rounded-xl" backgroundClassName="bg-primary-100 dark:bg-primary-900/30">
          <Handshake className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </Box>
        <Box>
          <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">Đối tác</Heading>
          <Typography as="p" size="xs" variant="muted">Khách hàng, nhà cung cấp và đơn vị vận chuyển.</Typography>
        </Box>
      </Box>

      <Box layoutClassName="flex flex-wrap gap-2">
        {tabBtn('customers', 'Khách hàng', <Users />)}
        {tabBtn('suppliers', 'Nhà cung cấp', <Factory />)}
        {tabBtn('carriers', 'Đơn vị vận chuyển', <Truck />)}
      </Box>

      {tab === 'customers' && <CustomersPage />}
      {tab === 'suppliers' && <SuppliersPage />}
      {tab === 'carriers' && <CarriersPage />}
    </Box>
  );
};

export default PartnersPage;
