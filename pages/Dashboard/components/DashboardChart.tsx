import React from "react";
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
  theoretical: number;
  actual: number;
  cost: number;
  personal: number;
  profit: number;
}

interface DashboardChartProps {
  data: DashboardChartPoint[];
  isDarkMode: boolean;
}

/** Các đường của biểu đồ doanh thu (khớp key trong chartData ở index.tsx). */
const SERIES = [
  { key: "theoretical", label: "DT lý thuyết", color: "#94a3b8" },
  { key: "actual", label: "DT thực tế", color: "#4abab9" },
  { key: "cost", label: "Chi phí (nhập/vận hành)", color: "#f97316" },
  { key: "personal", label: "Chi phí cá nhân", color: "#a855f7" },
  { key: "profit", label: "Lợi nhuận", color: "#22c55e" },
];

const DashboardChart: React.FC<DashboardChartProps> = ({ data, isDarkMode }) => {
  const { t } = useLanguage();
  const hasData = data.some((d) => d.theoretical || d.actual || d.cost || d.personal);

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
        {/* Chú thích các đường */}
        <Box layoutClassName="flex flex-wrap items-center gap-x-3 gap-y-1">
          {SERIES.map((s) => (
            <Box key={s.key} layoutClassName="inline-flex items-center gap-1.5">
              <Box layoutClassName="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <Typography as="span" size="xs" textClassName="text-slate-500 dark:text-slate-400">{s.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {hasData ? (
        <TrendChart
          data={data}
          xKey="name"
          series={SERIES}
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
