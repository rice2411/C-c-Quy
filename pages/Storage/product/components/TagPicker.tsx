/**
 * TagPicker — chọn tag sản phẩm từ ProductBadge config.
 */
import React from 'react';
import type { ProductBadge } from '@/types/badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

import Heading from '@/components/ui/Heading';
interface TagPickerProps {
  tags: string[];
  productBadges: ProductBadge[];
  onChange: (tags: string[]) => void;
}

const normalizeTag = (raw: string) => raw.trim().replace(/\s+/g, ' ');

const TagPicker: React.FC<TagPickerProps> = ({ tags, productBadges, onChange }) => {
  const hasTag = (value: string) => {
    const n = normalizeTag(value).toLowerCase();
    return tags.some((t) => t.toLowerCase() === n);
  };

  const toggle = (raw: string) => {
    const n = normalizeTag(raw);
    if (!n) return;
    if (hasTag(n)) onChange(tags.filter((t) => t.toLowerCase() !== n.toLowerCase()));
    else onChange([...tags, n]);
  };

  return (
    <Card padding="md" layoutClassName="space-y-3">
      <div className="flex items-center justify-between">
        <Heading level={3} textClassName="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
          Tag sản phẩm{' '}
          <span className="text-slate-500 dark:text-slate-400 font-normal">(từ cấu hình Badges)</span>
        </Heading>
        <span className="text-xs text-slate-500 dark:text-slate-400">{tags.length} đã chọn</span>
      </div>

      {productBadges.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {productBadges.map((badge) => {
            const selected = hasTag(badge.name);
            return (
              <Button
                key={badge.id}
                type="button"
                variant="ghost"
                disableVariantHover
                disableVariantTextColor
                onClick={() => toggle(badge.name)}
                sizeClassName="px-2.5 py-1 text-xs"
                roundedClassName="rounded-full"
                borderClassName="border-2"
                layoutClassName="inline-flex items-center gap-1"
                textClassName="font-medium"
                stateClassName="transition-all"
                style={{
                  backgroundColor: selected ? badge.color + '33' : 'transparent',
                  color: badge.color,
                  borderColor: selected ? badge.color : badge.color + '55',
                  opacity: selected ? 1 : 0.75,
                }}
              >
                {badge.icon ? <span>{badge.icon}</span> : null}
                {badge.name}
                {selected ? <span style={{ fontSize: '0.7em' }}>✓</span> : null}
              </Button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Chưa có badge sản phẩm nào. Tạo trong <strong>Settings → Badges</strong>.
        </p>
      )}
    </Card>
  );
};

export default TagPicker;
