import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchScreenConfiguration, saveScreenConfiguration } from '@/services/configurationService';
import { ScreenVisibilityMap } from '@/types';
import { useAuth } from './AuthContext';

interface ScreenConfigContextType {
  screenVisibility: ScreenVisibilityMap;
  loading: boolean;
  saving: boolean;
  refresh: () => Promise<void>;
  isScreenEnabled: (path: string) => boolean;
  saveVisibility: (nextVisibility: ScreenVisibilityMap) => Promise<void>;
}

const ScreenConfigContext = createContext<ScreenConfigContextType | undefined>(undefined);

export const useScreenConfig = () => {
  const context = useContext(ScreenConfigContext);
  if (!context) {
    throw new Error('useScreenConfig must be used within a ScreenConfigProvider');
  }
  return context;
};

export const ScreenConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [screenVisibility, setScreenVisibility] = useState<ScreenVisibilityMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const config = await fetchScreenConfiguration();
      setScreenVisibility(config.screenVisibility || {});
    } catch {
      // Chưa đăng nhập / lỗi tạm → bỏ qua, không crash màn login.
    } finally {
      setLoading(false);
    }
  };

  // Chỉ tải cấu hình khi ĐÃ đăng nhập (tránh gọi API 401 ở màn login).
  useEffect(() => {
    if (currentUser) refresh();
    else setLoading(false);
  }, [currentUser]);

  const saveVisibility = async (nextVisibility: ScreenVisibilityMap) => {
    setSaving(true);
    try {
      await saveScreenConfiguration(nextVisibility, currentUser?.uid);
      setScreenVisibility(nextVisibility);
    } finally {
      setSaving(false);
    }
  };

  const value = useMemo(
    () => ({
      screenVisibility,
      loading,
      saving,
      refresh,
      isScreenEnabled: (path: string) => screenVisibility[path] !== false,
      saveVisibility,
    }),
    [screenVisibility, loading, saving]
  );

  return <ScreenConfigContext.Provider value={value}>{children}</ScreenConfigContext.Provider>;
};

