import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SHIPPING_CONFIG } from '@/types/shippingConfig';
import type { ShippingConfiguration } from '@/types/shippingConfig';
import { fetchShippingConfiguration, saveShippingConfiguration } from '@/services/configurationService';
import { useAuth } from './AuthContext';

export interface CalcShipFeeResult {
  fee: number;
  label: string;
}

/** Pure: tính phí ship theo km dựa trên config truyền vào. */
export const calcShipFeeWithConfig = (
  km: number,
  config: ShippingConfiguration,
): CalcShipFeeResult => {
  const sortedTiers = [...config.tiers].sort((a, b) => a.maxKm - b.maxKm);
  for (const tier of sortedTiers) {
    if (km <= tier.maxKm) return { fee: tier.fee, label: tier.label };
  }
  return { fee: config.overFee, label: config.overLabel };
};

/** Pure: append city vào address nếu chưa có (giảm ambiguity SerpApi geocode). */
export const enrichAddressWithConfig = (
  addr: string,
  config: ShippingConfiguration,
): string => {
  const lower = addr.toLowerCase();
  const cityLower = config.shopOrigin.city.toLowerCase();
  if (lower.includes(cityLower) || lower.includes('hue')) return addr;
  return `${addr}, ${config.shopOrigin.city}`;
};

interface ShippingConfigContextValue {
  config: ShippingConfiguration;
  loading: boolean;
  saving: boolean;
  error: string | null;
  /** Tính phí ship đã bind config hiện tại. */
  calcShipFee: (km: number) => CalcShipFeeResult;
  /** Enrich address với city từ config hiện tại. */
  enrichAddress: (addr: string) => string;
  refresh: () => Promise<void>;
  save: (next: ShippingConfiguration, updatedBy?: string | null) => Promise<void>;
}

const ShippingConfigContext = createContext<ShippingConfigContextValue | null>(null);

export const ShippingConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState<ShippingConfiguration>(DEFAULT_SHIPPING_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const remote = await fetchShippingConfiguration();
      setConfig(remote);
    } catch (err: any) {
      setError(err?.message || 'Không tải được cấu hình phí ship');
    } finally {
      setLoading(false);
    }
  }, []);

  // Chỉ tải khi ĐÃ đăng nhập (tránh gọi API 401 ở màn login).
  useEffect(() => {
    if (currentUser) refresh();
    else setLoading(false);
  }, [currentUser, refresh]);

  const save = useCallback(async (next: ShippingConfiguration, updatedBy?: string | null) => {
    setSaving(true);
    setError(null);
    try {
      await saveShippingConfiguration(next, updatedBy ?? null);
      setConfig(next);
    } catch (err: any) {
      setError(err?.message || 'Không lưu được cấu hình phí ship');
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const calcShipFee = useCallback((km: number) => calcShipFeeWithConfig(km, config), [config]);
  const enrichAddress = useCallback((addr: string) => enrichAddressWithConfig(addr, config), [config]);

  const value = useMemo<ShippingConfigContextValue>(() => ({
    config, loading, saving, error,
    calcShipFee, enrichAddress, refresh, save,
  }), [config, loading, saving, error, calcShipFee, enrichAddress, refresh, save]);

  return (
    <ShippingConfigContext.Provider value={value}>
      {children}
    </ShippingConfigContext.Provider>
  );
};

export const useShippingConfig = (): ShippingConfigContextValue => {
  const ctx = useContext(ShippingConfigContext);
  if (!ctx) throw new Error('useShippingConfig phải dùng trong <ShippingConfigProvider>');
  return ctx;
};
