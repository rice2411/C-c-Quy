import React from 'react';
import { KpiGrid } from '@/components/ui/stats';
import { useKpis } from '@/hooks/useKpis';

interface DashboardKpiCockpitProps {
  fromISO: string;
  toISO: string;
  prevFromISO: string;
  prevToISO: string;
  /** Chú thích so sánh (vd "vs tháng 6"). */
  compareText: string;
}

/**
 * "Buồng lái" KPI điều hành — mỏng: lấy bộ KPI chuẩn từ metric layer (useKpis,
 * nguồn revenue_report) rồi render qua KpiGrid dùng chung → đồng nhất logic + UI.
 */
const DashboardKpiCockpit: React.FC<DashboardKpiCockpitProps> = ({
  fromISO, toISO, prevFromISO, prevToISO, compareText,
}) => {
  const { items, loading } = useKpis({ from: fromISO, to: toISO, prevFrom: prevFromISO, prevTo: prevToISO });
  return <KpiGrid items={items} loading={loading} compareText={compareText} columnsClassName="grid-cols-2 lg:grid-cols-4" />;
};

export default DashboardKpiCockpit;
