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
import { ChevronLeft, ChevronRight, BarChart } from "lucide-react";
import Button from "@/components/ui/Button";
import Box from "@/components/ui/Box";
import Heading from "@/components/ui/Heading";
import IconButton from "@/components/ui/IconButton";
import Typography from "@/components/ui/Typography";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatVND } from "@/utils/currencyUtil";

type TimeRange = "week" | "month" | "year";

interface DashboardChartProps {
  data: { name: string; amount: number }[];
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  dateRangeLabel: string;
  onPrev: () => void;
  onNext: () => void;
  isFuture: boolean;
  isDarkMode: boolean;
}

const DashboardChart: React.FC<DashboardChartProps> = ({
  data,
  timeRange,
  setTimeRange,
  dateRangeLabel,
  onPrev,
  onNext,
  isFuture,
  isDarkMode,
}) => {
  const { t } = useLanguage();

  return (
    <Box
      layoutClassName="p-4 lg:col-span-2 sm:p-6"
      borderClassName="border border-slate-100 dark:border-slate-700"
      backgroundClassName="bg-white dark:bg-slate-800"
      roundedClassName="rounded-xl"
      shadowClassName="shadow-sm"
      stateClassName="transition-colors"
    >
      <Box layoutClassName="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Box layoutClassName="w-full sm:w-auto">
          <Heading
            level={3}
            layoutClassName="mb-2 sm:mb-0"
            textClassName="text-lg font-semibold text-slate-800 dark:text-white"
          >
            {t("dashboard.revenueTrend")}
          </Heading>
          <Box
            layoutClassName="mt-1 flex items-center justify-between gap-2 p-1 sm:justify-start sm:p-0"
            roundedClassName="rounded-lg"
            backgroundClassName="bg-slate-50 dark:bg-slate-900/50 sm:bg-transparent"
          >
            <IconButton
              onClick={onPrev}
              label={t("common.previous") ?? "Previous"}
              size="sm"
              sizeClassName="h-8 w-8"
              roundedClassName="rounded-md"
              shadowClassName="shadow-sm sm:shadow-none"
              stateClassName="transition-all"
              textClassName="text-slate-500 dark:text-slate-400"
            >
              <ChevronLeft size={16} />
            </IconButton>
            <Typography
              as="span"
              size="xs"
              layoutClassName="w-full text-center sm:w-48"
              textClassName="font-medium text-slate-600 dark:text-slate-300"
            >
              {dateRangeLabel}
            </Typography>
            <IconButton
              onClick={onNext}
              label={t("common.next") ?? "Next"}
              size="sm"
              disabled={isFuture}
              sizeClassName="h-8 w-8"
              roundedClassName="rounded-md"
              shadowClassName="shadow-sm sm:shadow-none"
              textClassName="text-slate-500 dark:text-slate-400"
              stateClassName={`transition-all ${isFuture ? "opacity-30 cursor-not-allowed" : ""}`}
              hoverClassName={isFuture ? "" : "hover:bg-white dark:hover:bg-slate-700"}
            >
              <ChevronRight size={16} />
            </IconButton>
          </Box>
        </Box>

        <Box
          layoutClassName="flex w-full p-1 sm:w-auto"
          roundedClassName="rounded-lg"
          backgroundClassName="bg-slate-100 dark:bg-slate-700"
        >
          {(["week", "month", "year"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              onClick={() => setTimeRange(range)}
              variant="ghost"
              size="sm"
              layoutClassName="flex-1 transition-all sm:flex-none"
              sizeClassName="px-3 py-1.5"
              textClassName={`text-xs font-medium ${
                timeRange === range
                  ? "text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
              roundedClassName="rounded-md"
              shadowClassName="shadow-none"
              borderClassName="border-0"
              baseClassName="appearance-none"
              stateClassName="active:!outline-none active:!shadow-none"
              backgroundClassName={
                timeRange === range ? "bg-white dark:bg-slate-600" : ""
              }
            >
              {range === "week" && t("dashboard.filterWeek")}
              {range === "month" && t("dashboard.filterMonth")}
              {range === "year" && t("dashboard.filterYear")}
            </Button>
          ))}
        </Box>
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
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
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
                stroke="#ea580c"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                dot={{
                  r: 3,
                  fill: "#ea580c",
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
