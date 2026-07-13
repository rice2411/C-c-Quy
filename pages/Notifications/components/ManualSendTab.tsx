import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from '@/components/ui/DatePicker';
import {
  Activity,
  BarChart3,
  Bell,
  Calendar,
  ChefHat,
  Clock,
  DollarSign,
  MessageSquare,
  MessageCircle,
  Package,
  Receipt,
  Send,
  TimerReset,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrders } from '@/hooks/useOrders';
import {
  sendCustomNotification,
  sendDailySummaryNotification,
  sendDeliveryDueNotification,
  sendHealthCheckNotification,
  sendPendingOrdersNotification,
  sendProductionTomorrowNotification,
  sendStuckPendingNotification,
  sendUnpaidOrdersNotification,
} from '@/services/zaloService';
import { OrderStatus, PaymentStatus } from '@/types';
import { parseDateValue } from '@/utils/format/dateUtil';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Field from '@/components/ui/Field';
import Heading from '@/components/ui/Heading';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Textarea from '@/components/ui/Textarea';
import Typography from '@/components/ui/Typography';
import Tabs, { TabsItem } from '@/components/ui/Tabs';
import EmptyState from '@/components/ui/EmptyState';

type NotificationType = 'unpaid' | 'pending' | 'delivery' | 'custom' | 'production-tomorrow' | 'stuck-pending' | 'daily-summary' | 'health-check';

type NotificationGroupId = 'zalo' | 'customers' | 'orders' | 'transactions';

const GROUP_ORDER: NotificationGroupId[] = ['orders', 'zalo', 'customers', 'transactions'];

const GROUP_META: Record<
  NotificationGroupId,
  { titleKey: string; descKey: string; SectionIcon: typeof MessageCircle }
> = {
  zalo: {
    titleKey: 'notifications.groups.zalo',
    descKey: 'notifications.groups.zaloDesc',
    SectionIcon: MessageCircle,
  },
  customers: {
    titleKey: 'notifications.groups.customers',
    descKey: 'notifications.groups.customersDesc',
    SectionIcon: Users,
  },
  orders: {
    titleKey: 'notifications.groups.orders',
    descKey: 'notifications.groups.ordersDesc',
    SectionIcon: Package,
  },
  transactions: {
    titleKey: 'notifications.groups.transactions',
    descKey: 'notifications.groups.transactionsDesc',
    SectionIcon: Receipt,
  },
};

