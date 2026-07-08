import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  saveUserToLocalStorage,
  getUserFromLocalStorage,
  addAccountToHistory,
} from '@/utils/user/userUtil';
import { clearSsoToken, getSsoToken } from '@/services/auth/ssoToken';
import { UserData } from '@/types/user';

/** User rút gọn gắn vào context (thay cho user đăng nhập). */
export interface CurrentUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  userData: UserData | null; // hồ sơ đầy đủ (role/status) từ BE
  loading: boolean;
  applyLogin: (data: UserData) => void; // gọi sau khi SSO Google thành công
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const toCurrentUser = (data: UserData): CurrentUser => ({
  uid: data.uid,
  email: data.email,
  displayName: data.customName || data.displayName,
  photoURL: data.photoURL,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Khôi phục phiên từ localStorage (SSO token + userData) khi mở app.
  useEffect(() => {
    const cached = getUserFromLocalStorage();
    if (cached && getSsoToken()) {
      setUserData(cached as UserData);
      setCurrentUser(toCurrentUser(cached as UserData));
    }
    setLoading(false);
  }, []);

  /** Áp dụng phiên sau khi đăng nhập Google (token đã lưu trước đó). */
  const applyLogin = (data: UserData) => {
    saveUserToLocalStorage(data);
    addAccountToHistory(data);
    setUserData(data);
    setCurrentUser(toCurrentUser(data));
  };

  const logout = () => {
    clearSsoToken();
    saveUserToLocalStorage(null);
    setUserData(null);
    setCurrentUser(null);
  };

  const value: AuthContextType = { currentUser, userData, loading, applyLogin, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
