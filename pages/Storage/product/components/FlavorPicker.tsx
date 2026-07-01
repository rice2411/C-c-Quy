/**
 * FlavorPicker — chọn "vị" cho sản phẩm dạng multi-select tự do.
 * Gõ tên vị + Enter (hoặc dấu phẩy) để thêm chip; bấm × để xoá. Không ảnh hưởng giá.
 */
import React, { useState } from 'react';
import { X, IceCream } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';

interface FlavorPickerProps {
  flavors: string[];
  onChange: (flavors: string[]) => void;
}

const normalize = (raw: string) => raw.trim().replace(/\s+/g, ' ');

const FlavorPicker: React.FC<FlavorPickerProps> = ({ flavors, onChange }) => {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const n = normalize(raw);
    if (!n) return;
    if (flavors.some((f) => f.toLowerCase() === n.toLowerCase())) { setDraft(''); return; }
    onChange([...flavors, n]);
    setDraft('');
  };

  const remove = (value: string) => onChange(flavors.filter((f) => f !== value));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && flavors.length) {
      remove(flavors[flavors.length - 1]);
    }
  };

  return (
    <Card padding="md" layoutClassName="space-y-3">
      <Box layoutClassName="flex items-center justify-between">
        <Box layoutClassName="flex items-center gap-2">
          <IceCream className="h-4 w-4 text-primary-500" />
          <Typography as="span" size="sm" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-900 dark:text-white">
            Vị
          </Typography>
        </Box>
        <Typography as="span" size="xs" variant="muted">{flavors.length} vị</Typography>
      </Box>

      {flavors.length > 0 ? (
        <Box layoutClassName="flex flex-wrap gap-2">
          {flavors.map((f) => (
            <Box
              key={f}
              layoutClassName="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
              borderClassName="border border-primary-200 dark:border-primary-700"
              backgroundClassName="bg-primary-50 dark:bg-primary-900/20">
              <Typography as="span" size="xs" layoutClassName="font-medium" textClassName="text-primary-700 dark:text-primary-300">{f}</Typography>
              <Button
                type="button"
                onClick={() => remove(f)}
                aria-label={`Xoá vị ${f}`}
                variant="ghost"
                disableVariantHover
                disableVariantTextColor
                sizeClassName="p-0.5"
                roundedClassName="rounded-full"
                borderClassName="border border-transparent"
                textClassName="text-primary-500 dark:text-primary-400"
                hoverClassName="hover:bg-primary-100 dark:hover:bg-primary-800/40">
                <X className="h-3 w-3" />
              </Button>
            </Box>
          ))}
        </Box>
      ) : null}

      <Input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => add(draft)}
        placeholder="Gõ vị rồi Enter (vd: Matcha, Socola, Dâu)"
        backgroundClassName="bg-slate-50 dark:bg-slate-700"
      />
    </Card>
  );
};

export default FlavorPicker;