const ManualSendTab: React.FC = () => {
  const { t } = useLanguage();
  const { orders } = useOrders();
  const [activeTab, setActiveTab] = useState<NotificationGroupId>('orders');
  const [selectedType, setSelectedType] = useState<NotificationType>('unpaid');
  const [isSending, setIsSending] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  const unpaidOrders = useMemo(() => {
    return orders.filter((order) => {
      const pst = String(order.paymentStatus ?? '').toUpperCase();
      if (pst !== 'UNPAID') return false;
      const st = String(order.status ?? '').toUpperCase();
      // Loại đơn đã huỷ / trả lại — không tính là "chưa thanh toán"
      return st !== 'CANCELLED' && st !== 'RETURNED';
    });
  }, [orders]);

  const pendingOrders = useMemo(() => {
    return orders.filter((order) => {
      const st = String(order.status ?? '').toUpperCase();
      return st !== 'DELIVERED' && st !== 'CANCELLED' && st !== 'RETURNED';
    });
  }, [orders]);

  const deliveryDueOrders = useMemo(() => {
    if (!deliveryDate) return [];
    const targetDate = new Date(deliveryDate);
    targetDate.setHours(0, 0, 0, 0);

    return orders.filter((order) => {
      if (!order.deliveryDate) return false;
      const orderDeliveryDate = parseDateValue(order.deliveryDate);
      if (!orderDeliveryDate) return false;

      const orderDate = new Date(orderDeliveryDate);
      orderDate.setHours(0, 0, 0, 0);

      return (
        orderDate.getTime() === targetDate.getTime() &&
        order.status !== OrderStatus.DELIVERED &&
        order.status !== OrderStatus.CANCELLED
      );
    });
  }, [orders, deliveryDate]);

  const productionTomorrowOrders = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const start = tomorrow.getTime();
    const end = start + 24 * 60 * 60 * 1000;
    return orders.filter((o) => {
      const st = String(o.status ?? '').toUpperCase();
      if (st === 'CANCELLED' || st === 'DELIVERED' || st === 'RETURNED') return false;
      const d = o.deliveryDate ? parseDateValue(o.deliveryDate) : null;
      if (!d) return false;
      const t = d.getTime();
      return t >= start && t < end;
    });
  }, [orders]);

  const STUCK_HOURS = 24;
  const stuckPendingOrders = useMemo(() => {
    const threshold = Date.now() - STUCK_HOURS * 3600 * 1000;
    return orders.filter((o) => {
      const st = String(o.status ?? '').toUpperCase();
      if (st !== 'PENDING') return false;
      const created = parseDateValue((o as any).orderDate || (o as any).createdAt);
      return created != null && created.getTime() <= threshold;
    });
  }, [orders]);

  const todayOrders = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const end = start + 24 * 60 * 60 * 1000;
    return orders.filter((o) => {
      const d = parseDateValue((o as any).orderDate || (o as any).createdAt);
      if (!d) return false;
      const t = d.getTime();
      return t >= start && t < end;
    });
  }, [orders]);

  const notificationOptions = useMemo(
    () =>
      [
        {
          group: 'orders' as const,
          type: 'unpaid' as const,
          icon: DollarSign,
          title: t('notifications.unpaidOrders'),
          description: t('notifications.unpaidOrdersDesc'),
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
        },
        {
          group: 'orders' as const,
          type: 'pending' as const,
          icon: Clock,
          title: t('notifications.pendingOrders'),
          description: t('notifications.pendingOrdersDesc'),
          color: 'text-primary-600 dark:text-primary-400',
          bgColor: 'bg-primary-50 dark:bg-primary-900/20',
          borderColor: 'border-primary-200 dark:border-primary-800',
        },
        {
          group: 'orders' as const,
          type: 'delivery' as const,
          icon: Package,
          title: t('notifications.deliveryOrders'),
          description: t('notifications.deliveryOrdersDesc'),
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
        },
        {
          group: 'zalo' as const,
          type: 'custom' as const,
          icon: MessageSquare,
          title: t('notifications.customMessage'),
          description: t('notifications.customMessageDesc'),
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
        },
        {
          group: 'orders' as const,
          type: 'production-tomorrow' as const,
          icon: ChefHat,
          title: 'Sản xuất ngày mai',
          description: 'Tổng hợp số bánh cần làm cho ngày mai theo từng sản phẩm.',
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-900/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
        },
        {
          group: 'orders' as const,
          type: 'stuck-pending' as const,
          icon: TimerReset,
          title: 'Đơn pending quá 24h',
          description: 'Cảnh báo đơn chưa xác nhận quá lâu — tránh khách bỏ đi.',
          color: 'text-rose-600 dark:text-rose-400',
          bgColor: 'bg-rose-50 dark:bg-rose-900/20',
          borderColor: 'border-rose-200 dark:border-rose-800',
        },
        {
          group: 'orders' as const,
          type: 'daily-summary' as const,
          icon: BarChart3,
          title: 'Tổng kết hôm nay',
          description: 'Số đơn / doanh thu / top sản phẩm trong ngày.',
          color: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
        },
        {
          group: 'zalo' as const,
          type: 'health-check' as const,
          icon: Activity,
          title: 'Health check',
          description: 'Ping nhóm chính để kiểm tra hệ thống & token còn live.',
          color: 'text-slate-600 dark:text-slate-300',
          bgColor: 'bg-slate-50 dark:bg-slate-900/40',
          borderColor: 'border-slate-200 dark:border-slate-700',
        },
      ] as const,
    [t],
  );

  const optionsByGroup = useMemo(() => {
    const groups: Record<
      NotificationGroupId,
      (typeof notificationOptions)[number][]
    > = {
      zalo: [],
      customers: [],
      orders: [],
      transactions: [],
    };
    for (const opt of notificationOptions) {
      groups[opt.group].push(opt);
    }
    return groups;
  }, [notificationOptions]);

  useEffect(() => {
    const items = optionsByGroup[activeTab];
    if (items.length === 0) return;
    if (!items.some((o) => o.type === selectedType)) {
      setSelectedType(items[0].type);
    }
  }, [activeTab, optionsByGroup, selectedType]);

  const tabItems = useMemo<TabsItem[]>(() => {
    return GROUP_ORDER.map((id) => ({
      id,
      label: t(GROUP_META[id].titleKey),
    }));
  }, [t]);

  const handleSendNotification = async () => {
    if (isSending) return;

    try {
      setIsSending(true);

      switch (selectedType) {
        case 'unpaid':
          if (unpaidOrders.length === 0) {
            toast.error(t('notifications.noUnpaidOrders'));
            return;
          }
          await sendUnpaidOrdersNotification(unpaidOrders);
          toast.success(t('notifications.sentSuccess'));
          break;

        case 'pending':
          if (pendingOrders.length === 0) {
            toast.error(t('notifications.noPendingOrders'));
            return;
          }
          await sendPendingOrdersNotification(pendingOrders);
          toast.success(t('notifications.sentSuccess'));
          break;

        case 'delivery':
          if (!deliveryDate) {
            toast.error(t('notifications.selectDeliveryDate'));
            return;
          }
          if (deliveryDueOrders.length === 0) {
            toast.error(t('notifications.noDeliveryOrders'));
            return;
          }
          await sendDeliveryDueNotification(deliveryDueOrders, new Date(deliveryDate));
          toast.success(t('notifications.sentSuccess'));
          break;

        case 'production-tomorrow': {
          const now = new Date();
          const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          await sendProductionTomorrowNotification(productionTomorrowOrders, tomorrow);
          toast.success(t('notifications.sentSuccess'));
          break;
        }

        case 'stuck-pending': {
          if (stuckPendingOrders.length === 0) {
            toast.error('Không có đơn PENDING quá 24h');
            return;
          }
          await sendStuckPendingNotification(stuckPendingOrders, STUCK_HOURS);
          toast.success(t('notifications.sentSuccess'));
          break;
        }

        case 'daily-summary': {
          await sendDailySummaryNotification({ orders: todayOrders }, new Date());
          toast.success(t('notifications.sentSuccess'));
          break;
        }

        case 'health-check': {
          await sendHealthCheckNotification();
          toast.success(t('notifications.sentSuccess'));
          break;
        }
        case 'custom':
          if (!customMessage.trim()) {
            toast.error(t('notifications.enterMessage'));
            return;
          }
          await sendCustomNotification(customMessage);
          toast.success(t('notifications.sentSuccess'));
          setCustomMessage('');
          break;
      }
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(t('notifications.sendError') || 'Lỗi khi gửi thông báo');
    } finally {
      setIsSending(false);
    }
  };

  const getOrderCount = () => getOrderCountByType(selectedType);

  const getOrderCountByType = (type: NotificationType) => {
    switch (type) {
      case 'unpaid': return unpaidOrders.length;
      case 'pending': return pendingOrders.length;
      case 'delivery': return deliveryDueOrders.length;
      case 'production-tomorrow': return productionTomorrowOrders.length;
      case 'stuck-pending': return stuckPendingOrders.length;
      case 'daily-summary': return todayOrders.length;
      default: return 0;
    }
  };

  const tabPanelItems = optionsByGroup[activeTab];
  const showActionCard = tabPanelItems.length > 0;
  const ActiveSectionIcon = GROUP_META[activeTab].SectionIcon;

  return (
    <Box layoutClassName="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <Box layoutClassName="relative flex flex-col space-y-6">
        <Tabs
          items={tabItems}
          value={activeTab}
          onChange={(id) => setActiveTab(id as NotificationGroupId)}
        />

        <Box>
          <Box layoutClassName="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <Box layoutClassName="flex items-center gap-2">
              <ActiveSectionIcon className="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden />
              <Heading level={2} textClassName="text-lg font-semibold text-slate-900 dark:text-white">
                {t(GROUP_META[activeTab].titleKey)}
              </Heading>
            </Box>
            <Typography size="sm" variant="muted" layoutClassName="sm:ml-1">
              {t(GROUP_META[activeTab].descKey)}
            </Typography>
          </Box>

          {tabPanelItems.length === 0 ? (
            <EmptyState
              icon={<Bell className="h-6 w-6" />}
              title={t('notifications.groups.empty')}
            />
          ) : (
            <Box layoutClassName="grid grid-cols-1 gap-4 md:grid-cols-2">
              {tabPanelItems.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedType === option.type;
                const count = option.type !== 'custom' ? getOrderCountByType(option.type) : null;

                return (
                  <Button
                    key={option.type}
                    type="button"
                    variant="ghost"
                    disableVariantHover={isSelected}
                    disableVariantTextColor
                    sizeClassName="!min-h-0 !p-0"
                    roundedClassName="rounded-xl"
                    borderClassName={
                      isSelected
                        ? `border-2 ${option.borderColor}`
                        : 'border-2 border-slate-200 dark:border-slate-700'
                    }
                    backgroundClassName={isSelected ? option.bgColor : 'bg-white dark:bg-slate-800'}
                    hoverClassName={
                      isSelected
                        ? ''
                        : 'hover:border-slate-300 hover:bg-white dark:hover:border-slate-600 dark:hover:bg-slate-800'
                    }
                    shadowClassName={isSelected ? 'shadow-lg' : 'shadow-none'}
                    stateClassName={isSelected ? 'scale-[1.02] transition-all' : 'transition-all'}
                    layoutClassName="flex w-full flex-col items-stretch text-left"
                    textClassName="font-normal"
                    focusClassName="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                    onClick={() => setSelectedType(option.type)}
                  >
                    <Box layoutClassName="flex items-start gap-3 p-4">
                      <Box
                        layoutClassName="p-2"
                        roundedClassName="rounded-lg"
                        backgroundClassName={option.bgColor}
                      >
                        <Icon className={`h-5 w-5 ${option.color}`} />
                      </Box>
                      <Box layoutClassName="min-w-0 flex-1">
                        <Box layoutClassName="mb-1 flex items-center justify-between gap-2">
                          <Typography
                            as="span"
                            size="inherit"
                            layoutClassName="block min-w-0"
                            textClassName={
                              isSelected
                                ? `${option.color} font-semibold`
                                : 'font-semibold text-slate-900 dark:text-white'
                            }
                          >
                            {option.title}
                          </Typography>
                          {count !== null ? (
                            <Badge
                              size="sm"
                              layoutClassName="shrink-0 px-2 py-1"
                              borderClassName="border-transparent"
                              backgroundClassName={option.bgColor}
                              textClassName={`${option.color} text-sm font-bold`}
                            >
                              {count}
                            </Badge>
                          ) : null}
                        </Box>
                        <Typography size="sm" variant="muted">
                          {option.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Button>
                );
              })}
            </Box>
          )}
        </Box>

      {showActionCard ? (
      <Card padding="lg">
        {selectedType === 'delivery' ? (
          <Box layoutClassName="mb-6">
            <Field label={t('notifications.selectDeliveryDate')} htmlFor="notification-delivery-date">
              <DatePicker
                id="notification-delivery-date"
                value={deliveryDate}
                onChange={setDeliveryDate}
                fullWidth
              />
            </Field>
            {deliveryDate && deliveryDueOrders.length > 0 ? (
              <Typography size="sm" variant="muted" layoutClassName="mt-2">
                {t('notifications.foundOrders')?.replace('{count}', String(deliveryDueOrders.length)) ||
                  `Tìm thấy ${deliveryDueOrders.length} đơn hàng`}
              </Typography>
            ) : null}
          </Box>
        ) : null}

        {selectedType === 'custom' ? (
          <Box layoutClassName="mb-6">
            <Field label={t('notifications.customMessage')} htmlFor="notification-custom-message">
              <Textarea
                id="notification-custom-message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={t('notifications.messagePlaceholder')}
                rows={6}
                resize="none"
              />
            </Field>
          </Box>
        ) : null}

        {selectedType !== 'custom' && selectedType !== 'delivery' ? (
          <Box
            layoutClassName="mb-6 p-4"
            roundedClassName="rounded-lg"
            backgroundClassName="bg-slate-50 dark:bg-slate-700/50"
          >
            <Typography size="sm" variant="muted">
              {t('notifications.selectedTypeInfo')
                ?.replace('{count}', String(getOrderCount()))
                ?.replace(
                  '{type}',
                  notificationOptions.find((o) => o.type === selectedType)?.title || '',
                ) ||
                `Sẽ gửi thông báo về ${getOrderCount()} ${notificationOptions.find((o) => o.type === selectedType)?.title || ''}`}
            </Typography>
          </Box>
        ) : null}

        <Button
          type="button"
          onClick={handleSendNotification}
          disabled={
            isSending ||
            (selectedType === 'delivery' && !deliveryDate) ||
            (selectedType === 'custom' && !customMessage.trim())
          }
          leftIcon={
            isSending ? (
              <Spinner size="md" textClassName="text-white" borderClassName="border-white" />
            ) : (
              <Send />
            )
          }
          iconClassName="inline-flex shrink-0 [&_svg]:h-5 [&_svg]:w-5"
          variant="primary"
          disableVariantHover
          disableVariantTextColor
          backgroundClassName="bg-primary-600"
          hoverClassName="hover:bg-primary-700"
          textClassName="font-semibold text-white"
          roundedClassName="rounded-lg"
          shadowClassName="shadow-sm"
          sizeClassName="px-6 py-3"
          layoutClassName="w-full gap-2 sm:w-auto"
          stateClassName="transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? t('notifications.sending') : t('notifications.send')}
        </Button>
      </Card>
      ) : null}
      </Box>
    </Box>
  );
};

export default ManualSendTab;
