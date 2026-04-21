import React, { useMemo, useState } from 'react';
import { Bell, Calendar, Clock, DollarSign, MessageSquare, Package, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrders } from '@/contexts/OrderContext';
import {
  sendCustomNotification,
  sendDeliveryDueNotification,
  sendPendingOrdersNotification,
  sendUnpaidOrdersNotification
} from '@/services/zaloService';
import { OrderStatus, PaymentStatus } from '@/types';
import { parseDateValue } from '@/utils/dateUtil';
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

type NotificationType = 'unpaid' | 'pending' | 'delivery' | 'custom';

const NotificationsPage: React.FC = () => {
  const { t } = useLanguage();
  const { orders } = useOrders();
  const [selectedType, setSelectedType] = useState<NotificationType>('unpaid');
  const [isSending, setIsSending] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  const unpaidOrders = useMemo(() => {
    return orders.filter((order) => order.paymentStatus === PaymentStatus.UNPAID);
  }, [orders]);

  const pendingOrders = useMemo(() => {
    return orders.filter(
      (order) => order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED
    );
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

  const getOrderCount = () => {
    switch (selectedType) {
      case 'unpaid':
        return unpaidOrders.length;
      case 'pending':
        return pendingOrders.length;
      case 'delivery':
        return deliveryDueOrders.length;
      default:
        return 0;
    }
  };

  const getOrderCountByType = (type: NotificationType) => {
    switch (type) {
      case 'unpaid':
        return unpaidOrders.length;
      case 'pending':
        return pendingOrders.length;
      case 'delivery':
        return deliveryDueOrders.length;
      default:
        return 0;
    }
  };

  const notificationOptions = [
    {
      type: 'unpaid' as NotificationType,
      icon: DollarSign,
      title: t('notifications.unpaidOrders'),
      description: t('notifications.unpaidOrdersDesc'),
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800'
    },
    {
      type: 'pending' as NotificationType,
      icon: Clock,
      title: t('notifications.pendingOrders'),
      description: t('notifications.pendingOrdersDesc'),
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800'
    },
    {
      type: 'delivery' as NotificationType,
      icon: Package,
      title: t('notifications.deliveryOrders'),
      description: t('notifications.deliveryOrdersDesc'),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      type: 'custom' as NotificationType,
      icon: MessageSquare,
      title: t('notifications.customMessage'),
      description: t('notifications.customMessageDesc'),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800'
    }
  ];

  return (
    <Box layoutClassName="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <Box layoutClassName="mb-6">
        <Box layoutClassName="mb-2 flex items-center gap-3">
          <Bell className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          <Heading level={1} textClassName="text-2xl sm:text-3xl">
            {t('notifications.title')}
          </Heading>
        </Box>
        <Typography variant="muted" size="base">
          {t('notifications.subtitle')}
        </Typography>
      </Box>

      <Box layoutClassName="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {notificationOptions.map((option) => {
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
              focusClassName="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
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

      <Card padding="lg">
        {selectedType === 'delivery' ? (
          <Box layoutClassName="mb-6">
            <Field label={t('notifications.selectDeliveryDate')} htmlFor="notification-delivery-date">
              <Input
                id="notification-delivery-date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                leftIcon={<Calendar />}
                leftIconClassName="[&_svg]:h-5 [&_svg]:w-5"
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
                  notificationOptions.find((o) => o.type === selectedType)?.title || ''
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
          backgroundClassName="bg-orange-600"
          hoverClassName="hover:bg-orange-700"
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
    </Box>
  );
};

export default NotificationsPage;
