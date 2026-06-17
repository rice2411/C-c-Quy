import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Loader2, MapPin, Package, Route, Search } from 'lucide-react';
import Box from '@/components/ui/Box';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import { useShippingConfig } from '@/contexts/ShippingConfigContext';
import { getDirections, searchGoogleMaps, SerpApiDirectionsTrip } from '@/services/serpApiService';

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const formatVnd = (n: number): string => `${n.toLocaleString('vi-VN')}đ`;

const routeKm = (trip: SerpApiDirectionsTrip | undefined): number | null => {
  if (!trip) return null;
  if (typeof trip.distance === 'number' && trip.distance > 0) return trip.distance / 1000;
  return null;
};

interface LatLng { lat: number; lng: number; }

export interface ShipInfoSnapshot {
  distanceKm?: number;
  distanceDisplay?: string;
  destLat?: number;
  destLng?: number;
  pickedAddress?: string;
}

export interface AddressMapInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  showMap?: boolean;
  /** Khi false — ẩn panel Khoảng cách / Phí ship (dùng cho Ship tỉnh nhập tay) */
  showFeePanel?: boolean;
  onShipFeeChange?: (fee: number | null) => void;
  /** Khôi phục từ cache đã lưu trên Order — bỏ qua SerpApi fetch. */
  initialShipInfo?: ShipInfoSnapshot;
  /** Emit shipInfo khi user search/click pick — parent lưu vào Order */
  onShipInfoChange?: (info: ShipInfoSnapshot | null) => void;
}

