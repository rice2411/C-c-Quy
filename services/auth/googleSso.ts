import axios from 'axios';

/**
 * Đổi Google ID token (credential từ Google Identity Services) lấy SSO JWT
 * qua RiceService (broker). Dùng axios trần (khác host, không qua envelope BE CucQuy).
 */
const RICE_AUTH_URL: string =
  (import.meta as any).env?.VITE_RICE_AUTH_URL || 'https://api.riceservice.xyz/api/auth/google';

export interface SsoUser {
  email: string;
  name?: string;
  picture?: string;
}

export const exchangeGoogleCredential = async (
  credential: string,
): Promise<{ token: string; user: SsoUser }> => {
  const res = await axios.post(RICE_AUTH_URL, { credential });
  return res.data as { token: string; user: SsoUser };
};
