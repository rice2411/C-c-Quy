import React from "react";
import { Calendar, User, Package } from "lucide-react";
import { Order } from "@/types";
import {
  STATUS_COLORS,
  PAYMENT_METHOD_COLORS,
  PAYMENT_STATUS_COLORS,
} from "@/constant/order";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatVND } from "@/utils/currencyUtil";
import { formatDateOnly, formatDateTime } from '@/utils/dateUtil';

interface OrderListMobileProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  renderProductSummary: (order: Order) => React.ReactNode;
}

// Mobile-first card layout extracted to keep OrderList lean
const OrderListMobile: React.FC<OrderListMobileProps> = ({
  orders,
  onSelectOrder,
  renderProductSummary,

}) => {
  const { t } = useLanguage();

  return (
    <div className="lg:hidden p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 flex-1 overflow-y-auto">
      {orders.length > 0 ? (
        orders.map((order) => (
          <div
            key={order.id}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer relative group"
            onClick={() => onSelectOrder(order)}
          >
            <div className="flex justify-between items-center mb-3">
              <div>
                <span
                  className="text-orange-600 dark:text-orange-400 font-bold text-sm"
                  title={order.id}
                >
                  #{order.orderNumber}
                </span>
                <div className="flex items-center text-slate-400 dark:text-slate-500 text-xs mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(order.createdAt.toDate()).toLocaleDateString()}
                </div>
                {order.deliveryDate && (
                  <div className="flex items-center text-slate-400 dark:text-slate-500 text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {`${t("orders.tableDeliveryDate")}: ${formatDateOnly(
                      order.deliveryDate
                    )}`}
                    {order.deliveryTime && ` • ${order.deliveryTime}`}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 items-center">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {t("orders.tableStatus")}
                </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${
                  STATUS_COLORS[order.status]
                }`}
              >
                {t(`orders.statusLabels.${order.status}`)}
              </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
                    {order.customer.name}
                  </p>
                  {(order.customer.email || order.customer.phone) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {order.customer.email || order.customer.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  {renderProductSummary(order)}
                </div>
              </div>

              <div className="mt-1 pt-2 border-t border-slate-100 dark:border-slate-600 flex justify-between items-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("orders.tableTotal")}
                </p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {formatVND(order.total)}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {t("detail.payment")}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-[11px] font-semibold border border-transparent inline-flex w-fit ${
                    PAYMENT_STATUS_COLORS[order.paymentStatus]
                  } whitespace-nowrap`}
                >
                  {t(`orders.paymentStatusLabels.${order.paymentStatus}`)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {t("detail.paymentMethod")}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-[11px] font-semibold border border-transparent inline-flex w-fit ${
                    PAYMENT_METHOD_COLORS[order.paymentMethod]
                  }`}
                >
                  {order.paymentMethod === "BANKING"
                    ? t("paymentMethod.banking")
                    : t("paymentMethod.cash")}
                </span>
              </div>
           
                <span className="block">
                  {t("orders.labelCreated")}:{" "}
                  {formatDateTime(
                    order.createdAt
                  )} {order.createdBy && `(${order.createdBy})`}
                </span>
                <span className="block">
                  {t("orders.labelUpdated")}: {formatDateTime(order.updatedAt)} {order.updatedBy && `(${order.updatedBy})`}
                </span>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 border-dashed">
          {t("orders.noOrdersCriteria")}
        </div>
      )}
    </div>
  );
};

export default OrderListMobile;
