import React, { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/services/api/client';
import { qk } from '@/hooks/queryKeys';
import { playNotificationSound, primeNotificationSound } from '@/utils/sound';
import { UserRole } from '@/types/user';
import { PaymentStatus } from '@/types/enums';
import type { Order } from '@/types';

/** BE phục vụ tại `<origin>/api` → socket.io ở `<origin>` (bỏ hậu tố /api). */
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

/** Chỉ Owner (super_admin) + Admin nhận noti thanh toán (khớp gate ở BE gateway). */
const NOTIFY_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

interface OrderPaidEvent {
  orderNumber: string;
  amount: number;
}

/**
 * Lắng nghe realtime: khi webhook SePay đánh dấu 1 đơn đã thanh toán, BE bắn
 * `order:paid` → hiện toast cho Owner/Admin đang online. Component không render gì.
 * Token gửi qua `auth` dạng hàm → mỗi lần (re)connect tự lấy ID token mới (tránh
 * token hết hạn sau 1h).
 */
const RealtimePaymentListener: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const queryClient = useQueryClient();
  const role = userData?.role;

  // Mở khoá âm thông báo sau cử chỉ đầu tiên của người dùng (autoplay policy).
  useEffect(() => primeNotificationSound(), []);

  useEffect(() => {
    if (!currentUser || !role || !NOTIFY_ROLES.includes(role) || !SOCKET_URL) {
      return;
    }

    const socket: Socket = io(SOCKET_URL, {
      path: '/api/socket.io',
      transports: ['websocket'],
      auth: (cb) => {
        currentUser
          .getIdToken()
          .then((token) => cb({ token }))
          .catch(() => cb({ token: '' }));
      },
    });

    socket.on('order:paid', (e: OrderPaidEvent) => {
      const amount = (e?.amount || 0).toLocaleString('vi-VN');
      playNotificationSound();
      toast.success(`💰 Đơn ${e?.orderNumber} đã thanh toán ${amount}đ`, {
        duration: 6000,
      });

      // Cập nhật trạng thái ngay trong cache (khỏi refresh): set đơn khớp = PAID...
      if (e?.orderNumber) {
        queryClient.setQueryData<Order[]>(qk.orders.all, (old) =>
          Array.isArray(old)
            ? old.map((o) =>
                o.orderNumber === e.orderNumber
                  ? { ...o, paymentStatus: PaymentStatus.PAID }
                  : o,
              )
            : old,
        );
      }
      // ...rồi refetch để đồng bộ các field server tính (sepayId, updatedAt...).
      queryClient.invalidateQueries({ queryKey: qk.orders.all });
    });

    return () => {
      socket.off('order:paid');
      socket.disconnect();
    };
  }, [currentUser, role, queryClient]);

  return null;
};

export default RealtimePaymentListener;