const AddressMapInput: React.FC<AddressMapInputProps> = ({
  value, onChange, id = 'address-map-input',
  placeholder = 'Nhập địa chỉ giao hàng... (Enter để xem map)',
  showMap = true, showFeePanel = true, onShipFeeChange,
  initialShipInfo, onShipInfoChange,
}) => {
  const { config, calcShipFee, enrichAddress } = useShippingConfig();
  const SHOP_ORIGIN = config.shopOrigin;
  const DEFAULT_MAP_URL = useMemo(
    () => `https://maps.google.com/maps?q=${SHOP_ORIGIN.lat},${SHOP_ORIGIN.lng}&z=16&output=embed&hl=vi`,
    [SHOP_ORIGIN.lat, SHOP_ORIGIN.lng],
  );

  // Hydrate từ cache nếu có (tránh fetch SerpApi khi edit order)
  const [pickedCoords, setPickedCoords] = useState<LatLng | null>(() =>
    initialShipInfo?.destLat != null && initialShipInfo?.destLng != null
      ? { lat: initialShipInfo.destLat, lng: initialShipInfo.destLng }
      : null
  );
  const [pickedAddress, setPickedAddress] = useState<string>(initialShipInfo?.pickedAddress ?? '');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [drivingKm, setDrivingKm] = useState<number | null>(initialShipInfo?.distanceKm ?? null);
  const [drivingDisplay, setDrivingDisplay] = useState<string | null>(initialShipInfo?.distanceDisplay ?? null);
  const [drivingLoading, setDrivingLoading] = useState(false);
  const [drivingError, setDrivingError] = useState<string | null>(null);
  const [mapEmbedUrl, setMapEmbedUrl] = useState<string>(() => {
    if (initialShipInfo?.destLat != null && initialShipInfo?.destLng != null) {
      return `https://maps.google.com/maps?saddr=${SHOP_ORIGIN.lat},${SHOP_ORIGIN.lng}&daddr=${initialShipInfo.destLat},${initialShipInfo.destLng}&output=embed&hl=vi`;
    }
    return DEFAULT_MAP_URL;
  });

  const fetchDirections = useCallback(async (opts: { dest?: LatLng; endAddr?: string }) => {
    setDrivingLoading(true);
    setDrivingError(null);
    try {
      const r = await getDirections(null, {
        startCoords: `${SHOP_ORIGIN.lat},${SHOP_ORIGIN.lng}`,
        endCoords: opts.dest ? `${opts.dest.lat},${opts.dest.lng}` : undefined,
        endAddr: opts.dest ? undefined : (opts.endAddr ? enrichAddress(opts.endAddr) : undefined),
        travelMode: 6,
        distanceUnit: 0,
      });
      const routes = r.directions ?? [];
      let bestIdx = -1;
      let bestKm = Infinity;
      routes.forEach((trip, idx) => {
        const km = routeKm(trip);
        if (km != null && km < bestKm) { bestKm = km; bestIdx = idx; }
      });
      if (bestIdx >= 0) {
        const best = routes[bestIdx];
        setDrivingKm(bestKm);
        setDrivingDisplay(best.formatted_distance ?? `${bestKm.toFixed(1)} km`);
      } else {
        setDrivingKm(null);
        setDrivingDisplay(null);
        setDrivingError('Không tìm thấy đường đi — địa chỉ chưa đủ cụ thể?');
      }
    } catch (err: any) {
      setDrivingKm(null);
      setDrivingDisplay(null);
      setDrivingError(err?.message || 'Không tính được khoảng cách');
    } finally {
      setDrivingLoading(false);
    }
  }, [SHOP_ORIGIN.lat, SHOP_ORIGIN.lng, enrichAddress]);

  const handleSearch = useCallback(async () => {
    const q = value.trim();
    if (!q) {
      setMapEmbedUrl(DEFAULT_MAP_URL);
      setPickedCoords(null); setPickedAddress(''); setSearchError(null);
      return;
    }
    setSearching(true); setSearchError(null);
    const enrichedQuery = enrichAddress(q);
    try {
      const r = await searchGoogleMaps(null, { q: enrichedQuery, ll: `@${SHOP_ORIGIN.lat},${SHOP_ORIGIN.lng},14z`, hl: 'vi' });
      // SerpApi đôi khi auto-switch type "search" → "place" và trả place_results (object) thay vì local_results (array)
      const top = r.local_results?.[0] ?? r.place_results;
      if (top?.gps_coordinates) {
        const dest: LatLng = { lat: top.gps_coordinates.latitude, lng: top.gps_coordinates.longitude };
        const addr = top.address || top.title;
        setPickedCoords(dest);
        setPickedAddress(addr);
        setMapEmbedUrl(`https://maps.google.com/maps?saddr=${SHOP_ORIGIN.lat},${SHOP_ORIGIN.lng}&daddr=${dest.lat},${dest.lng}&output=embed&hl=vi`);
        fetchDirections({ dest });
      } else {
        setPickedCoords(null);
        setPickedAddress(q);
        setMapEmbedUrl(`https://maps.google.com/maps?saddr=${encodeURIComponent(SHOP_ORIGIN.name)}&daddr=${encodeURIComponent(enrichedQuery)}&output=embed&hl=vi`);
        fetchDirections({ endAddr: q });
      }
    } catch (err: any) {
      setSearchError(err?.message || String(err));
      setPickedCoords(null);
      setPickedAddress(q);
      setMapEmbedUrl(`https://maps.google.com/maps?saddr=${encodeURIComponent(SHOP_ORIGIN.name)}&daddr=${encodeURIComponent(enrichedQuery)}&output=embed&hl=vi`);
      fetchDirections({ endAddr: q });
    } finally {
      setSearching(false);
    }
  }, [value, fetchDirections, enrichAddress, SHOP_ORIGIN.lat, SHOP_ORIGIN.lng, SHOP_ORIGIN.name, DEFAULT_MAP_URL]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSearch();
    }
  }, [handleSearch]);

  useEffect(() => {
    if (!value.trim()) {
      setPickedCoords(null); setPickedAddress('');
      setDrivingKm(null); setDrivingDisplay(null); setDrivingError(null);
      setSearchError(null); setMapEmbedUrl(DEFAULT_MAP_URL);
    }
  }, [value, DEFAULT_MAP_URL]);

  const straightKm = useMemo(() => pickedCoords ? haversineKm(SHOP_ORIGIN, pickedCoords) : null, [pickedCoords, SHOP_ORIGIN]);
  const effectiveKm = drivingKm ?? (straightKm != null ? straightKm * 1.3 : null);
  const shipFeeData = useMemo(() => effectiveKm != null ? calcShipFee(effectiveKm) : null, [effectiveKm, calcShipFee]);
  const shipFee = shipFeeData?.fee ?? null;

  // Chỉ fire callback khi shipFee đã được tính (có địa chỉ + distance). null = chưa search map,
  // không nên override giá trị parent đã có sẵn (vd: edit order với shipFee 30k đã lưu).
  const prevShipFeeRef = useRef<number | null>(initialShipInfo?.distanceKm != null ? null : null);
  useEffect(() => {
    if (!onShipFeeChange) return;
    if (shipFee === null && prevShipFeeRef.current === null) return;
    prevShipFeeRef.current = shipFee;
    onShipFeeChange(shipFee);
  }, [shipFee, onShipFeeChange]);

  // Emit shipInfo snapshot khi có thay đổi để parent cache vào Order
  const prevShipInfoStrRef = useRef<string>('');
  useEffect(() => {
    if (!onShipInfoChange) return;
    const snapshot: ShipInfoSnapshot | null = (pickedCoords || drivingKm != null) ? {
      distanceKm: drivingKm ?? undefined,
      distanceDisplay: drivingDisplay ?? undefined,
      destLat: pickedCoords?.lat,
      destLng: pickedCoords?.lng,
      pickedAddress: pickedAddress || undefined,
    } : null;
    const key = JSON.stringify(snapshot);
    if (key === prevShipInfoStrRef.current) return;
    prevShipInfoStrRef.current = key;
    onShipInfoChange(snapshot);
  }, [pickedCoords, drivingKm, drivingDisplay, pickedAddress, onShipInfoChange]);

  return (
    <Box layoutClassName="space-y-2">
      <Box layoutClassName="flex gap-2 min-w-0">
        <Box layoutClassName="flex-1 min-w-0">
          <Input id={id} type="text" value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            leftIcon={<MapPin className="h-4 w-4" />}
            leftIconClassName="[&_svg]:h-4 [&_svg]:w-4" />
        </Box>
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-primary-400 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-primary-500 dark:bg-primary-900/30 dark:text-primary-200 dark:hover:bg-primary-900/50"
        >
          {searching
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Search className="h-4 w-4" />}
          Xem map
        </button>
      </Box>

      {showMap ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700">
          <iframe key={mapEmbedUrl} src={mapEmbedUrl} title="Bản đồ đường đi" width="100%" height="240"
            style={{ border: 0, display: 'block' }} referrerPolicy="no-referrer-when-downgrade" />
        </div>
      ) : null}

      {searchError ? (
        <Box layoutClassName="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs dark:border-amber-700 dark:bg-amber-900/20" textClassName="text-amber-700 dark:text-amber-300">
          ⚠️ Search: {searchError}
        </Box>
      ) : null}

      {drivingError ? (
        <Box layoutClassName="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs dark:border-amber-700 dark:bg-amber-900/20" textClassName="text-amber-700 dark:text-amber-300">
          ⚠️ {drivingError}
        </Box>
      ) : null}

      {showFeePanel && pickedAddress ? (
        <Box layoutClassName="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/40">
          <Box layoutClassName="space-y-2 border-b border-slate-100 p-3 dark:border-slate-700">
            <Box layoutClassName="flex items-start gap-2.5">
              <Box layoutClassName="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                <Crosshair className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
              </Box>
              <Box layoutClassName="min-w-0 flex-1">
                <Typography as="div" size="xs" variant="muted" layoutClassName="uppercase tracking-wide">Từ</Typography>
                <Typography as="div" size="sm" layoutClassName="font-medium truncate">{SHOP_ORIGIN.name}</Typography>
              </Box>
            </Box>
            <Box layoutClassName="flex items-start gap-2.5">
              <Box layoutClassName="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                <MapPin className="h-3.5 w-3.5 text-red-600 dark:text-red-300" />
              </Box>
              <Box layoutClassName="min-w-0 flex-1">
                <Typography as="div" size="xs" variant="muted" layoutClassName="uppercase tracking-wide">Đến</Typography>
                <Typography as="div" size="sm" layoutClassName="font-medium truncate">{pickedAddress}</Typography>
              </Box>
            </Box>
          </Box>
          <Box layoutClassName="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-700">
            <Box layoutClassName="p-3">
              <Box layoutClassName="flex items-center gap-1.5">
                <Route className="h-3.5 w-3.5 text-blue-600" />
                <Typography as="span" size="xs" variant="muted" layoutClassName="uppercase tracking-wide font-semibold">Khoảng cách</Typography>
              </Box>
              <Box layoutClassName="mt-1">
                {drivingLoading ? (
                  <Box layoutClassName="inline-flex items-center gap-1 text-sm" textClassName="text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> đang tính...
                  </Box>
                ) : drivingDisplay ? (
                  <Typography as="div" layoutClassName="text-lg font-bold" textClassName="text-blue-700 dark:text-blue-300">{drivingDisplay}</Typography>
                ) : straightKm != null ? (
                  <Typography as="div" layoutClassName="text-sm font-bold" textClassName="text-blue-700 dark:text-blue-300">~ {(straightKm * 1.3).toFixed(1)} km</Typography>
                ) : (
                  <Typography as="div" size="sm" variant="muted">—</Typography>
                )}
              </Box>
            </Box>
            <Box layoutClassName="p-3">
              <Box layoutClassName="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-primary-600" />
                <Typography as="span" size="xs" variant="muted" layoutClassName="uppercase tracking-wide font-semibold">Phí ship</Typography>
              </Box>
              <Box layoutClassName="mt-1">
                {shipFeeData ? (
                  <>
                    <Typography as="div" layoutClassName="text-lg font-bold" textClassName="text-primary-700 dark:text-primary-300">{formatVnd(shipFeeData.fee)}</Typography>
                    <Typography as="div" size="xs" variant="muted">{shipFeeData.label}</Typography>
                  </>
                ) : (
                  <Typography as="div" size="sm" variant="muted">—</Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};

export default AddressMapInput;
