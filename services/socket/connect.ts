import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, SOCKET_PATH } from './client';

/**
 * Hàm kết nối socket.io thật — TÁCH RIÊNG để socket.io-client (~nặng) KHÔNG nằm
 * trong bundle shell. Chỉ được `await import('@/services/socket/connect')` khi
 * user đủ quyền (Owner/Admin) + đã đăng nhập (xem RealtimePaymentListener).
 *
 * Token lấy qua hàm async (`auth` dạng hàm) → mỗi lần (re)connect tự lấy token mới,
 * tránh token hết hạn sau 1h. Transport websocket. Caller tự `.on(...)` + `.disconnect()`.
 */
export const createAuthedSocket = (getToken: () => Promise<string>): Socket =>
  io(SOCKET_URL, {
    path: SOCKET_PATH,
    transports: ['websocket'],
    auth: (cb) => {
      getToken()
        .then((token) => cb({ token }))
        .catch(() => cb({ token: '' }));
    },
  });
