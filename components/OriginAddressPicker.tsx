import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Box from '@/components/ui/Box';
import Field from '@/components/ui/Field';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import { searchGoogleMaps } from '@/services/serpApiService';
import type { ShopOrigin } from '@/types/shippingConfig';

export interface OriginAddressPickerProps {
  value: ShopOrigin;
  onChange: (next: ShopOrigin) => void;
}

const OriginAddressPicker: React.FC<OriginAddressPickerProps> = ({ value, onChange }) => {
  const [addressDraft, setAddressDraft] = useState(value.name);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => { setAddressDraft(value.name); }, [value.name]);

  const mapUrl = useMemo(
    () => `https://maps.google.com/maps?q=${value.lat},${value.lng}&z=16&output=embed&hl=vi`,
    [value.lat, value.lng],
  );

  const handleGeocode = useCallback(async () => {
    const q = addressDraft.trim();
    if (q.length < 3) { setSearchError('Địa chỉ quá ngắn'); return; }
    setSearching(true);
    setSearchError(null);
    try {
      const r = await searchGoogleMaps(null, {
        q,
        ll: `@${value.lat},${value.lng},14z`,
        hl: 'vi',
      });
      // SerpApi đôi khi auto-switch type "search" → "place" và trả place_results (object).
      const top = r.local_results?.[0] ?? r.place_results;
      if (top?.gps_coordinates) {
        const newName = top.address || top.title || q;
        onChange({
          ...value,
          name: newName,
          lat: top.gps_coordinates.latitude,
          lng: top.gps_coordinates.longitude,
        });
        setAddressDraft(newName);
        toast.success('Đã tìm thấy toạ độ');
      } else {
        onChange({ ...value, name: q });
        setSearchError('Không tìm thấy toạ độ chính xác — chỉ cập nhật tên địa chỉ');
      }
    } catch (err: any) {
      setSearchError(err?.message || 'Lỗi geocode');
    } finally {
      setSearching(false);
    }
  }, [addressDraft, value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleGeocode();
    }
  }, [handleGeocode]);

  const updateLatLng = (key: 'lat' | 'lng', raw: string) => {
    onChange({ ...value, [key]: Number(raw) || 0 });
  };

  return (
    <Box layoutClassName="space-y-3">
      <Field label="Địa chỉ tiệm (Enter để tự động lấy toạ độ)" htmlFor="origin-address-input">
        <Box layoutClassName="relative">
          <Input
            id="origin-address-input"
            type="text"
            value={addressDraft}
            onChange={(e) => setAddressDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (addressDraft !== value.name) {
                onChange({ ...value, name: addressDraft });
              }
            }}
            placeholder="VD: 30/10 Nguyễn Hữu Cảnh, An Cựu, Huế"
            leftIcon={<MapPin className="h-4 w-4" />}
            leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
            rightIcon={searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 text-slate-400" />}
          />
        </Box>
      </Field>

      {searchError ? (
        <Box layoutClassName="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs dark:border-amber-700 dark:bg-amber-900/20" textClassName="text-amber-700 dark:text-amber-300">
          ⚠️ {searchError}
        </Box>
      ) : null}

      <Box layoutClassName="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        <iframe
          key={mapUrl}
          src={mapUrl}
          title="Bản đồ điểm gốc"
          width="100%"
          height="220"
          style={{ border: 0, display: 'block' }}
          referrerPolicy="no-referrer-when-downgrade"
        />
      </Box>

      <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Vĩ độ (lat)" htmlFor="origin-lat">
          <Input
            id="origin-lat"
            type="number"
            step="0.0000001"
            value={String(value.lat)}
            onChange={(e) => updateLatLng('lat', e.target.value)}
          />
        </Field>
        <Field label="Kinh độ (lng)" htmlFor="origin-lng">
          <Input
            id="origin-lng"
            type="number"
            step="0.0000001"
            value={String(value.lng)}
            onChange={(e) => updateLatLng('lng', e.target.value)}
          />
        </Field>
        <Field label="Thành phố (hint geocode)" htmlFor="origin-city">
          <Input
            id="origin-city"
            type="text"
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            placeholder="VD: Huế"
          />
        </Field>
      </Box>

      <Typography size="xs" variant="muted">
        💡 Gõ địa chỉ rồi nhấn <kbd className="rounded border border-slate-300 bg-slate-100 px-1 dark:border-slate-600 dark:bg-slate-700">Enter</kbd> để tự động tìm toạ độ. Hoặc nhập tay lat/lng nếu đã biết.
      </Typography>
    </Box>
  );
};

export default OriginAddressPicker;
