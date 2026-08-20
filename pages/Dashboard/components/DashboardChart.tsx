import React, { useState } from "react";
import { BarChart } from "lucide-react";
import Box from "@/components/ui/Box";
import Heading from "@/components/ui/Heading";
import Typography from "@/components/ui/Typography";
import EmptyState from "@/components/ui/EmptyState";
import { TrendChart } from "@/components/ui/stats";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatVND } from "@/utils/format/currencyUtil";

export interface DashboardChartPoint {
  name: string;
  revenue: number;
  cost: number;
  profit: number;
}

interface DashboardChartProps {
  data: DashboardChartPoint[];
  isDarkMode: boolean;
}

/** Các đường của biểu đồ doanh thu (khớp key trong chartData ở index.tsx). */
const SERIES = [
  { key: "revenue", label: "Doanh thu", color: "#4abab9", desc: "Doanh thu theo đơn giao trong kỳ (đã trừ hoàn/giảm giá)." },
  { key: "cost", label: "Chi phí (nhập/vận hành)", color: "#f97316", desc: "Giá vốn nhập hàng + chi phí vận hành + khấu hao (khớp báo cáo P&L)." },
  { key: "profit", label: "Lợi nhuận", color: "#22c55e", desc: "= Doanh thu − chi phí. Lãi kế toán, khớp Tổng quan/KPI." },
];

const DashboardChart: React.FC<DashboardChartProps> = ({ data, isDarkMode }) => {
  const { t } = useLanguage();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const visibleSeries = SERIES.filter((s) => !hidden.has(s.key));
  const hasData = data.some((d) => d.revenue || d.cost || d.profit);

  return (
    <Box
      layoutClassName="p-4 sm:p-6"
      borderClassName="border border-slate-100 dark:border-slate-700"
      backgroundClassName="bg-white dark:bg-slate-800"
      roundedClassName="rounded-xl"
      shadowClassName="shadow-sm"
      stateClassName="transition-colors"
    >
      <Box layoutClassName="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Heading level={3} textClassName="text-lg font-semibold text-slate-800 dark:text-white">
          {t("dashboard.revenueTrend")}
        </Heading>
        {/* Chú thích — bấm để tắt/mở đường; rê chuột xem giải thích. */}
        <Box layoutClassName="flex flex-wrap items-center gap-x-2 gap-y-1">
          {SERIES.map((s) => {
            const off = hidden.has(s.key);
            return (
              <Box
                key={s.key}
                role="button"
                onClick={() => toggle(s.key)}
                title={s.desc}
                layoutClassName="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1"
                backgroundClassName={off ? 'bg-transparent' : 'bg-slate-50 dark:bg-slate-700/40'}
                hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700/60"
                stateClassName="transition-colors"
              >
                <Box layoutClassName="h-2.5 w-2.5 shrink-0 rounded-full" borderClassName={off ? 'border border-slate-300 dark:border-slate-500' : ''} style={{ backgroundColor: off ? 'transparent' : s.color }} />
                <Typography as="span" size="xs" layoutClassName={off ? 'line-through' : ''} textClassName={off ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}>{s.label}</Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {hasData ? (
        <TrendChart
          data={data}
          xKey="name"
          series={visibleSeries}
          type="line"
          isDarkMode={isDarkMode}
          formatValue={formatVND}
          heightClassName="h-72 sm:h-80"
        />
      ) : (
        <Box layoutClassName="h-64 w-full sm:h-72">
          <EmptyState icon={<BarChart className="h-6 w-6" />} title="Không có dữ liệu trong kỳ này" />
        </Box>
      )}
    </Box>
  );
};

export default DashboardChart;
