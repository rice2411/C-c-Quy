import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SHIPPING_CONFIG } from '@/types/shippingConfig';
import type { ShippingConfiguration } from '@/types/shippingConfig';
import { fetchShippingConfiguration, saveShippingConfiguration } from '@/services/configurationService';

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

// Cache module-level: chỉ fetch 1 lần dù nhiều consumer mount; save cập nhật cache.
// KHÔNG còn là global context/provider — fetch ON-DEMAND khi consumer (Settings ship /
// ô địa chỉ trong form đơn) thực sự mount, thay vì eager mỗi lần đăng nhập.
let cachedConfig: ShippingConfiguration | null = null;
let inflight: Promise<ShippingConfiguration> | null = null;

export interface UseShippingConfigResult {
  config: ShippingConfiguration;
  loading: boolean;
  saving: boolean;
  error: string | null;
  calcShipFee: (km: number) => CalcShipFeeResult;
  enrichAddress: (addr: string) => string;
  refresh: () => Promise<void>;
  save: (next: ShippingConfiguration, updatedBy?: string | null) => Promise<void>;
}

export const useShippingConfig = (): UseShippingConfigResult => {
  const [config, setConfig] = useState<ShippingConfiguration>(cachedConfig ?? DEFAULT_SHIPPING_CONFIG);
  const [loading, setLoading] = useState<boolean>(!cachedConfig);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const remote = await fetchShippingConfiguration();
      cachedConfig = remote;
      setConfig(remote);
    } catch (err: any) {
      setError(err?.message || 'Không tải được cấu hình phí ship');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cachedConfig) {
      setConfig(cachedConfig);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    inflight = inflight ?? fetchShippingConfiguration();
    inflight
      .then((remote) => {
        cachedConfig = remote;
        inflight = null;
        if (alive) {
          setConfig(remote);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        inflight = null;
        if (alive) {
          setError(err?.message || 'Không tải được cấu hình phí ship');
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const save = useCallback(async (next: ShippingConfiguration, updatedBy?: string | null) => {
    setSaving(true);
    setError(null);
    try {
      await saveShippingConfiguration(next, updatedBy ?? null);
      cachedConfig = next;
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

  return { config, loading, saving, error, calcShipFee, enrichAddress, refresh, save };
};
