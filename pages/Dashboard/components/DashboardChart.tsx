import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { ChevronLeft, ChevronRight, BarChart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type TimeRange = 'week' | 'month' | 'year';

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
  isDarkMode
}) => {
  const { t } = useLanguage();

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
         <div className="w-full sm:w-auto">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2 sm:mb-0">{t('dashboard.revenueTrend')}</h3>
            <div className="flex items-center justify-between sm:justify-start gap-2 mt-1 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-lg sm:bg-transparent sm:p-0">
               <button 
                onClick={onPrev}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm sm:shadow-none text-slate-500 dark:text-slate-400 transition-all"
               >
                 <ChevronLeft size={16} />
               </button>
               <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-full sm:w-48 text-center">{dateRangeLabel}</span>
               <button 
                onClick={onNext}
                disabled={isFuture}
                className={`p-1.5 rounded-md shadow-sm sm:shadow-none text-slate-500 dark:text-slate-400 transition-all ${isFuture ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white dark:hover:bg-slate-700'}`}
               >
                 <ChevronRight size={16} />
               </button>
            </div>
         </div>
         
         <div className="w-full sm:w-auto flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
            {(['week', 'month', 'year'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  timeRange === range 
                    ? 'bg-white dark:bg-slate-600 text-orange-600 dark:text-orange-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {range === 'week' && t('dashboard.filterWeek')}
                {range === 'month' && t('dashboard.filterMonth')}
                {range === 'year' && t('dashboard.filterYear')}
              </button>
            ))}
         </div>
      </div>
      
      <div className="h-64 sm:h-72 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#f1f5f9"} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11}} 
                dy={10} 
                minTickGap={30}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11}} 
                tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(value)} 
              />
              <Tooltip 
                formatter={(value: number) => [formatVND(value), "Revenue"]}
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#1e293b' : '#fff', 
                  borderRadius: '8px', 
                  border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  color: isDarkMode ? '#f8fafc' : '#0f172a'
                }}
                itemStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontWeight: 600 }}
                labelStyle={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#ea580c" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                dot={{ r: 3, fill: '#ea580c', strokeWidth: 2, stroke: isDarkMode ? '#1e293b' : '#fff' }} 
                activeDot={{ r: 6, strokeWidth: 0 }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <BarChart size={40} className="mb-2 opacity-20" />
            <p className="text-sm">No data for this period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardChart;