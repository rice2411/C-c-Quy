import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Order } from '@/types';
import { getAllUsers } from '@/services/userService';
import { parseDateValue } from '@/utils/dateUtil';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import OrderListDesktop from '@/pages/Orders/components/desktop/OrderListDesktop';
import OrderFiltersModal, { OrderFiltersState } from '@/pages/Orders/components/modals/OrderFiltersModal';
import OrderFiltersToolbar from '@/pages/Orders/components/OrderFiltersToolbar';
import OrderListMobile from '@/pages/Orders/components/mobile/OrderListMobile';

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
  const [creatorFilter, setCreatorFilter] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [dateType, setDateType] = useState<'orderDate' | 'deliveryDate'>('orderDate');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [creatorOptions, setCreatorOptions] = useState<string[]>([]);

  const [sortField, setSortField] = useState<keyof Order>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const loadCreatorOptions = async () => {
      const users = await getAllUsers();
      const creators = users
        .map((user) => user.customName || user.displayName || user.email)
        .filter((name): name is string => Boolean(name && name.trim()))
        .map((name) => name.trim());
      const uniqueCreators = Array.from(new Set(creators)).sort((a, b) => a.localeCompare(b, 'vi'));
      setCreatorOptions(uniqueCreators);
    };
    loadCreatorOptions();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const normalizedSearch = searchTerm.toLowerCase().trim();
      const matchesSearch = normalizedSearch === '' || 
        (order.id && order.id.toLowerCase().includes(normalizedSearch)) ||
        (order.orderNumber && order.orderNumber.toLowerCase().includes(normalizedSearch)) ||
        (order.customer?.name && order.customer.name.toLowerCase().includes(normalizedSearch)) ||
        (order.customer?.phone && order.customer.phone.toLowerCase().includes(normalizedSearch));
      
      const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
      
      const matchesProduct = !productFilter || 
        (order.items && order.items.length > 0 && order.items.some(item => 
          item?.name && item.name.toLowerCase().includes(productFilter.toLowerCase())
        ));

      let matchesDate = true;
      if (selectedMonth) {
        const monthParts = selectedMonth.split('-');
        if (monthParts.length === 2) {
          const filterYear = Number(monthParts[0]);
          const filterMonth = Number(monthParts[1]);
          if (!isNaN(filterYear) && !isNaN(filterMonth) && filterMonth >= 1 && filterMonth <= 12) {
            const targetDate = dateType === 'deliveryDate' 
              ? parseDateValue(order.deliveryDate)
              : parseDateValue(order.orderDate || order.date);
            if (!targetDate || targetDate.getFullYear() !== filterYear || (targetDate.getMonth() + 1) !== filterMonth) {
              matchesDate = false;
            }
          }
        }
      }

      const matchesPaymentStatus = paymentStatusFilter === 'All' || order.paymentStatus === paymentStatusFilter;
      const matchesPaymentMethod = paymentMethodFilter === 'All' || order.paymentMethod === paymentMethodFilter;
      const matchesCreator = !creatorFilter || (order.createdBy && order.createdBy.toLowerCase().includes(creatorFilter.toLowerCase().trim()));

      let matchesRange = true;
      if (dateFrom || dateTo) {
        const targetDate = dateType === 'deliveryDate'
          ? parseDateValue(order.deliveryDate)
          : parseDateValue(order.orderDate || order.date);
        const fromDate = dateFrom ? parseDateValue(dateFrom) : null;
        const toDate = dateTo ? parseDateValue(dateTo) : null;
        
        if (!targetDate) {
          matchesRange = false;
        } else {
          if (fromDate && targetDate < fromDate) {
            matchesRange = false;
          }
          if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            if (targetDate > end) {
              matchesRange = false;
            }
          }
        }
      }

      return matchesSearch && matchesStatus && matchesProduct && matchesDate && matchesPaymentStatus && matchesPaymentMethod && matchesCreator && matchesRange;
    }).sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1;
      
      const aDate = parseDateValue(aValue);
      const bDate = parseDateValue(bValue);
      
      if (aDate && bDate) {
        return sortDirection === 'asc' 
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue);
      const bStr = String(bValue);
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [orders, searchTerm, statusFilter, sortField, sortDirection, productFilter, selectedMonth, paymentStatusFilter, paymentMethodFilter, creatorFilter, dateFrom, dateTo, dateType]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, productFilter, selectedMonth, paymentStatusFilter, paymentMethodFilter, creatorFilter, dateFrom, dateTo, dateType]);

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
    if (!order.items || order.items.length === 0) {
      return (
        <Typography size="sm" variant="muted">
          No items
        </Typography>
      );
    }
    const firstItem = order.items[0];
    const remainingCount = order.items.length - 1;
    return (
      <Box layoutClassName="flex flex-col">
        <Typography
          as="span"
          size="sm"
          layoutClassName="line-clamp-1 font-medium"
          title={firstItem.name}
        >
          {firstItem.name}
        </Typography>
        {remainingCount > 0 ? (
          <Typography as="span" size="xs" variant="muted" layoutClassName="italic">
            +{remainingCount} more
          </Typography>
        ) : null}
      </Box>
    );
  };


  return (
    <Card
      padding="none"
      layoutClassName="flex h-full animate-fade-in flex-col overflow-hidden transition-colors"
      borderClassName="border-slate-100 dark:border-slate-700"
    >
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
        creatorOptions={creatorOptions}
        initialValues={{
          searchTerm,
          statusFilter,
          productFilter,
          selectedMonth,
          paymentStatusFilter,
          paymentMethodFilter,
          creatorFilter,
          dateFrom,
          dateTo,
          dateType,
        }}
        onApply={(values: OrderFiltersState) => {
          setSearchTerm(values.searchTerm);
          setStatusFilter(values.statusFilter);
          setProductFilter(values.productFilter);
          setSelectedMonth(values.selectedMonth);
          setPaymentStatusFilter(values.paymentStatusFilter);
          setPaymentMethodFilter(values.paymentMethodFilter);
          setCreatorFilter(values.creatorFilter);
          setDateFrom(values.dateFrom);
          setDateTo(values.dateTo);
          setDateType(values.dateType);
          setIsAdvancedOpen(false);
        }}
      />
      
      <Box
        layoutClassName="flex shrink-0 items-center justify-between p-4"
        borderClassName="border-t border-slate-100 dark:border-slate-700"
        backgroundClassName="bg-white dark:bg-slate-800"
        roundedClassName="rounded-b-xl"
      >
        <Typography as="span" size="xs" variant="muted" textClassName="text-slate-500 dark:text-slate-400">
          {filteredOrders.length > 0
            ? `${t('orders.showing')} ${startIndex + 1}-${endIndex} ${t('orders.of')} ${filteredOrders.length}`
            : t('orders.noOrdersCriteria')}
        </Typography>
        <Box layoutClassName="flex gap-2">
          <Button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            variant="secondary"
            disableVariantHover
            disableVariantTextColor
            borderClassName="border border-slate-200 dark:border-slate-600"
            backgroundClassName="bg-transparent"
            hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
            textClassName="text-slate-700 dark:text-slate-200"
            roundedClassName="rounded-lg"
            layoutClassName="flex items-center"
            sizeClassName="px-3 py-1"
            stateClassName="transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            leftIcon={<ChevronLeft />}
            iconClassName="mr-1 inline-flex [&_svg]:h-3 [&_svg]:w-3"
          >
            Prev
          </Button>
          <Box
            layoutClassName="flex items-center justify-center px-2 py-1"
            textClassName="font-medium text-slate-600 dark:text-slate-300"
          >
            {currentPage} / {Math.max(1, totalPages)}
          </Box>
          <Button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            variant="secondary"
            disableVariantHover
            disableVariantTextColor
            borderClassName="border border-slate-200 dark:border-slate-600"
            backgroundClassName="bg-transparent"
            hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
            textClassName="text-slate-700 dark:text-slate-200"
            roundedClassName="rounded-lg"
            layoutClassName="flex items-center"
            sizeClassName="px-3 py-1"
            stateClassName="transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            rightIcon={<ChevronRight />}
            iconClassName="ml-1 inline-flex [&_svg]:h-3 [&_svg]:w-3"
          >
            Next
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

export default OrderList;