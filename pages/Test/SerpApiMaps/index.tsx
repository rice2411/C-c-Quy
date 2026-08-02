import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Loader2, MapPin, Navigation, Package, Route, Search, Truck, X } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Field from '@/components/ui/Field';
import Heading from '@/components/ui/Heading';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import { getDirections, searchGoogleMaps, SerpApiMapsPlace } from '@/services/serpApiService';

import Button from '@/components/ui/Button';
const STORAGE_KEY_ORIGIN = 'test.serpApi.origin';

interface LatLng {
  name: string;
  lat: number;
  lng: number;
}

const DEFAULT_ORIGIN: LatLng = {
  name: '30/10 Nguyen Huu Canh, An Cuu, Hue',
  lat: 16.4474994,
  lng: 107.6065567,
};

const SHIP_FEE_TIERS = [
  { maxKm: 2, fee: 15000, label: '0-2 km' },
  { maxKm: 5, fee: 25000, label: '2-5 km' },
  { maxKm: 10, fee: 40000, label: '5-10 km' },
  { maxKm: 15, fee: 60000, label: '10-15 km' },
] as const;
const EXTRA_PER_KM = 5000;

interface ShipFeeResult { fee: number; tierLabel: string; breakdown: string; }

const calcShipFee = (km: number): ShipFeeResult => {
  for (const tier of SHIP_FEE_TIERS) {
    if (km <= tier.maxKm) return { fee: tier.fee, tierLabel: tier.label, breakdown: `Tier ${tier.label}` };
  }
  const last = SHIP_FEE_TIERS[SHIP_FEE_TIERS.length - 1];
  const extraKm = Math.ceil(km - last.maxKm);
  const total = last.fee + extraKm * EXTRA_PER_KM;
  return { fee: total, tierLabel: `> ${last.maxKm} km`, breakdown: `${last.fee.toLocaleString('vi-VN')}d + ${extraKm}km x ${EXTRA_PER_KM.toLocaleString('vi-VN')}d` };
};

const parseKmFromText = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const m = text.match(/([\d.,]+)\s*km/i);
  if (!m) return null;
  let raw = m[1];
  if (raw.includes('.') && raw.includes(',')) raw = raw.replace(/\./g, '').replace(',', '.');
  else if (raw.includes(',')) raw = raw.replace(',', '.');
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
};

const formatVnd = (n: number): string => `${n.toLocaleString('vi-VN')}d`;

