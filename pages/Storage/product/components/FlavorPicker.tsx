/**
 * FlavorPicker — chọn "vị" cho sản phẩm (multi-select) từ danh sách vị quản lý (có màu).
 * Bấm chip để chọn/bỏ. Quản lý danh sách vị ở Cài đặt → Vị.
 */
import React from 'react';
import { IceCream } from 'lucide-react';
import { useFlavors } from '@/hooks/queries/useFlavorsQuery';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';

interface FlavorPickerProps {
  flavors: string[];
  onChange: (flavors: string[]) => void;
}

const FlavorPicker: React.FC<FlavorPickerProps> = ({ flavors, onChange }) => {
  const { flavors: allFlavors } = useFlavors();

  const has = (name: string) => flavors.some((f) => f.toLowerCase() === name.toLowerCase());
  const toggle = (name: string) => {
    if (has(name)) onChange(flavors.filter((f) => f.toLowerCase() !== name.toLowerCase()));
    else onChange([...flavors, name]);
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
        <Typography as="span" size="xs" variant="muted">{flavors.length} đã chọn</Typography>
      </Box>

      {allFlavors.length > 0 ? (
        <Box layoutClassName="flex flex-wrap gap-2">
          {allFlavors.map((fl) => {
            const selected = has(fl.name);
            const color = fl.color || '#64748b';
            return (
              <Button
                key={fl.id}
                type="button"
                onClick={() => toggle(fl.name)}
                variant="ghost"
                disableVariantHover
                disableVariantTextColor
                sizeClassName="px-2.5 py-1 text-xs"
                roundedClassName="rounded-full"
                borderClassName="border-2"
                layoutClassName="inline-flex items-center gap-1"
                textClassName="font-medium"
                stateClassName="transition-all"
                style={{
                  backgroundColor: selected ? color + '33' : 'transparent',
                  color,
                  borderColor: selected ? color : color + '55',
                  opacity: selected ? 1 : 0.75,
                }}>
                {fl.name}
                {selected ? <Typography as="span" size="xs">✓</Typography> : null}
              </Button>
            );
          })}
        </Box>
      ) : (
        <Typography size="xs" variant="muted">
          Chưa có vị nào. Tạo trong Cài đặt → Vị.
        </Typography>
      )}
    </Card>
  );
};

export default FlavorPicker;
