/**
 * CategoryPicker — chọn category từ cây có sẵn hoặc nhập tự do.
 */
import React, { useMemo } from 'react';
import { buildCategoryTree } from '@/types/category';
import type { ProductCategory } from '@/types/category';
import Field from '@/components/ui/Field';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

interface CategoryPickerProps {
  value: string;
  onChange: (value: string) => void;
  categories: ProductCategory[];
  label: string;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({ value, onChange, categories, label }) => {
  const options = useMemo(() => {
    const tree = buildCategoryTree(categories);
    const out: { id: string; name: string; label: string }[] = [];
    const walk = (nodes: typeof tree) => {
      nodes.forEach((n) => {
        out.push({
          id: n.id,
          name: n.name,
          label: `${'  '.repeat(n.depth)}${n.icon || ''} ${n.name}`.trim(),
        });
        if (n.children.length > 0) walk(n.children);
      });
    };
    walk(tree);
    return out;
  }, [categories]);

  return (
    <Field label={label}>
      {options.length > 0 ? (
        <div className="space-y-1">
          <Select
            value={options.find((o) => o.name === value) ? value : ''}
            onChange={(e) => { if (e.target.value) onChange(e.target.value); }}
            fullWidth
            stateClassName="dark:[color-scheme:dark]"
          >
            <option value="" className="dark:bg-slate-700">— Chọn danh mục —</option>
            {options.map((opt) => (
              <option key={opt.id} value={opt.name} className="dark:bg-slate-700">{opt.label}</option>
            ))}
          </Select>
          <Input
            size="sm"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="hoặc nhập tự do"
          />
        </div>
      ) : (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="VD: Bánh kem"
        />
      )}
    </Field>
  );
};

export default CategoryPicker;
