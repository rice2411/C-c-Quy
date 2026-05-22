import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Crosshair, Loader2, MapPin, Package, Route } from 'lucide-react';
import Box from '@/components/ui/Box';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import { getDirections, searchGoogleMaps, SerpApiDirectionsTrip } from '@/services/serpApiService';

const SHOP_ORIGIN = {
  name: '30/10 Nguyễn Hữu Cảnh, An Cựu, Huế',
  lat: 16.4474994,
  lng: 107.6065567,
  city: 'Huế',
};

const DEFAULT_MAP_URL = `https://maps.google.com/maps?q=${SHOP_ORIGIN.lat},${SHOP_ORIGIN.lng}&z=16&output=embed&hl=vi`;

const SHIP_FEE_TIERS = [
  { maxKm: 2, fee: 10000, label: '< 2 km' },
  { maxKm: 4, fee: 15000, label: '2 - 4 km' },
  { maxKm: 6, fee: 20000, label: '4 - 6 km' },
];
const OVER_FEE = 25000;
const OVER_LABEL = '> 6 km';

const calcShipFee = (km: number): { fee: number; label: string } => {
  for (const t of SHIP_FEE_TIERS) if (km <= t.maxKm) return { fee: t.fee, label: t.label };
  return { fee: OVER_FEE, label: OVER_LABEL };
};

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const formatVnd = (n: number): string => `${n.toLocaleString('vi-VN')}đ`;

const enrichAddress = (addr: string): string => {
  const lower = addr.toLowerCase();
  if (lower.includes('huế') || lower.includes('hue')) return addr;
  return `${addr}, ${SHOP_ORIGIN.city}`;
};

const routeKm = (trip: SerpApiDirectionsTrip | undefined): number | null => {
  if (!trip) return null;
  if (typeof trip.distance === 'number' && trip.distance > 0) return trip.distance / 1000;
  return null;
};

interface LatLng { lat: number; lng: number; }

export interface AddressMapInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  showMap?: boolean;
  onShipFeeChange?: (fee: number | null) => void;
}

const AddressMapInput: React.FC<AddressMapInputProps> = ({
  value, onChange, id = 'address-map-input',
  placeholder = 'Nhập địa chỉ giao hàng... (Enter để xem map)',
  showMap = true, onShipFeeChange,
}) => {
  const [pickedCoords, setPickedCoords] = useState<LatLng | null>(null);
  const [pickedAddress, setPickedAddress] = useState<string>('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [drivingKm, setDrivingKm] = useState<number | null>(null);
  const [drivingDisplay, setDrivingDisplay] = useState<string | null>(null);
  const [drivingLoading, setDrivingLoading] = useState(false);
  const [drivingError, setDrivingError] = useState<string | null>(null);
  const [mapEmbedUrl, setMapEmbedUrl] = useState(DEFAULT_MAP_URL);

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
  }, []);

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
      const top = r.local_results?.[0];
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
  }, [value, fetchDirections]);

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
  }, [value]);

  const straightKm = useMemo(() => pickedCoords ? haversineKm(SHOP_ORIGIN, pickedCoords) : null, [pickedCoords]);
  const effectiveKm = drivingKm ?? (straightKm != null ? straightKm * 1.3 : null);
  const shipFeeData = useMemo(() => effectiveKm != null ? calcShipFee(effectiveKm) : null, [effectiveKm]);
  const shipFee = shipFeeData?.fee ?? null;

  useEffect(() => { if (onShipFeeChange) onShipFeeChange(shipFee); }, [shipFee, onShipFeeChange]);

  return (
    <Box layoutClassName="space-y-2">
      <Box layoutClassName="relative">
        <Input id={id} type="text" value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          leftIcon={<MapPin className="h-4 w-4" />}
          leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
          rightIcon={searching ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined} />
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

      {pickedAddress ? (
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
                <Package className="h-3.5 w-3.5 text-orange-600" />
                <Typography as="span" size="xs" variant="muted" layoutClassName="uppercase tracking-wide font-semibold">Phí ship</Typography>
              </Box>
              <Box layoutClassName="mt-1">
                {shipFeeData ? (
                  <>
                    <Typography as="div" layoutClassName="text-lg font-bold" textClassName="text-orange-700 dark:text-orange-300">{formatVnd(shipFeeData.fee)}</Typography>
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
