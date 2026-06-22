import React, { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Save, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useSaveSurchargeTags,
  useSurchargeTags,
} from '@/hooks/queries/useSurchargeTagsQuery';
import type { SurchargeTag } from '@/types/surchargeTag';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Spinner from '@/components/ui/Spinner';
import Switch from '@/components/ui/Switch';
import Typography from '@/components/ui/Typography';

/** Gen key ổn định từ tên (slug + suffix base36). */
const generateTagKey = (label: string): string => {
  const slug = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'tag'}-${Date.now().toString(36)}`;
};

// ============ Chip — 1 tag (clickable + X) ============
const TagChip: React.FC<{
  label: string;
  preset: number;
  enabled: boolean;
  editing: boolean;
  onClick: () => void;
  onDelete: () => void;
}> = ({ label, preset, enabled, editing, onClick, onDelete }) => (
  <Box
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter') onClick();
    }}
    layoutClassName="group inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5"
    roundedClassName="rounded-full"
    borderClassName={
      editing
        ? 'border-2 border-primary-400 dark:border-primary-600'
        : 'border border-slate-200 dark:border-slate-600'
    }
    backgroundClassName={
      enabled
        ? 'bg-primary-50 dark:bg-primary-900/30'
        : 'bg-slate-100 dark:bg-slate-800'
    }
    stateClassName="transition-colors"
  >
    <Sparkles className={enabled ? 'h-3.5 w-3.5 text-primary-500' : 'h-3.5 w-3.5 text-slate-400'} />
    <Typography
      as="span"
      size="xs"
      layoutClassName="font-semibold"
      textClassName={
        enabled
          ? 'text-primary-700 dark:text-primary-300'
          : 'text-slate-400 line-through dark:text-slate-500'
      }
    >
      {label || '(chưa đặt tên)'}
    </Typography>
    {preset > 0 ? (
      <Typography
        as="span"
        size="xs"
        textClassName="text-slate-400 dark:text-slate-500"
      >
        · {formatVND(preset)}
      </Typography>
    ) : null}
    <IconButton
      label="Xoá"
      variant="ghost"
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
      sizeClassName="h-4 w-4"
      layoutClassName="ml-0.5 opacity-50 hover:opacity-100"
    >
      <X className="h-3 w-3" strokeWidth={3} />
    </IconButton>
  </Box>
);

// ============ Inline editor cho 1 tag ============
const TagEditor: React.FC<{
  draft: SurchargeTag;
  labelName: string;
  labelPreset: string;
  labelActive: string;
  labelDone: string;
  onChange: (patch: Partial<SurchargeTag>) => void;
  onClose: () => void;
  namePlaceholder: string;
}> = ({
  draft,
  labelName,
  labelPreset,
  labelActive,
  labelDone,
  onChange,
  onClose,
  namePlaceholder,
}) => (
  <Box
    layoutClassName="mt-3 space-y-3 p-3"
    roundedClassName="rounded-xl"
    borderClassName="border-2 border-primary-200 dark:border-primary-800"
    backgroundClassName="bg-primary-50/40 dark:bg-primary-900/10"
  >
    <Box layoutClassName="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Box layoutClassName="min-w-0 flex-1">
        <Label htmlFor="surcharge-tag-name">{labelName}</Label>
        <Input
          id="surcharge-tag-name"
          value={draft.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder={namePlaceholder}
          containerClassName="min-w-[160px]"
          autoFocus
        />
      </Box>
      <Box layoutClassName="min-w-0 sm:w-44">
        <Label htmlFor="surcharge-tag-preset">{labelPreset}</Label>
        <Input
          id="surcharge-tag-preset"
          type="number"
          min={0}
          step={1000}
          value={draft.preset}
          onChange={(e) =>
            onChange({ preset: Math.max(0, Number(e.target.value) || 0) })
          }
          sizeClassName="py-2 text-right text-sm font-semibold"
        />
      </Box>
    </Box>
    <Box layoutClassName="flex items-center justify-between gap-3">
      <Box layoutClassName="flex items-center gap-2">
        <Switch
          checked={draft.active}
          onCheckedChange={(v) => onChange({ active: v })}
          aria-label={labelActive}
        />
        <Typography
          as="span"
          size="sm"
          textClassName="font-medium text-slate-600 dark:text-slate-300"
        >
          {labelActive}
        </Typography>
      </Box>
      <Button
        type="button"
        onClick={onClose}
        leftIcon={<Check />}
        iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
        sizeClassName="px-3 py-1.5 text-xs"
        backgroundClassName="bg-emerald-600"
        textClassName="font-semibold text-white"
        roundedClassName="rounded-lg"
        layoutClassName="inline-flex items-center gap-1.5"
        disableVariantHover
        disableVariantTextColor
      >
        {labelDone}
      </Button>
    </Box>
  </Box>
);

// ============ SurchargeTagsTab main ============
const SurchargeTagsTab: React.FC = () => {
  const { t } = useLanguage();
  const { surchargeTags, loading, error } = useSurchargeTags();
  const { saveSurchargeTags, saving } = useSaveSurchargeTags();

  const [tags, setTags] = useState<SurchargeTag[]>([]);
  const [dirty, setDirty] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // Seed local draft từ query (chỉ khi chưa chỉnh sửa dở — tránh đè data đang nhập).
  useEffect(() => {
    if (dirty) return;
    const sorted = [...surchargeTags].sort((a, b) => a.sortOrder - b.sortOrder);
    setTags(sorted);
  }, [surchargeTags, dirty]);

  useEffect(() => {
    if (error) toast.error(t('surchargeTags.loadFailed'));
  }, [error, t]);

  const editing = useMemo(
    () => tags.find((tg) => tg.key === editingKey),
    [tags, editingKey],
  );

  const addTag = () => {
    const key = generateTagKey('tag');
    setTags((prev) => [
      ...prev,
      { key, label: '', preset: 0, active: true, sortOrder: prev.length },
    ]);
    setEditingKey(key);
    setDirty(true);
  };

  const updateTag = (key: string, patch: Partial<SurchargeTag>) => {
    setTags((prev) => prev.map((tg) => (tg.key === key ? { ...tg, ...patch } : tg)));
    setDirty(true);
  };

  const removeTag = (key: string) => {
    setTags((prev) =>
      prev
        .filter((tg) => tg.key !== key)
        .map((tg, idx) => ({ ...tg, sortOrder: idx })),
    );
    if (editingKey === key) setEditingKey(null);
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      // Chuẩn hoá sortOrder theo thứ tự hiển thị hiện tại.
      const normalized = tags.map((tg, idx) => ({ ...tg, sortOrder: idx }));
      await saveSurchargeTags(normalized);
      toast.success(t('surchargeTags.saveSuccess'));
      setDirty(false);
      setEditingKey(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t('surchargeTags.saveFailed'));
    }
  };

  if (loading) {
    return (
      <Box layoutClassName="flex items-center justify-center p-12">
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <Card
      padding="md"
      borderClassName="border-slate-200 dark:border-slate-700"
      layoutClassName="space-y-4"
    >
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
        <Box>
          <Heading
            level={3}
            layoutClassName="flex items-center gap-2"
            textClassName="text-base font-semibold"
          >
            <Sparkles className="h-5 w-5 text-primary-500" />
            {t('surchargeTags.title')}
          </Heading>
          <Typography size="xs" variant="muted" layoutClassName="mt-1">
            {t('surchargeTags.subtitle')}
          </Typography>
        </Box>
        <Box layoutClassName="flex items-center gap-2">
          <Button
            type="button"
            onClick={addTag}
            leftIcon={<Plus />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
            sizeClassName="px-3 py-1.5 text-xs"
            backgroundClassName="bg-primary-50 dark:bg-primary-900/20"
            textClassName="font-semibold text-primary-700 dark:text-primary-300"
            borderClassName="border border-primary-200 dark:border-primary-800"
            roundedClassName="rounded-lg"
            layoutClassName="inline-flex items-center gap-1.5"
            disableVariantHover
            disableVariantTextColor
          >
            {t('surchargeTags.add')}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            leftIcon={
              saving ? (
                <Spinner size="sm" textClassName="text-white" borderClassName="border-white" />
              ) : (
                <Save />
              )
            }
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-4 py-2 text-sm"
            backgroundClassName="bg-gradient-to-r from-primary-600 to-primary-600"
            textClassName="font-semibold text-white"
            roundedClassName="rounded-xl"
            layoutClassName="inline-flex items-center gap-2 disabled:opacity-50"
            disableVariantHover
            disableVariantTextColor
          >
            {saving ? t('surchargeTags.saving') : t('surchargeTags.save')}
          </Button>
        </Box>
      </Box>

      {tags.length === 0 ? (
        <Typography size="xs" variant="muted">
          {t('surchargeTags.empty')}
        </Typography>
      ) : (
        <Box layoutClassName="flex flex-wrap gap-2">
          {tags.map((tg) => (
            <TagChip
              key={tg.key}
              label={tg.label}
              preset={tg.preset}
              enabled={tg.active}
              editing={editingKey === tg.key}
              onClick={() => setEditingKey(tg.key)}
              onDelete={() => removeTag(tg.key)}
            />
          ))}
        </Box>
      )}

      {editing ? (
        <TagEditor
          draft={editing}
          labelName={t('surchargeTags.name')}
          labelPreset={t('surchargeTags.preset')}
          labelActive={t('surchargeTags.active')}
          labelDone={t('surchargeTags.done')}
          namePlaceholder={t('surchargeTags.namePlaceholder')}
          onChange={(p) => updateTag(editing.key, p)}
          onClose={() => setEditingKey(null)}
        />
      ) : null}
    </Card>
  );
};

export default SurchargeTagsTab;
