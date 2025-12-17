import { UserData, UserRole } from '@/types/user';
const USER_STORAGE_KEY = 'cucquybakery_user';

export interface StoredUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
}

/**
 * Lưu thông tin user vào localStorage
 * @param user - User object từ Firebase Auth hoặc null để xóa
 */
export const saveUserToLocalStorage = (user: UserData | null): void => {
  try {
    if (user) {
      const userData: StoredUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,

      };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
  }
};

/**
 * Đọc thông tin user từ localStorage
 * @returns StoredUser object hoặc null nếu không tìm thấy
 */
export const getUserFromLocalStorage = (): StoredUser | null => {
  try {
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    if (!userData) return null;
    
    const parsed = JSON.parse(userData) as StoredUser;
    return parsed;
  } catch (error) {
    console.error('Error reading user from localStorage:', error);
    return null;
  }
};

/**
 * Xóa thông tin user khỏi localStorage
 */
export const removeUserFromLocalStorage = (): void => {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error('Error removing user from localStorage:', error);
  }
};

/**
 * Kiểm tra xem có user trong localStorage không
 * @returns true nếu có user, false nếu không
 */
export const hasUserInLocalStorage = (): boolean => {
  return getUserFromLocalStorage() !== null;
};

/**
 * Lấy UID của user từ localStorage
 * @returns UID string hoặc null
 */
export const getUserUidFromLocalStorage = (): string | null => {
  const user = getUserFromLocalStorage();
  return user?.uid || null;
};

/**
 * Lấy email của user từ localStorage
 * @returns Email string hoặc null
 */
export const getUserEmailFromLocalStorage = (): string | null => {
  const user = getUserFromLocalStorage();
  return user?.email || null;
};

/**
 * Lấy displayName của user từ localStorage
 * @returns DisplayName string hoặc null
 */
export const getUserDisplayNameFromLocalStorage = (): string | null => {
  const user = getUserFromLocalStorage();
  return user?.displayName || null;
};

/**
 * Lấy photoURL của user từ localStorage
 * @returns PhotoURL string hoặc null
 */
export const getUserPhotoURLFromLocalStorage = (): string | null => {
  const user = getUserFromLocalStorage();
  return user?.photoURL || null;
};

// ==================== Account History Management ====================

const ACCOUNTS_HISTORY_KEY = 'cucquybakery_accounts_history';

export interface AccountHistory {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  lastLoginAt: string;
}

/**
 * Lấy danh sách các tài khoản đã từng đăng nhập
 * @returns Mảng các AccountHistory
 */
export const getAccountsHistory = (): AccountHistory[] => {
  try {
    const historyData = localStorage.getItem(ACCOUNTS_HISTORY_KEY);
    if (!historyData) return [];
    
    const parsed = JSON.parse(historyData) as AccountHistory[];
    // Sắp xếp theo lastLoginAt mới nhất trước
    return parsed.sort((a, b) => 
      new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime()
    );
  } catch (error) {
    console.error('Error reading accounts history:', error);
    return [];
  }
};

/**
 * Thêm hoặc cập nhật tài khoản vào lịch sử đăng nhập
 * @param user - User object từ Firebase Auth
 */
export const addAccountToHistory = (user: UserData): void => {
  try {
    const history = getAccountsHistory();
    const now = new Date().toISOString();
    
    // Kiểm tra xem tài khoản đã tồn tại chưa
    const existingIndex = history.findIndex(acc => acc.uid === user.uid);
    
    if (existingIndex >= 0) {
      // Cập nhật thông tin và lastLoginAt
      history[existingIndex] = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLoginAt: now
      };
    } else {
      // Thêm tài khoản mới
      history.unshift({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLoginAt: now
      });
    }
    
    // Giới hạn tối đa 10 tài khoản
    const limitedHistory = history.slice(0, 10);
    
    localStorage.setItem(ACCOUNTS_HISTORY_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Error saving account to history:', error);
  }
};

/**
 * Xóa một tài khoản khỏi lịch sử
 * @param uid - UID của tài khoản cần xóa
 */
export const removeAccountFromHistory = (uid: string): void => {
  try {
    const history = getAccountsHistory();
    const filtered = history.filter(acc => acc.uid !== uid);
    localStorage.setItem(ACCOUNTS_HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing account from history:', error);
  }
};

/**
 * Xóa toàn bộ lịch sử tài khoản
 */
export const clearAccountsHistory = (): void => {
  try {
    localStorage.removeItem(ACCOUNTS_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing accounts history:', error);
  }
};
