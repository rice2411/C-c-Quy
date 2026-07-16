import React from "react";
import { BarChart } from "lucide-react";
import Box from "@/components/ui/Box";
import Heading from "@/components/ui/Heading";
import EmptyState from "@/components/ui/EmptyState";
import { TrendChart } from "@/components/ui/stats";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatVND } from "@/utils/format/currencyUtil";

interface DashboardChartProps {
  data: { name: string; amount: number }[];
  isDarkMode: boolean;
}

// Bộ chọn kỳ (Tuần/Tháng/Năm) + điều hướng ‹ kỳ › đã được tách ra
// DashboardRangeControl và đặt ở header vùng "Phân tích" trong index.tsx.
const DashboardChart: React.FC<DashboardChartProps> = ({ data, isDarkMode }) => {
  const { t } = useLanguage();

  return (
    <Box
      layoutClassName="p-4 sm:p-6"
      borderClassName="border border-slate-100 dark:border-slate-700"
      backgroundClassName="bg-white dark:bg-slate-800"
      roundedClassName="rounded-xl"
      shadowClassName="shadow-sm"
      stateClassName="transition-colors"
    >
      <Box layoutClassName="mb-6">
        <Heading
          level={3}
          textClassName="text-lg font-semibold text-slate-800 dark:text-white"
        >
          {t("dashboard.revenueTrend")}
        </Heading>
      </Box>

      {data.length > 0 ? (
        <TrendChart
          data={data}
          xKey="name"
          series={[{ key: 'amount', label: t('dashboard.revenueTrend'), color: '#4abab9' }]}
          type="area"
          isDarkMode={isDarkMode}
          formatValue={formatVND}
          heightClassName="h-64 sm:h-72"
          showDots
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
