import React, { useState, useMemo } from 'react';
import { Bell, Send, Loader2, Calendar, DollarSign, Package, MessageSquare, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrders } from '@/contexts/OrderContext';
import { PaymentStatus, OrderStatus } from '@/types';
import { 
  sendUnpaidOrdersNotification, 
  sendPendingOrdersNotification, 
  sendDeliveryDueNotification,
  sendCustomNotification 
} from '@/services/zaloService';
import toast from 'react-hot-toast';
import { parseDateValue } from '@/utils/dateUtil';

type NotificationType = 'unpaid' | 'pending' | 'delivery' | 'custom';

const NotificationsPage: React.FC = () => {
  const { t } = useLanguage();
  const { orders, loading } = useOrders();
  const [selectedType, setSelectedType] = useState<NotificationType>('unpaid');
  const [isSending, setIsSending] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  const unpaidOrders = useMemo(() => {
    return orders.filter(order => order.paymentStatus === PaymentStatus.UNPAID);
  }, [orders]);

  const pendingOrders = useMemo(() => {
    return orders.filter(order => 
      order.status !== OrderStatus.DELIVERED && 
      order.status !== OrderStatus.CANCELLED
    );
  }, [orders]);

  const deliveryDueOrders = useMemo(() => {
    if (!deliveryDate) return [];
    const targetDate = new Date(deliveryDate);
    targetDate.setHours(0, 0, 0, 0);
    
    return orders.filter(order => {
      if (!order.deliveryDate) return false;
      const orderDeliveryDate = parseDateValue(order.deliveryDate);
      if (!orderDeliveryDate) return false;
      
      const orderDate = new Date(orderDeliveryDate);
      orderDate.setHours(0, 0, 0, 0);
      
      return orderDate.getTime() === targetDate.getTime() && 
             order.status !== OrderStatus.DELIVERED &&
             order.status !== OrderStatus.CANCELLED;
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {t('notifications.title')}
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          {t('notifications.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {notificationOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.type;
          const count = option.type !== 'custom' ? getOrderCount() : null;

          return (
            <button
              key={option.type}
              onClick={() => setSelectedType(option.type)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? `${option.borderColor} ${option.bgColor} shadow-lg scale-[1.02]`
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${option.bgColor}`}>
                  <Icon className={`w-5 h-5 ${option.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold ${isSelected ? option.color : 'text-slate-900 dark:text-white'}`}>
                      {option.title}
                    </h3>
                    {count !== null && (
                      <span className={`text-sm font-bold px-2 py-1 rounded-full ${option.bgColor} ${option.color}`}>
                        {count}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        {selectedType === 'delivery' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              {t('notifications.selectDeliveryDate')}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            {deliveryDate && deliveryDueOrders.length > 0 && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {t('notifications.foundOrders')?.replace('{count}', String(deliveryDueOrders.length)) || 
                  `Tìm thấy ${deliveryDueOrders.length} đơn hàng`}
              </p>
            )}
          </div>
        )}

        {selectedType === 'custom' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              {t('notifications.customMessage')}
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={t('notifications.messagePlaceholder')}
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
        )}

        {selectedType !== 'custom' && selectedType !== 'delivery' && (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('notifications.selectedTypeInfo')?.replace('{count}', String(getOrderCount()))?.replace('{type}', notificationOptions.find(o => o.type === selectedType)?.title || '') || 
                `Sẽ gửi thông báo về ${getOrderCount()} ${notificationOptions.find(o => o.type === selectedType)?.title || ''}`}
            </p>
          </div>
        )}

        <button
          onClick={handleSendNotification}
          disabled={isSending || (selectedType === 'delivery' && !deliveryDate) || (selectedType === 'custom' && !customMessage.trim())}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('notifications.sending')}
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {t('notifications.send')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationsPage;

