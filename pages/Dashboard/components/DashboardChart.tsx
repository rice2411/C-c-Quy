import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart } from "lucide-react";
import Box from "@/components/ui/Box";
import Heading from "@/components/ui/Heading";
import Typography from "@/components/ui/Typography";
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

      <Box layoutClassName="h-64 w-full sm:h-72">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4abab9" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#4abab9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDarkMode ? "#334155" : "#f1f5f9"}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: isDarkMode ? "#94a3b8" : "#64748b",
                  fontSize: 11,
                }}
                dy={10}
                minTickGap={30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: isDarkMode ? "#94a3b8" : "#64748b",
                  fontSize: 11,
                }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("vi-VN", {
                    notation: "compact",
                  }).format(value)
                }
              />
              <Tooltip
                formatter={(value: number) => [formatVND(value), "Revenue"]}
                contentStyle={{
                  backgroundColor: isDarkMode ? "#1e293b" : "#fff",
                  borderRadius: "8px",
                  border: isDarkMode
                    ? "1px solid #334155"
                    : "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  color: isDarkMode ? "#f8fafc" : "#0f172a",
                }}
                itemStyle={{
                  color: isDarkMode ? "#f8fafc" : "#0f172a",
                  fontWeight: 600,
                }}
                labelStyle={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#4abab9"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                dot={{
                  r: 3,
                  fill: "#4abab9",
                  strokeWidth: 2,
                  stroke: isDarkMode ? "#1e293b" : "#fff",
                }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Box
            layoutClassName="flex h-full w-full flex-col items-center justify-center"
            textClassName="text-slate-400 dark:text-slate-500"
          >
            <BarChart size={40} className="mb-2 opacity-20" />
            <Typography size="sm">No data for this period</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DashboardChart;
