import { API_BASE_URL } from '@/services/api/client';

/**
 * Cấu hình tầng socket (song song services/api/client.ts cho HTTP).
 * BE phục vụ tại `<origin>/api` → socket.io ở `<origin>`, path `/api/socket.io`
 * (đi đúng prefix `/api` mà Cloudflare Tunnel route về BE).
 *
 * LƯU Ý: file này KHÔNG import socket.io-client → nhẹ, an toàn cho bundle shell.
 * Hàm kết nối thật (`createAuthedSocket`, kéo theo socket.io-client) nằm ở
 * `./connect` và chỉ được dynamic import khi user đủ quyền + đã đăng nhập.
 */
export const SOCKET_URL: string = API_BASE_URL.replace(/\/api\/?$/, '');
export const SOCKET_PATH = '/api/socket.io';

/** BE có cấu hình URL chưa (FE chỉ connect khi có). */
export const isSocketEnabled = (): boolean => Boolean(SOCKET_URL);
