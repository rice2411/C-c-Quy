import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useShippingConfig } from '@/hooks/useShippingConfig';
import type { ShippingConfiguration, ShippingTier } from '@/types/shippingConfig';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Field from '@/components/ui/Field';
import Heading from '@/components/ui/Heading';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';
import OriginAddressPicker from '@/components/OriginAddressPicker';

const ShippingSettingsTab: React.FC = () => {
  const { config, loading, saving, save } = useShippingConfig();
  const { currentUser } = useAuth();
  const [draft, setDraft] = useState<ShippingConfiguration>(config);

  useEffect(() => { setDraft(config); }, [config]);

  const updateTier = (idx: number, key: keyof ShippingTier, value: string) => {
    setDraft((d) => {
      const tiers = [...d.tiers];
      const tier = { ...tiers[idx] };
      if (key === 'maxKm' || key === 'fee') {
        (tier as any)[key] = Number(value) || 0;
      } else {
        tier.label = value;
      }
      tiers[idx] = tier;
      return { ...d, tiers };
    });
  };

  const addTier = () => {
    setDraft((d) => ({
      ...d,
      tiers: [...d.tiers, { maxKm: (d.tiers[d.tiers.length - 1]?.maxKm ?? 0) + 2, fee: 0, label: '' }],
    }));
  };

  const removeTier = (idx: number) => {
    setDraft((d) => ({ ...d, tiers: d.tiers.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    // Sort tiers asc trước khi save
    const sortedTiers = [...draft.tiers].sort((a, b) => a.maxKm - b.maxKm);
    const next: ShippingConfiguration = { ...draft, tiers: sortedTiers };
    try {
      await save(next, currentUser?.uid ?? null);
      toast.success('Đã lưu cấu hình phí ship');
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi lưu');
    }
  };

  if (loading) {
    return (
      <Box layoutClassName="flex items-center justify-center py-12">
        <Spinner size="md" />
      </Box>
    );
  }

  return (
    <Box layoutClassName="space-y-4">
      {/* Section header — không phải page header (parent OrderSettingsTab đã có). */}
      <Box layoutClassName="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
        <Box layoutClassName="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary-500" />
          <Heading level={3} textClassName="text-base font-semibold">Phí ship</Heading>
        </Box>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          leftIcon={saving ? <Spinner size="sm" textClassName="text-white" borderClassName="border-white" /> : <Save />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          sizeClassName="px-4 py-2"
          backgroundClassName="bg-primary-600"
          hoverClassName="hover:bg-primary-700"
          textClassName="text-sm font-medium text-white"
          roundedClassName="rounded-lg"
          layoutClassName="inline-flex items-center gap-2"
          stateClassName="transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          disableVariantHover
          disableVariantTextColor
        >
          {saving ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </Box>

      {/* Shop Origin */}
      <Card padding="lg">
        <Heading level={3} textClassName="text-base font-semibold mb-3">📍 Điểm gốc (tiệm bánh)</Heading>
        <OriginAddressPicker
          value={draft.shopOrigin}
          onChange={(next) => setDraft((d) => ({ ...d, shopOrigin: next }))}
        />
      </Card>

      {/* Tiers */}
      <Card padding="lg">
        <Box layoutClassName="flex items-center justify-between mb-3">
          <Heading level={3} textClassName="text-base font-semibold">💰 Bảng phí ship theo km</Heading>
          <Button
            type="button"
            onClick={addTier}
            variant="ghost"
            leftIcon={<Plus />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
            sizeClassName="px-3 py-1.5"
            textClassName="text-xs font-medium text-primary-600 dark:text-primary-300"
            borderClassName="border border-primary-200 dark:border-primary-700"
            backgroundClassName="bg-primary-50 dark:bg-primary-900/20"
            hoverClassName="hover:bg-primary-100 dark:hover:bg-primary-900/40"
            roundedClassName="rounded-md"
            disableVariantHover
            disableVariantTextColor
          >
            Thêm tier
          </Button>
        </Box>

        <Box layoutClassName="space-y-2">
          {draft.tiers.length === 0 ? (
            <Typography size="sm" variant="muted" layoutClassName="text-center py-4">
              Chưa có tier nào. Bấm "Thêm tier" để bắt đầu.
            </Typography>
          ) : (
            draft.tiers.map((tier, idx) => (
              <Box
                key={idx}
                layoutClassName="grid grid-cols-12 items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <Box layoutClassName="col-span-3">
                  <Field label="Max km" htmlFor={`tier-maxkm-${idx}`}>
                    <Input
                      id={`tier-maxkm-${idx}`}
                      type="number"
                      step="0.5"
                      value={String(tier.maxKm)}
                      onChange={(e) => updateTier(idx, 'maxKm', e.target.value)}
                    />
                  </Field>
                </Box>
                <Box layoutClassName="col-span-4">
                  <Field label="Phí (VND)" htmlFor={`tier-fee-${idx}`}>
                    <Input
                      id={`tier-fee-${idx}`}
                      type="number"
                      step="1000"
                      value={String(tier.fee)}
                      onChange={(e) => updateTier(idx, 'fee', e.target.value)}
                    />
                  </Field>
                </Box>
                <Box layoutClassName="col-span-4">
                  <Field label="Label" htmlFor={`tier-label-${idx}`}>
                    <Input
                      id={`tier-label-${idx}`}
                      type="text"
                      value={tier.label}
                      onChange={(e) => updateTier(idx, 'label', e.target.value)}
                      placeholder={`< ${tier.maxKm} km`}
                    />
                  </Field>
                </Box>
                <Box layoutClassName="col-span-1 pb-1">
                  <IconButton
                    type="button"
                    onClick={() => removeTier(idx)}
                    label="Xoá tier"
                    textClassName="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </Box>
              </Box>
            ))
          )}
        </Box>

        {/* Over fee */}
        <Box layoutClassName="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/20 sm:grid-cols-2">
          <Field label="Phí khi vượt tier cuối (VND)" htmlFor="over-fee">
            <Input
              id="over-fee"
              type="number"
              step="1000"
              value={String(draft.overFee)}
              onChange={(e) => setDraft((d) => ({ ...d, overFee: Number(e.target.value) || 0 }))}
            />
          </Field>
          <Field label="Label vượt tier" htmlFor="over-label">
            <Input
              id="over-label"
              type="text"
              value={draft.overLabel}
              onChange={(e) => setDraft((d) => ({ ...d, overLabel: e.target.value }))}
              placeholder="VD: > 6 km"
            />
          </Field>
        </Box>

        {draft.updatedAt ? (
          <Typography size="xs" variant="muted" layoutClassName="mt-3">
            Cập nhật lần cuối: {new Date(draft.updatedAt).toLocaleString('vi-VN')}
            {draft.updatedBy ? ` · bởi ${draft.updatedBy}` : ''}
          </Typography>
        ) : null}
      </Card>
    </Box>
  );
};

export default ShippingSettingsTab;