const haversineKm = (a: LatLng, b: LatLng): number => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const SerpApiMapsTestPage: React.FC = () => {
  const [origin, setOrigin] = useState<LatLng>(DEFAULT_ORIGIN);
  const [editingOrigin, setEditingOrigin] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [suggestions, setSuggestions] = useState<SerpApiMapsPlace[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [drivingDistance, setDrivingDistance] = useState<string | null>(null);
  const [drivingDuration, setDrivingDuration] = useState<string | null>(null);
  const [drivingLoading, setDrivingLoading] = useState(false);
  const [drivingError, setDrivingError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const o = localStorage.getItem(STORAGE_KEY_ORIGIN);
      if (o) {
        const p = JSON.parse(o);
        if (typeof p?.lat === 'number' && typeof p?.lng === 'number') setOrigin(p);
      }
    } catch {}
  }, []);

  useEffect(() => {
    setDrivingDistance(null);
    setDrivingDuration(null);
    setDrivingError(null);
  }, [destination?.lat, destination?.lng]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShowSuggest(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const q = addressInput.trim();
    if (q.length < 3) { setSuggestions([]); setSuggestLoading(false); return; }
    debounceRef.current = window.setTimeout(async () => {
      setSuggestLoading(true); setSuggestError(null);
      try {
        const r = await searchGoogleMaps(null, { q, ll: `@${origin.lat},${origin.lng},14z`, hl: 'vi' });
        setSuggestions((r.local_results ?? []).slice(0, 8));
      } catch (err: any) {
        setSuggestError(err?.message || String(err));
        setSuggestions([]);
      } finally { setSuggestLoading(false); }
    }, 350);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [addressInput, origin.lat, origin.lng]);

  const handleSaveOrigin = () => {
    try { localStorage.setItem(STORAGE_KEY_ORIGIN, JSON.stringify(origin)); } catch {}
    setEditingOrigin(false);
  };

  const fetchDirections = async (dest: LatLng) => {
    setDrivingError(null); setDrivingLoading(true);
    try {
      const r = await getDirections(null, { startCoords: `${origin.lat},${origin.lng}`, endCoords: `${dest.lat},${dest.lng}`, travelMode: 6 });
      const first = r.directions?.[0];
      setDrivingDistance(first?.distance != null ? String(first.distance) : null);
      setDrivingDuration(first?.duration != null ? String(first.duration) : null);
      if (!first) setDrivingError('Khong tim thay duong di');
    } catch (err: any) { setDrivingError(err?.message || String(err)); }
    finally { setDrivingLoading(false); }
  };

  const pickPlace = (place: SerpApiMapsPlace) => {
    if (!place.gps_coordinates) return;
    const dest: LatLng = { name: place.title, lat: place.gps_coordinates.latitude, lng: place.gps_coordinates.longitude };
    setDestination(dest);
    setAddressInput(place.address || place.title);
    setShowSuggest(false); setSuggestions([]);
    fetchDirections(dest);
  };

  const handleEnterPress = async () => {
    if (suggestions.length > 0) { pickPlace(suggestions[0]); return; }
    const q = addressInput.trim();
    if (q.length < 3) return;
    setSuggestLoading(true); setSuggestError(null);
    try {
      const r = await searchGoogleMaps(null, { q, ll: `@${origin.lat},${origin.lng},14z`, hl: 'vi' });
      const top = r.local_results?.[0];
      if (top) pickPlace(top);
      else setSuggestError('Khong tim thay dia diem nao khop');
    } catch (err: any) { setSuggestError(err?.message || String(err)); }
    finally { setSuggestLoading(false); }
  };

  const handleClear = () => { setDestination(null); setAddressInput(''); setSuggestions([]); };

  const straightKm = useMemo(() => (destination ? haversineKm(origin, destination) : null), [origin, destination]);
  const drivingKm = useMemo(() => parseKmFromText(drivingDistance), [drivingDistance]);

  const shipFeeInfo = useMemo<{ info: ShipFeeResult; basisKm: number; basisLabel: string } | null>(() => {
    if (drivingKm != null) return { info: calcShipFee(drivingKm), basisKm: drivingKm, basisLabel: 'theo duong lai xe' };
    if (straightKm != null) {
      const est = straightKm * 1.3;
      return { info: calcShipFee(est), basisKm: est, basisLabel: 'uoc tinh (duong thang x 1.3)' };
    }
    return null;
  }, [drivingKm, straightKm]);

  const mapEmbedUrl = useMemo(() => {
    if (destination) return `https://maps.google.com/maps?saddr=${origin.lat},${origin.lng}&daddr=${destination.lat},${destination.lng}&output=embed&hl=vi`;
    return `https://maps.google.com/maps?q=${origin.lat},${origin.lng}&z=16&output=embed&hl=vi`;
  }, [origin, destination]);

  return (
    <Box layoutClassName="space-y-6 p-6 animate-fade-in">
      <Box>
        <Heading level={1} textClassName="text-2xl font-bold">Ban do + Tinh phi ship</Heading>
        <Typography as="p" size="sm" variant="muted" layoutClassName="mt-1">Diem goc co dinh. Go dia chi, Enter de chon ket qua dau. Hien thi map, khoang cach, phi ship.</Typography>
      </Box>

      <Card padding="lg">
        <Box layoutClassName="flex items-center justify-between gap-2">
          <Box layoutClassName="flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-emerald-600" />
            <Heading level={3} textClassName="text-base font-semibold">Diem goc (tiem banh)</Heading>
          </Box>
          <Button type="button" onClick={() => (editingOrigin ? handleSaveOrigin() : setEditingOrigin(true))} className="text-xs font-medium text-primary-600 hover:underline" variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">{editingOrigin ? 'Luu' : 'Sua'}</Button>
        </Box>
        {editingOrigin ? (
          <Box layoutClassName="mt-3 space-y-2">
            <Field label="Ten / Dia chi" htmlFor="origin-name">
              <Input id="origin-name" type="text" value={origin.name} onChange={(e) => setOrigin({ ...origin, name: e.target.value })} />
            </Field>
            <Box layoutClassName="grid grid-cols-2 gap-2">
              <Field label="Lat" htmlFor="origin-lat">
                <Input id="origin-lat" type="number" step="0.0001" value={String(origin.lat)} onChange={(e) => setOrigin({ ...origin, lat: Number(e.target.value) || 0 })} />
              </Field>
              <Field label="Lng" htmlFor="origin-lng">
                <Input id="origin-lng" type="number" step="0.0001" value={String(origin.lng)} onChange={(e) => setOrigin({ ...origin, lng: Number(e.target.value) || 0 })} />
              </Field>
            </Box>
          </Box>
        ) : (
          <Box layoutClassName="mt-3 space-y-1">
            <Typography as="div" size="base" layoutClassName="font-semibold">{origin.name}</Typography>
            <Typography as="div" size="xs" variant="muted" layoutClassName="font-mono">{origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}</Typography>
          </Box>
        )}
      </Card>

      <Card padding="lg">
        <Box layoutClassName="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-red-500" />
          <Heading level={3} textClassName="text-base font-semibold">Dia chi giao hang</Heading>
        </Box>
        <Box layoutClassName="relative mt-3" ref={wrapperRef as any}>
          <Field label="Nhap dia chi" htmlFor="dest-address" hint="Go >= 3 ky tu de goi y - Enter de chon ket qua dau">
            <Box layoutClassName="relative">
              <Input id="dest-address" type="text" value={addressInput}
                onChange={(e) => { setAddressInput(e.target.value); setShowSuggest(true); }}
                onFocus={() => setShowSuggest(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleEnterPress(); }
                  else if (e.key === 'Escape') setShowSuggest(false);
                }}
                placeholder="VD: cho Dong Ba Hue, 123 Tran Phu..."
                leftIcon={<Search />} leftIconClassName="[&_svg]:h-4 [&_svg]:w-4" />
              {addressInput ? (
                <Button type="button" onClick={handleClear} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200" variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                  {suggestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                </Button>
              ) : null}
            </Box>
          </Field>

          {showSuggest && (suggestions.length > 0 || suggestError) ? (
            <Box layoutClassName="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
              {suggestError ? (
                <Box layoutClassName="px-4 py-3 text-sm" textClassName="text-red-600 dark:text-red-300">{suggestError}</Box>
              ) : suggestions.map((place, idx) => {
                const km = place.gps_coordinates ? haversineKm(origin, { name: place.title, lat: place.gps_coordinates.latitude, lng: place.gps_coordinates.longitude }) : null;
                return (
                  <Button key={place.place_id || place.data_id || idx} type="button" onClick={() => pickPlace(place)}
                    className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-primary-50 dark:border-slate-700 dark:hover:bg-primary-900/20" variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                    <Box layoutClassName="min-w-0 flex-1">
                      <Typography as="div" size="sm" layoutClassName="font-semibold truncate">{place.title}</Typography>
                      {place.address ? <Typography as="div" size="xs" variant="muted" layoutClassName="truncate">{place.address}</Typography> : null}
                    </Box>
                    {km != null ? (
                      <Box layoutClassName="shrink-0 rounded-md bg-emerald-100 px-2 py-0.5 dark:bg-emerald-900/40" textClassName="text-[11px] font-bold text-emerald-700 dark:text-emerald-200">{km.toFixed(1)} km</Box>
                    ) : null}
                  </Button>
                );
              })}
            </Box>
          ) : null}
        </Box>
      </Card>

      {destination ? (
        <Card padding="lg">
          <Box layoutClassName="flex items-center justify-between gap-2">
            <Box layoutClassName="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary-600" />
              <Heading level={3} textClassName="text-base font-semibold">Thong tin chuyen giao</Heading>
            </Box>
            {drivingLoading ? (
              <Box layoutClassName="flex items-center gap-1.5 text-xs" textClassName="text-slate-500 dark:text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Dang tinh duong lai xe...
              </Box>
            ) : null}
          </Box>

          <Box layoutClassName="mt-4 space-y-2">
            <Box layoutClassName="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-900/20">
              <Crosshair className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <Box layoutClassName="min-w-0 flex-1">
                <Typography as="div" size="xs" variant="muted" layoutClassName="uppercase tracking-wide">Tu</Typography>
                <Typography as="div" size="sm" layoutClassName="font-semibold">{origin.name}</Typography>
              </Box>
            </Box>
            <Box layoutClassName="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <Box layoutClassName="min-w-0 flex-1">
                <Typography as="div" size="xs" variant="muted" layoutClassName="uppercase tracking-wide">Den</Typography>
                <Typography as="div" size="sm" layoutClassName="font-semibold">{destination.name}</Typography>
              </Box>
            </Box>
          </Box>

          <Box layoutClassName="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Box layoutClassName="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
              <Box layoutClassName="flex items-center gap-1.5">
                <Route className="h-3.5 w-3.5 text-slate-500" />
                <Typography as="span" size="xs" variant="muted" layoutClassName="uppercase tracking-wide">Duong thang</Typography>
              </Box>
              <Typography as="div" size="xl" layoutClassName="mt-1 font-bold" textClassName="text-slate-900 dark:text-slate-100">{straightKm?.toFixed(2)} km</Typography>
              <Typography as="div" size="xs" variant="muted">Haversine</Typography>
            </Box>

            <Box layoutClassName="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <Box layoutClassName="flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-blue-600" />
                <Typography as="span" size="xs" textClassName="uppercase tracking-wide text-blue-700 dark:text-blue-300">Duong lai xe</Typography>
              </Box>
              {drivingDistance ? (
                <>
                  <Typography as="div" size="xl" layoutClassName="mt-1 font-bold" textClassName="text-blue-700 dark:text-blue-200">{drivingDistance}</Typography>
                  {drivingDuration ? <Typography as="div" size="xs" textClassName="text-blue-600 dark:text-blue-300">{drivingDuration}</Typography> : null}
                </>
              ) : drivingLoading ? (
                <Box layoutClassName="mt-2 flex items-center gap-1.5 text-sm" textClassName="text-blue-600 dark:text-blue-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Dang tai...
                </Box>
              ) : (
                <Button type="button" onClick={() => destination && fetchDirections(destination)} className="mt-2 inline-flex items-center gap-1 rounded border border-blue-300 bg-white px-2 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-200" variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                  <Route className="h-3 w-3" /> Tinh lai
                </Button>
              )}
              {drivingError ? <Typography as="div" size="xs" textClassName="mt-1 text-red-600 dark:text-red-300">{drivingError}</Typography> : null}
            </Box>

            <Box layoutClassName="rounded-lg border-2 border-primary-300 bg-gradient-to-br from-primary-50 to-primary-50 p-3 dark:border-primary-600 dark:from-primary-900/30 dark:to-primary-900/30">
              <Box layoutClassName="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-primary-600" />
                <Typography as="span" size="xs" textClassName="uppercase tracking-wide text-primary-700 dark:text-primary-300 font-semibold">Phi ship</Typography>
              </Box>
              {shipFeeInfo ? (
                <>
                  <Typography as="div" size="xl" layoutClassName="mt-1 font-bold" textClassName="text-primary-700 dark:text-primary-200">{formatVnd(shipFeeInfo.info.fee)}</Typography>
                  <Typography as="div" size="xs" textClassName="text-primary-600 dark:text-primary-300">{shipFeeInfo.info.tierLabel} - {shipFeeInfo.basisLabel}</Typography>
                </>
              ) : (
                <Typography as="div" size="sm" variant="muted" layoutClassName="mt-2">-</Typography>
              )}
            </Box>
          </Box>

          {shipFeeInfo ? (
            <Box layoutClassName="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <Typography as="div" size="xs" variant="muted" layoutClassName="mb-2 font-semibold uppercase tracking-wide">Cach tinh phi</Typography>
              <Box layoutClassName="space-y-1">
                {SHIP_FEE_TIERS.map((tier) => {
                  const active = shipFeeInfo.info.tierLabel === tier.label;
                  return (
                    <Box key={tier.label} layoutClassName={`flex items-center justify-between rounded px-2 py-1 text-xs ${active ? 'bg-primary-100 font-bold text-primary-800 dark:bg-primary-900/40 dark:text-primary-200' : 'text-slate-600 dark:text-slate-400'}`}>
                      <span>{tier.label}</span>
                      <span className="font-mono">{formatVnd(tier.fee)}</span>
                    </Box>
                  );
                })}
                <Box layoutClassName={`flex items-center justify-between rounded px-2 py-1 text-xs ${shipFeeInfo.info.tierLabel.startsWith('>') ? 'bg-primary-100 font-bold text-primary-800 dark:bg-primary-900/40 dark:text-primary-200' : 'text-slate-600 dark:text-slate-400'}`}>
                  <span>{`> ${SHIP_FEE_TIERS[SHIP_FEE_TIERS.length - 1].maxKm} km`}</span>
                  <span className="font-mono">{formatVnd(SHIP_FEE_TIERS[SHIP_FEE_TIERS.length - 1].fee)} + {formatVnd(EXTRA_PER_KM)}/km</span>
                </Box>
              </Box>
              {shipFeeInfo.info.tierLabel.startsWith('>') ? (
                <Typography as="div" size="xs" layoutClassName="mt-2 font-mono" textClassName="text-primary-700 dark:text-primary-300">= {shipFeeInfo.info.breakdown}</Typography>
              ) : null}
            </Box>
          ) : null}
        </Card>
      ) : null}

      <Card padding="none" id="map-section">
        <Box layoutClassName="flex items-center gap-2 border-b px-5 py-3" borderClassName="border-slate-100 dark:border-slate-700">
          <Navigation className="h-5 w-5 text-blue-500" />
          <Heading level={3} textClassName="text-base font-semibold">{destination ? 'Duong di tren ban do' : 'Ban do diem goc'}</Heading>
        </Box>
        <iframe key={mapEmbedUrl} src={mapEmbedUrl} title="Google Maps" width="100%" height="450" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </Card>
    </Box>
  );
};

export default SerpApiMapsTestPage;
