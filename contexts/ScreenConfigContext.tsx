import React, { createContext, useContext, useMemo } from 'react';
import { ScreenVisibilityMap } from '@/types';
import { useSaveScreenConfig, useScreenConfigQuery } from '@/hooks/queries/useConfigQuery';
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

/**
 * Provider GIỮ NGUYÊN context API (consumer dùng useScreenConfig() không đổi),
 * nhưng RUỘT fetch qua React Query (qk.screenConfig.all) thay cho useEffect/useState.
 * Vẫn wrap routing ở App.tsx như cũ — chỉ đổi cách lấy/lưu data.
 */
export const ScreenConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { config, loading, refetch } = useScreenConfigQuery();
  const { save, saving } = useSaveScreenConfig();

  const screenVisibility = config?.screenVisibility ?? {};

  const value = useMemo<ScreenConfigContextType>(
    () => ({
      screenVisibility,
      loading,
      saving,
      refresh: refetch,
      isScreenEnabled: (path: string) => screenVisibility[path] !== false,
      saveVisibility: async (nextVisibility: ScreenVisibilityMap) => {
        await save({ screenVisibility: nextVisibility, updatedBy: currentUser?.uid });
      },
    }),
    [screenVisibility, loading, saving, refetch, save, currentUser?.uid]
  );

  return <ScreenConfigContext.Provider value={value}>{children}</ScreenConfigContext.Provider>;
};
