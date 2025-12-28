import React, { useState, useMemo, useEffect } from 'react';
import { Order, OrderStatus, PaymentStatus, Ingredient, IngredientHistoryType } from '@/types';
import { generateDashboardInsights } from '@/services/geminiService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrders } from '@/contexts/OrderContext';
import { fetchIngredients } from '@/services/ingredientService';
import { getOrderTotal } from '@/utils/orderUtils';
import DashboardMetrics from '@/pages/Dashboard/components/DashboardMetrics';
import DashboardChart from '@/pages/Dashboard/components/DashboardChart';
import DashboardInsights from '@/pages/Dashboard/components/DashboardInsights';
import DashboardRecentOrders from '@/pages/Dashboard/components/DashboardRecentOrders';
import DashboardRecentTransactions from '@/pages/Dashboard/components/DashboardRecentTransactions';
import DashboardRecentUsers from '@/pages/Dashboard/components/DashboardRecentUsers';

type TimeRange = 'week' | 'month' | 'year';

const DashboardPage: React.FC = () => {
  const { orders } = useOrders();
  const { language } = useLanguage();
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const isDarkMode = document.documentElement.classList.contains('dark');

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const data = await fetchIngredients();
        setIngredients(data);
      } catch (error) {
        console.error('Failed to load ingredients:', error);
      }
    };
    loadIngredients();
  }, []);

  useEffect(() => {
    setReferenceDate(new Date());
  }, [timeRange]);

  const { startDate, endDate, prevStartDate, prevEndDate } = useMemo(() => {
    const end = new Date(referenceDate);
    end.setHours(23, 59, 59, 999);
    
    const start = new Date(referenceDate);
    start.setHours(0, 0, 0, 0);

    const prevEnd = new Date(end);
    const prevStart = new Date(start);

    if (timeRange === 'week') {
      start.setDate(end.getDate() - 6);
      prevEnd.setDate(end.getDate() - 7);
      prevStart.setDate(start.getDate() - 7);
    } else if (timeRange === 'month') {
      // Set to first day of month
      start.setDate(1);
      // For end date, go to next month day 0
      const nextMonth = new Date(start);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(0);
      end.setTime(nextMonth.getTime());
      end.setHours(23, 59, 59, 999);

      // Previous month
      prevStart.setTime(start.getTime());
      prevStart.setMonth(prevStart.getMonth() - 1);
      
      prevEnd.setTime(prevStart.getTime());
      prevEnd.setMonth(prevEnd.getMonth() + 1);
      prevEnd.setDate(0);
      prevEnd.setHours(23, 59, 59, 999);
    } else if (timeRange === 'year') {
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      
      prevStart.setTime(start.getTime());
      prevStart.setFullYear(prevStart.getFullYear() - 1);
      
      prevEnd.setTime(end.getTime());
      prevEnd.setFullYear(prevEnd.getFullYear() - 1);
    }
    
    return { startDate: start, endDate: end, prevStartDate: prevStart, prevEndDate: prevEnd };
  }, [referenceDate, timeRange]);

  const isCurrentPeriod = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate.getTime() >= today.getTime() && startDate.getTime() <= today.getTime();
  }, [startDate, endDate]);

  const metrics = useMemo(() => {
    const currentOrders = orders.filter(o => {
      const d = new Date(o.createdAt.toDate());
      return d >= startDate && d <= endDate;
    }).filter(o => o.paymentStatus === PaymentStatus.PAID && o.status === OrderStatus.DELIVERED);

    const prevOrders = orders.filter(o => {
      const d = new Date(o.createdAt.toDate());
      return d >= prevStartDate && d <= prevEndDate;
    }).filter(o => o.paymentStatus === PaymentStatus.PAID && o.status === OrderStatus.DELIVERED);

    const currentRevenue = currentOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);
    const prevRevenue = prevOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);
    const revenueChange = prevRevenue === 0 ? (currentRevenue > 0 ? 100 : 0) : ((currentRevenue - prevRevenue) / prevRevenue) * 100;

    const calculateIngredientCost = (ingredients: Ingredient[], start: Date, end: Date): number => {
      return ingredients.reduce((total, ingredient) => {
        if (!ingredient.history) return total;
        const cost = ingredient.history.reduce((sum, item) => {
          if (item.type === IngredientHistoryType.IMPORT && item.price && item.importQuantity) {
            const itemDate = new Date(item.createdAt);
            if (itemDate >= start && itemDate <= end) {
              return sum + (item.price * item.importQuantity);
            }
          }
          return sum;
        }, 0);
        return total + cost;
      }, 0);
    };

    const currentIngredientCost = calculateIngredientCost(ingredients, startDate, endDate);
    const prevIngredientCost = calculateIngredientCost(ingredients, prevStartDate, prevEndDate);
    const ingredientCostChange = prevIngredientCost === 0 ? (currentIngredientCost > 0 ? 100 : 0) : ((currentIngredientCost - prevIngredientCost) / prevIngredientCost) * 100;

    return {
      revenue: currentRevenue,
      revenueChange,
      ingredientCost: currentIngredientCost,
      ingredientCostChange
    };
  }, [orders, ingredients, startDate, endDate, prevStartDate, prevEndDate]);

  const { currentRangeLabel, prevRangeLabel } = useMemo(() => {
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';
    
    const fmt = (s: Date, e: Date) => {
      if (timeRange === 'year') return s.toLocaleDateString(locale, { year: 'numeric' });
      if (timeRange === 'month') return s.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      
      const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return `${s.toLocaleDateString(locale, opts)} - ${e.toLocaleDateString(locale, opts)}`;
    };
    
    return {
      currentRangeLabel: fmt(startDate, endDate),
      prevRangeLabel: fmt(prevStartDate, prevEndDate)
    };
  }, [startDate, endDate, prevStartDate, prevEndDate, language, timeRange]);

  const handlePrev = () => {
    setReferenceDate(prev => {
      const d = new Date(prev);
      if (timeRange === 'week') d.setDate(d.getDate() - 7);
      else if (timeRange === 'month') d.setMonth(d.getMonth() - 1);
      else if (timeRange === 'year') d.setFullYear(d.getFullYear() - 1);
      return d;
    });
  };

  const handleNext = () => {
    setReferenceDate(prev => {
      const d = new Date(prev);
      if (timeRange === 'week') d.setDate(d.getDate() + 7);
      else if (timeRange === 'month') d.setMonth(d.getMonth() + 1);
      else if (timeRange === 'year') d.setFullYear(d.getFullYear() + 1);
      return d;
    });
  };

  const isFuture = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate.getTime() >= today.getTime();
  }, [endDate]);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;

  const { newOrdersToday } = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayOrders = orders.filter(o => {
      const d = new Date(o.createdAt.toDate());
      return d >= startOfDay;
    });
    return { newOrdersToday: todayOrders.length };
  }, [orders]);

  const chartData = useMemo(() => {
    const dataMap = new Map<string, number>();
    const iterDate = new Date(startDate);
    let safeGuard = 0;

    while (iterDate <= endDate && safeGuard < 366) {
      let key = '';
      if (timeRange === 'year') {
        key = iterDate.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', year: 'numeric' });
        iterDate.setMonth(iterDate.getMonth() + 1);
      } else {
        key = iterDate.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' });
        iterDate.setDate(iterDate.getDate() + 1);
      }
      if (!dataMap.has(key)) dataMap.set(key, 0);
      safeGuard++;
    }

    const filtered = orders.filter(order => {
      const d = new Date(order.createdAt.toDate());
      return d >= startDate && d <= endDate;
    });

    filtered.forEach(order => {
      if (order.paymentStatus === PaymentStatus.PAID && order.status === OrderStatus.DELIVERED) {
        const date = new Date(order.createdAt.toDate());
        let key = '';
        if (timeRange === 'year') {
          key = date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', year: 'numeric' });
        } else {
          key = date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' });
        }
        if (dataMap.has(key)) {
          dataMap.set(key, (dataMap.get(key) || 0) + getOrderTotal(order));
        }
      }
    });

    return Array.from(dataMap.entries()).map(([name, amount]) => ({ name, amount }));
  }, [orders, startDate, endDate, timeRange, language]);

  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    const result = await generateDashboardInsights(orders, language);
    setInsight(result);
    setLoadingInsight(false);
  };

  const recentOrdersForDashboard: Order[] = useMemo(
    () => [...orders].sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()),
    [orders]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardMetrics 
        metrics={metrics}
        totalOrders={totalOrders}
        newOrdersToday={newOrdersToday}
        pendingOrders={pendingOrders}
        timeRange={timeRange}
        currentRangeLabel={currentRangeLabel}
        prevRangeLabel={prevRangeLabel}
        isCurrentPeriod={isCurrentPeriod}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardChart 
          data={chartData}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          dateRangeLabel={currentRangeLabel}
          onPrev={handlePrev}
          onNext={handleNext}
          isFuture={isFuture}
          isDarkMode={isDarkMode}
        />
        <DashboardInsights 
          insight={insight}
          loading={loadingInsight}
          onGenerate={handleGenerateInsight}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardRecentOrders orders={recentOrdersForDashboard} />
        <DashboardRecentTransactions />
        <DashboardRecentUsers />
      </div>
    </div>
  );
};

export default DashboardPage;