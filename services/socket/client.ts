import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/services/api/client';

/**
 * Tầng kết nối socket.io (song song services/api/client.ts cho HTTP).
 * BE phục vụ tại `<origin>/api` → socket.io ở `<origin>`, path `/api/socket.io`
 * (đi đúng prefix `/api` mà Cloudflare Tunnel route về BE).
 */
export const SOCKET_URL: string = API_BASE_URL.replace(/\/api\/?$/, '');
export const SOCKET_PATH = '/api/socket.io';

/** BE có cấu hình URL chưa (FE chỉ connect khi có). */
export const isSocketEnabled = (): boolean => Boolean(SOCKET_URL);

/**
 * Tạo socket đã xác thực. Token lấy qua hàm async (`auth` dạng hàm) → mỗi lần
 * (re)connect tự lấy ID token mới, tránh token hết hạn sau 1h. Transport websocket.
 * Caller tự `.on(...)` + `.disconnect()` khi unmount.
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
