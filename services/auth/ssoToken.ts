/**
 * Lưu/đọc SSO JWT (do RiceService phát sau khi đăng nhập Google).
 * Token này gắn vào Authorization: Bearer cho BE CucQuy + socket.
 */
const KEY = 'cq_sso_token';

export const getSsoToken = (): string => {
  try { return localStorage.getItem(KEY) || ''; } catch { return ''; }
};

export const setSsoToken = (token: string): void => {
  try { localStorage.setItem(KEY, token); } catch { /* noop */ }
};

export const clearSsoToken = (): void => {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
};
