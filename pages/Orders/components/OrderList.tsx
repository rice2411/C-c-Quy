import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Order } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import OrderListMobile from './mobile/OrderListMobile';
import OrderListDesktop from './desktop/OrderListDesktop';
import OrderFiltersToolbar from './OrderFiltersToolbar';
import OrderFiltersModal, { OrderFiltersState } from './OrderFiltersModal';

interface OrderListProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onUpdateOrder: (id: string, data: any) => Promise<void>;
}

const OrderList: React.FC<OrderListProps> = ({ orders, onSelectOrder, onDeleteOrder, onUpdateOrder }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // New Filters
  const [productFilter, setProductFilter] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(''); // Format: YYYY-MM
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const [sortField, setSortField] = useState<keyof Order>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const parseDateValue = (value: any) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof value === 'object' && typeof value.toDate === 'function') {
      try {
        return value.toDate();
      } catch {
        return null;
      }
    }
    return null;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const normalizedSearch = searchTerm.toLowerCase().trim();
      // Basic Search (ID or Customer Name or Order Number)
      const matchesSearch = 
        order.id.toLowerCase().includes(normalizedSearch) ||
        (order.orderNumber && order.orderNumber.toLowerCase().includes(normalizedSearch)) ||
        order.customer.name.toLowerCase().includes(normalizedSearch) ||
        (order.customer.phone && order.customer.phone.toLowerCase().includes(normalizedSearch));
      
      // Status Filter
      const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
      
      // Product Filter
      const matchesProduct = !productFilter || order.items.some(item => 
        item.name.toLowerCase().includes(productFilter.toLowerCase())
      );

      // Month Filter
      let matchesDate = true;
      if (selectedMonth) {
        const [filterYear, filterMonth] = selectedMonth.split('-').map(Number);
        const orderDate = parseDateValue(order.orderDate || order.date);
        if (!orderDate || orderDate.getFullYear() !== filterYear || (orderDate.getMonth() + 1) !== filterMonth) {
          matchesDate = false;
        }
      }

      // Payment status filter
      const matchesPaymentStatus = paymentStatusFilter === 'All' || order.paymentStatus === paymentStatusFilter;

      // Payment method filter
      const matchesPaymentMethod = paymentMethodFilter === 'All' || order.paymentMethod === paymentMethodFilter;

      // Date range filter (orderDate or date)
      let matchesRange = true;
      if (dateFrom || dateTo) {
        const parsed = parseDateValue(order.orderDate || order.date);
        const fromDate = dateFrom ? parseDateValue(dateFrom) : null;
        const toDate = dateTo ? parseDateValue(dateTo) : null;
        if (parsed) {
          if (fromDate && parsed < fromDate) matchesRange = false;
          if (toDate) {
            // include end day
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            if (parsed > end) matchesRange = false;
          }
        } else if (dateFrom || dateTo) {
          matchesRange = false;
        }
      }

      return matchesSearch && matchesStatus && matchesProduct && matchesDate && matchesPaymentStatus && matchesPaymentMethod && matchesRange;
    }).sort((a, b) => {
      // Sorting logic
      if (a[sortField]! < b[sortField]!) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField]! > b[sortField]!) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [orders, searchTerm, statusFilter, sortField, sortDirection, productFilter, selectedMonth, paymentStatusFilter, paymentMethodFilter, dateFrom, dateTo]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, productFilter, selectedMonth, paymentStatusFilter, paymentMethodFilter, dateFrom, dateTo]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  
  // Adjust currentPage if it exceeds totalPages due to deletion or filtering
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredOrders.length);
  const currentOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderProductSummary = (order: Order) => {
    if (!order.items || order.items.length === 0) return 'No items';
    const firstItem = order.items[0];
    const remainingCount = order.items.length - 1;
    return (
      <div className="flex flex-col">
        <span className="font-medium text-slate-700 dark:text-slate-300 line-clamp-1" title={firstItem.name}>{firstItem.name}</span>
        {remainingCount > 0 && (
          <span className="text-xs text-slate-500 italic">+{remainingCount} more</span>
        )}
      </div>
    );
  };


  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full animate-fade-in transition-colors overflow-hidden">
      
      <OrderFiltersToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenAdvanced={() => setIsAdvancedOpen(true)}
      />

      <OrderListMobile
        orders={currentOrders}
        onSelectOrder={onSelectOrder}
        renderProductSummary={renderProductSummary}
      />

      <OrderListDesktop
        orders={currentOrders}
        onSelectOrder={onSelectOrder}
        renderProductSummary={renderProductSummary}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      <OrderFiltersModal
        isOpen={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        initialValues={{
          searchTerm,
          statusFilter,
          productFilter,
          selectedMonth,
          paymentStatusFilter,
          paymentMethodFilter,
          dateFrom,
          dateTo,
        }}
        onApply={(values: OrderFiltersState) => {
          setSearchTerm(values.searchTerm);
          setStatusFilter(values.statusFilter);
          setProductFilter(values.productFilter);
          setSelectedMonth(values.selectedMonth);
          setPaymentStatusFilter(values.paymentStatusFilter);
          setPaymentMethodFilter(values.paymentMethodFilter);
          setDateFrom(values.dateFrom);
          setDateTo(values.dateTo);
          setIsAdvancedOpen(false);
        }}
      />
      
      <div className="p-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 flex justify-between items-center bg-white dark:bg-slate-800 rounded-b-xl shrink-0">
        <span>
          {filteredOrders.length > 0 
            ? `${t('orders.showing')} ${startIndex + 1}-${endIndex} ${t('orders.of')} ${filteredOrders.length}` 
            : t('orders.noOrdersCriteria')
          }
        </span>
        <div className="flex gap-2">
          <button 
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <ChevronLeft className="w-3 h-3 mr-1" /> Prev
          </button>
          <div className="px-2 py-1 flex items-center justify-center font-medium text-slate-600 dark:text-slate-300">
            {currentPage} / {Math.max(1, totalPages)}
          </div>
          <button 
            onClick={handleNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            Next <ChevronRight className="w-3 h-3 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderList;