import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, X, ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { qk } from '@/hooks/queryKeys';
import { Order } from '@/types';
import { DeliveryType } from '@/types/enums';
import { matchesCarrierStatus, CARRIER_STATUS_OPTIONS } from '@/pages/Orders/carrierStatus';
import { getAllUsers } from '@/services/userService';
import { parseDateValue } from '@/utils/format/dateUtil';
import { buildDeliveryBadge } from '@/utils/order/deliveryDateBadge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import OrderListDesktop from '@/pages/Orders/components/desktop/OrderListDesktop';
import OrderFiltersModal, { type OrderFiltersState } from '@/pages/Orders/components/modals/OrderFiltersModal';
import OrderCompareModal from '@/pages/Orders/components/modals/OrderCompareModal';
import OrderFiltersToolbar from '@/pages/Orders/components/OrderFiltersToolbar';
import OrderListMobile from '@/pages/Orders/components/mobile/OrderListMobile';
import BatchKitchenPrintPortal from '@/pages/Orders/components/print/BatchKitchenPrintPortal';

interface OrderListProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onUpdateOrder: (id: string, data: any) => Promise<void>;
  /** Nút action đặt trong toolbar (tạo đơn / export / làm mới). */
  actions?: React.ReactNode;
  /** Modal so sánh vận đơn — điều khiển từ index, dùng danh sách đơn ĐANG LỌC ở đây. */
  compareOpen?: boolean;
  onCompareClose?: () => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, onSelectOrder, actions, compareOpen, onCompareClose }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // New Filters
  const [productFilter, setProductFilter] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(''); // Format: YYYY-MM
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('All');
  const [creatorFilter, setCreatorFilter] = useState('');
  // Lọc theo nhóm trạng thái giao hàng của ĐVVC (All | delivered | delivering | ...)
  const [trackingStatusFilter, setTrackingStatusFilter] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [dateType, setDateType] = useState<'orderDate' | 'deliveryDate'>('orderDate');
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);
  // Synthetic filter: đơn quá hạn = deliveryDate < today AND status in {PENDING, PROCESSING}
  const [isOverdueFilter, setIsOverdueFilter] = useState<boolean>(false);
  // Filter đơn tỉnh: deliveryType = SHIP_PROVINCE (hoặc đơn cũ đã có mã vận đơn).
  const [isProvinceFilter, setIsProvinceFilter] = useState<boolean>(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Danh sách người tạo (cho filter) — lấy users qua React Query rồi derive.
  const { data: usersData } = useQuery({
    queryKey: qk.users.all,
    queryFn: getAllUsers,
    enabled: !!currentUser,
  });
  const creatorOptions = useMemo(() => {
    const creators = (usersData ?? [])
      .map((user) => user.customName || user.displayName || user.email)
      .filter((name): name is string => Boolean(name && name.trim()))
      .map((name) => name.trim());
    return Array.from(new Set(creators)).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [usersData]);

  // Đếm số đơn theo từng trạng thái (badge trên tab). Dựa trên toàn bộ orders đã tải.
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: orders.length };
    for (const order of orders) {
      const s = order.status as string;
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [orders]);

  // Helper: YYYY-MM-DD string của hôm nay (dùng cho pill "Ship hôm nay")
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Đọc query param `?quick=...` để pre-apply filter từ Dashboard alerts/metrics
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const quick = params.get('quick');
    if (!quick) return;
    if (quick === 'pending') {
      setHideCompleted(true);
    } else if (quick === 'overdue') {
      setIsOverdueFilter(true);
    } else if (quick === 'unpaid') {
      setPaymentStatusFilter('UNPAID');
    } else if (quick === 'today') {
      setDateType('deliveryDate');
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (quick === 'paid') {
      setPaymentStatusFilter('PAID');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Mặc định: sort theo ngày tạo (date) giảm dần — đơn mới nhất lên đầu
  const [sortField, setSortField] = useState<keyof Order>('date' as keyof Order);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const normalizedSearch = searchTerm.toLowerCase().trim();
        const matchesSearch =
          normalizedSearch === '' ||
          (order.id && order.id.toLowerCase().includes(normalizedSearch)) ||
          (order.orderNumber && order.orderNumber.toLowerCase().includes(normalizedSearch)) ||
          (order.customer?.name && order.customer.name.toLowerCase().includes(normalizedSearch)) ||
          (order.customer?.phone && order.customer.phone.toLowerCase().includes(normalizedSearch));

        const matchesStatus = statusFilter === 'All' || order.status === statusFilter;

        // Toggle "Ẩn đơn đã hoàn thành" — loại bỏ DELIVERED/CANCELLED/RETURNED
        const COMPLETED_STATUSES = ['DELIVERED', 'CANCELLED', 'RETURNED'];
        const matchesHideCompleted =
          !hideCompleted || !COMPLETED_STATUSES.includes(order.status as any);

        // Filter Quá hạn: deliveryDate < hôm nay AND status đang xử lý
        let matchesOverdue = true;
        if (isOverdueFilter) {
          const isProcessing = order.status === 'PENDING' || order.status === 'PROCESSING';
          if (!isProcessing) {
            matchesOverdue = false;
          } else {
            const dd = parseDateValue(order.deliveryDate);
            if (!dd) {
              matchesOverdue = false;
            } else {
              const startOfToday = new Date();
              startOfToday.setHours(0, 0, 0, 0);
              matchesOverdue = dd.getTime() < startOfToday.getTime();
            }
          }
        }

        const matchesProduct =
          !productFilter ||
          (order.items &&
            order.items.length > 0 &&
            order.items.some(
              (item) => item?.name && item.name.toLowerCase().includes(productFilter.toLowerCase()),
            ));

        let matchesDate = true;
        if (selectedMonth) {
          const monthParts = selectedMonth.split('-');
          if (monthParts.length === 2) {
            const filterYear = Number(monthParts[0]);
            const filterMonth = Number(monthParts[1]);
            if (!isNaN(filterYear) && !isNaN(filterMonth) && filterMonth >= 1 && filterMonth <= 12) {
              const targetDate =
                dateType === 'deliveryDate'
                  ? parseDateValue(order.deliveryDate)
                  : parseDateValue(order.orderDate || order.date);
              if (
                !targetDate ||
                targetDate.getFullYear() !== filterYear ||
                targetDate.getMonth() + 1 !== filterMonth
              ) {
                matchesDate = false;
              }
            }
          }
        }

        // Đơn tỉnh: ship đi tỉnh (SHIP_PROVINCE) hoặc đơn cũ đã có mã vận đơn 3PL.
        const matchesProvince =
          !isProvinceFilter ||
          order.deliveryType === DeliveryType.SHIP_PROVINCE ||
          !!order.trackingNumber;

        // Trạng thái giao hàng của ĐVVC (nhóm theo trackingStatus text thô).
        const matchesTrackingStatus = matchesCarrierStatus(
          trackingStatusFilter,
          order.trackingStatus,
          order.trackingNumber,
        );

        const matchesPaymentStatus =
          paymentStatusFilter === 'All' || order.paymentStatus === paymentStatusFilter;
        const matchesPaymentMethod =
          paymentMethodFilter === 'All' || order.paymentMethod === paymentMethodFilter;
        const matchesCreator =
          !creatorFilter ||
          (order.createdBy &&
            order.createdBy.toLowerCase().includes(creatorFilter.toLowerCase().trim()));

        let matchesRange = true;
        if (dateFrom || dateTo) {
          const targetDate =
            dateType === 'deliveryDate'
              ? parseDateValue(order.deliveryDate)
              : parseDateValue(order.orderDate || order.date);
          const fromDate = dateFrom ? parseDateValue(dateFrom) : null;
          const toDate = dateTo ? parseDateValue(dateTo) : null;

          if (!targetDate) {
            matchesRange = false;
          } else {
            if (fromDate && targetDate < fromDate) matchesRange = false;
            if (toDate) {
              const end = new Date(toDate);
              end.setHours(23, 59, 59, 999);
              if (targetDate > end) matchesRange = false;
            }
          }
        }

        return (
          matchesSearch &&
          matchesStatus &&
          matchesHideCompleted &&
          matchesOverdue &&
          matchesProduct &&
          matchesDate &&
          matchesProvince &&
          matchesTrackingStatus &&
          matchesPaymentStatus &&
          matchesPaymentMethod &&
          matchesCreator &&
          matchesRange
        );
      })
      .sort((a, b) => {
        // ─────────────────────────────────────────────────────────────────────
        // Tier ưu tiên TOÀN CỤC (áp dụng cho MỌI sort field):
        //   0 — đơn đang xử lý (PENDING / PROCESSING) → luôn lên trên
        //   1 — đơn đã giao thành công (DELIVERED) → dồn xuống dưới
        //   2 — đơn đã huỷ / trả hàng (CANCELLED / RETURNED) → cuối cùng
        // Trong cùng 1 tier mới so theo field chọn.
        // ─────────────────────────────────────────────────────────────────────
        const tierOf = (status: string | undefined): number => {
          if (status === 'DELIVERED') return 1;
          if (status === 'CANCELLED' || status === 'RETURNED') return 2;
          return 0; // PENDING / PROCESSING / khác
        };
        const ta = tierOf(a.status as any);
        const tb = tierOf(b.status as any);
        if (ta !== tb) return ta - tb;

        // Khi sort theo deliveryDate -> dùng priority tier chi tiết (đỏ/vàng/xanh/không/done)
        // ngay TRONG cùng completion tier.
        if ((sortField as string) === 'deliveryDate') {
          const pa = buildDeliveryBadge(a.deliveryDate, { status: a.status }).priority;
          const pb = buildDeliveryBadge(b.deliveryDate, { status: b.status }).priority;
          if (pa !== pb) return pa - pb;
          const aDate = parseDateValue(a.deliveryDate);
          const bDate = parseDateValue(b.deliveryDate);
          if (aDate && bDate) {
            return sortDirection === 'asc'
              ? aDate.getTime() - bDate.getTime()
              : bDate.getTime() - aDate.getTime();
          }
          return 0;
        }

        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

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
  }, [
    orders,
    searchTerm,
    statusFilter,
    hideCompleted,
    isOverdueFilter,
    sortField,
    sortDirection,
    productFilter,
    selectedMonth,
    paymentStatusFilter,
    paymentMethodFilter,
    creatorFilter,
    dateFrom,
    dateTo,
    dateType,
    isProvinceFilter,
    trackingStatusFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    hideCompleted,
    isOverdueFilter,
    productFilter,
    selectedMonth,
    paymentStatusFilter,
    paymentMethodFilter,
    creatorFilter,
    dateFrom,
    dateTo,
    dateType,
    isProvinceFilter,
    trackingStatusFilter,
  ]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredOrders.length);
  const currentOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // IN BẾP HÀNG LOẠT — bật chế độ chọn → tick nhiều đơn (giữ chọn qua các trang) →
  // in tất cả phiếu bếp trong 1 luồng ESC/POS. selectedIds theo id đơn, print từ orders gốc.
  // ─────────────────────────────────────────────────────────────────────────────
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [printOrders, setPrintOrders] = useState<Order[] | null>(null);
  const printToastRef = React.useRef<string | null>(null);

  const toggleSelect = (order: Order) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(order.id)) next.delete(order.id);
      else next.add(order.id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  // Chọn tất cả đơn ĐANG LỌC (mọi trang). Đã chọn hết rồi → bỏ chọn hết.
  const allFilteredSelected =
    filteredOrders.length > 0 && filteredOrders.every((o) => selectedIds.has(o.id));
  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const handleBatchPrintKitchen = () => {
    if (printOrders) return; // đang in
    const toPrint = orders.filter((o) => selectedIds.has(o.id));
    if (toPrint.length === 0) {
      toast.error('Chưa chọn đơn nào để in bếp');
      return;
    }
    printToastRef.current = toast.loading(`Đang in bếp ${toPrint.length} đơn...`);
    setPrintOrders(toPrint);
  };

  const dismissPrintToast = () => {
    if (printToastRef.current) {
      toast.dismiss(printToastRef.current);
      printToastRef.current = null;
    }
  };

  const handleBatchPrintDone = () => {
    const n = printOrders?.length ?? 0;
    setPrintOrders(null);
    dismissPrintToast();
    toast.success(`Đã gửi in bếp ${n} đơn`);
    exitSelectMode();
  };

  const handleBatchPrintError = (msg: string) => {
    setPrintOrders(null);
    dismissPrintToast();
    toast.error(`In bếp lỗi: ${msg}`);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Quick filter pills state + handlers
  // ─────────────────────────────────────────────────────────────────────────────
  const quickPills = {
    pending: hideCompleted,
    unpaid: paymentStatusFilter === 'UNPAID',
    today:
      dateType === 'deliveryDate' && dateFrom === todayStr && dateTo === todayStr,
    overdue: isOverdueFilter,
    province: isProvinceFilter,
  };

  const togglePill_pending = () => setHideCompleted((p) => !p);
  const togglePill_unpaid = () =>
    setPaymentStatusFilter((p) => (p === 'UNPAID' ? 'All' : 'UNPAID'));
  const togglePill_today = () => {
    if (quickPills.today) {
      setDateFrom('');
      setDateTo('');
    } else {
      setDateType('deliveryDate');
      setDateFrom(todayStr);
      setDateTo(todayStr);
      setSelectedMonth('');
    }
  };
  const togglePill_overdue = () => setIsOverdueFilter((p) => !p);
  const togglePill_province = () => setIsProvinceFilter((p) => !p);

  // ─────────────────────────────────────────────────────────────────────────────
  // Active filter chips — list các filter đang bật để render chip bar có thể × bỏ
  // ─────────────────────────────────────────────────────────────────────────────
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (searchTerm.trim()) {
      chips.push({
        key: 'search',
        label: `Tìm: "${searchTerm}"`,
        onClear: () => setSearchTerm(''),
      });
    }
    // Trạng thái đã có tab riêng đại diện → không đẩy vào chip để tránh trùng lặp.
    if (paymentStatusFilter !== 'All') {
      chips.push({
        key: 'paymentStatus',
        label: `Thanh toán: ${paymentStatusFilter}`,
        onClear: () => setPaymentStatusFilter('All'),
      });
    }
    if (paymentMethodFilter !== 'All') {
      chips.push({
        key: 'paymentMethod',
        label: `Phương thức: ${paymentMethodFilter}`,
        onClear: () => setPaymentMethodFilter('All'),
      });
    }
    if (productFilter.trim()) {
      chips.push({
        key: 'product',
        label: `SP: ${productFilter}`,
        onClear: () => setProductFilter(''),
      });
    }
    if (creatorFilter) {
      chips.push({
        key: 'creator',
        label: `Người tạo: ${creatorFilter}`,
        onClear: () => setCreatorFilter(''),
      });
    }
    if (dateFrom || dateTo) {
      const dtLabel = dateType === 'deliveryDate' ? 'Ngày giao' : 'Ngày tạo';
      chips.push({
        key: 'dateRange',
        label: `${dtLabel}: ${dateFrom || '...'} → ${dateTo || '...'}`,
        onClear: () => {
          setDateFrom('');
          setDateTo('');
        },
      });
    }
    if (selectedMonth) {
      chips.push({
        key: 'month',
        label: `Tháng: ${selectedMonth}`,
        onClear: () => setSelectedMonth(''),
      });
    }
    if (hideCompleted) {
      chips.push({
        key: 'hideCompleted',
        label: 'Cần xử lý',
        onClear: () => setHideCompleted(false),
      });
    }
    if (isOverdueFilter) {
      chips.push({
        key: 'overdue',
        label: 'Quá hạn',
        onClear: () => setIsOverdueFilter(false),
      });
    }
    if (isProvinceFilter) {
      chips.push({
        key: 'province',
        label: 'Đơn tỉnh',
        onClear: () => setIsProvinceFilter(false),
      });
    }
    if (trackingStatusFilter !== 'All') {
      chips.push({
        key: 'trackingStatus',
        label: `ĐVVC: ${CARRIER_STATUS_OPTIONS.find((o) => o.value === trackingStatusFilter)?.label ?? trackingStatusFilter}`,
        onClear: () => setTrackingStatusFilter('All'),
      });
    }
    return chips;
  }, [
    searchTerm,
    statusFilter,
    paymentStatusFilter,
    paymentMethodFilter,
    productFilter,
    creatorFilter,
    dateFrom,
    dateTo,
    dateType,
    selectedMonth,
    hideCompleted,
    isOverdueFilter,
    isProvinceFilter,
    trackingStatusFilter,
  ]);

  const activeFiltersCount = activeChips.length;

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
        actions={actions}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenAdvanced={() => setIsAdvancedOpen(true)}
        activeFiltersCount={activeFiltersCount}
        quickPills={quickPills}
        onTogglePending={togglePill_pending}
        onToggleUnpaid={togglePill_unpaid}
        onToggleToday={togglePill_today}
        onToggleOverdue={togglePill_overdue}
        onToggleProvince={togglePill_province}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusCounts={statusCounts}
        sortKey={`${String(sortField)}-${sortDirection}` as any}
        onSortChange={(k) => {
          const [field, dir] = k.split('-');
          setSortField(field as keyof Order);
          setSortDirection(dir as 'asc' | 'desc');
        }}
        onClearAll={() => {
          setSearchTerm('');
          setStatusFilter('All');
          setProductFilter('');
          setSelectedMonth('');
          setPaymentStatusFilter('All');
          setPaymentMethodFilter('All');
          setCreatorFilter('');
          setTrackingStatusFilter('All');
          setDateFrom('');
          setDateTo('');
          setDateType('orderDate');
          setHideCompleted(false);
          setIsOverdueFilter(false);
          setIsProvinceFilter(false);
        }}
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
          trackingStatusFilter,
          dateFrom,
          dateTo,
          dateType,
          sortField: sortField as any,
          sortDirection,
          hideCompleted,
        }}
        onApply={(values: OrderFiltersState) => {
          setSearchTerm(values.searchTerm);
          setStatusFilter(values.statusFilter);
          setProductFilter(values.productFilter);
          setSelectedMonth(values.selectedMonth);
          setPaymentStatusFilter(values.paymentStatusFilter);
          setPaymentMethodFilter(values.paymentMethodFilter);
          setCreatorFilter(values.creatorFilter);
          setTrackingStatusFilter(values.trackingStatusFilter);
          setDateFrom(values.dateFrom);
          setDateTo(values.dateTo);
          setDateType(values.dateType);
          setSortField(values.sortField as keyof Order);
          setSortDirection(values.sortDirection);
          setHideCompleted(values.hideCompleted);
          setIsAdvancedOpen(false);
        }}
      />

      {/* Thanh IN BẾP HÀNG LOẠT — tắt: 1 nút bật; bật: chọn + in nhiều đơn */}
      {selectMode ? (
        <Box
          layoutClassName="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-2.5"
          borderClassName="border-b border-primary-200 dark:border-primary-800"
          backgroundClassName="bg-primary-50 dark:bg-primary-900/20"
        >
          <Box layoutClassName="flex items-center gap-3">
            <Typography
              as="span"
              size="sm"
              layoutClassName="font-semibold"
              textClassName="text-primary-700 dark:text-primary-300"
            >
              🍳 Đã chọn {selectedIds.size} đơn
            </Typography>
            <Button
              type="button"
              onClick={toggleSelectAllFiltered}
              variant="secondary"
              disableVariantHover
              disableVariantTextColor
              borderClassName="border border-primary-300 dark:border-primary-700"
              backgroundClassName="bg-transparent"
              hoverClassName="hover:bg-primary-100 dark:hover:bg-primary-900/40"
              textClassName="text-xs font-medium text-primary-700 dark:text-primary-300"
              roundedClassName="rounded-lg"
              sizeClassName="px-3 py-1"
              stateClassName="transition-colors"
            >
              {allFilteredSelected ? 'Bỏ chọn tất cả' : `Chọn tất cả (${filteredOrders.length})`}
            </Button>
          </Box>
          <Box layoutClassName="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleBatchPrintKitchen}
              disabled={selectedIds.size === 0 || !!printOrders}
              variant="primary"
              disableVariantHover
              disableVariantTextColor
              backgroundClassName="bg-primary-600"
              hoverClassName="hover:bg-primary-700"
              textClassName="text-sm font-semibold text-white"
              roundedClassName="rounded-lg"
              layoutClassName="flex items-center"
              sizeClassName="px-4 py-1.5"
              stateClassName="transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              leftIcon={<ChefHat />}
              iconClassName="mr-1.5 inline-flex [&_svg]:h-4 [&_svg]:w-4"
            >
              In bếp ({selectedIds.size})
            </Button>
            <Button
              type="button"
              onClick={exitSelectMode}
              variant="secondary"
              disableVariantHover
              disableVariantTextColor
              borderClassName="border border-slate-200 dark:border-slate-600"
              backgroundClassName="bg-transparent"
              hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
              textClassName="text-sm text-slate-600 dark:text-slate-300"
              roundedClassName="rounded-lg"
              sizeClassName="px-3 py-1.5"
              stateClassName="transition-colors"
            >
              Thoát
            </Button>
          </Box>
        </Box>
      ) : (
        <Box
          layoutClassName="flex shrink-0 items-center justify-end px-4 py-2"
          borderClassName="border-b border-slate-100 dark:border-slate-700"
        >
          <Button
            type="button"
            onClick={() => setSelectMode(true)}
            variant="secondary"
            disableVariantHover
            disableVariantTextColor
            borderClassName="border border-primary-200 dark:border-primary-800"
            backgroundClassName="bg-transparent"
            hoverClassName="hover:bg-primary-50 dark:hover:bg-primary-900/30"
            textClassName="text-xs font-medium text-primary-700 dark:text-primary-300"
            roundedClassName="rounded-lg"
            layoutClassName="flex items-center"
            sizeClassName="px-3 py-1.5"
            stateClassName="transition-colors"
            leftIcon={<ChefHat />}
            iconClassName="mr-1.5 inline-flex [&_svg]:h-3.5 [&_svg]:w-3.5"
          >
            In bếp hàng loạt
          </Button>
        </Box>
      )}

      <OrderListMobile
        orders={currentOrders}
        onSelectOrder={onSelectOrder}
        renderProductSummary={renderProductSummary}
        selectMode={selectMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />

      <OrderListDesktop
        orders={currentOrders}
        onSelectOrder={onSelectOrder}
        renderProductSummary={renderProductSummary}
        selectMode={selectMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />

      {printOrders ? (
        <BatchKitchenPrintPortal
          orders={printOrders}
          onDone={handleBatchPrintDone}
          onError={handleBatchPrintError}
        />
      ) : null}

      <OrderCompareModal
        isOpen={!!compareOpen}
        onClose={onCompareClose ?? (() => {})}
        orders={filteredOrders}
      />

      <Box
        layoutClassName="flex shrink-0 items-center justify-between p-4"
        borderClassName="border-t border-slate-100 dark:border-slate-700"
        backgroundClassName="bg-white dark:bg-slate-800"
        roundedClassName="rounded-b-xl"
      >
        <Typography
          as="span"
          size="xs"
          variant="muted"
          textClassName="text-slate-500 dark:text-slate-400"
        >
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
