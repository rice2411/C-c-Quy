import React, { useMemo, useState } from 'react';
import { Trash2, Save, DollarSign, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { Product } from '@/types';
import { CommissionGroup, calcItemCommission, findGroupForMargin } from '@/types/commissionGroup';
import { updateProduct, removeProductCostPrice } from '@/services/productService';
import FilterToolbar from '@/components/shared/FilterToolbar';
import { formatVND } from '@/utils/format/currencyUtil';
import Card from '@/components/ui/Card';
import Box from '@/components/ui/Box';
import Badge from '@/components/ui/Badge';
import Image from '@/components/ui/Image';
import Typography from '@/components/ui/Typography';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { pct, ButtonSpinner } from './commissionUi';

interface ProductRowProps {
  product: Product;
  groups: CommissionGroup[];
  onSaved: (id: string, costPrice: number | undefined) => void;
  onRemoved: (id: string) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({ product, groups, onSaved, onRemoved }) => {
  const [costInput, setCostInput] = useState<string>(
    product.costPrice !== undefined ? String(product.costPrice) : '',
  );
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const costNum = costInput.trim() === '' ? undefined : Number(costInput);
  const margin =
    costNum !== undefined && product.price > 0 && costNum < product.price
      ? (product.price - costNum) / product.price
      : undefined;
  const group = margin !== undefined ? findGroupForMargin(margin, groups) : undefined;
  const commissionPerUnit = calcItemCommission(product.price, costNum, groups);

  const handleChange = (v: string) => {
    setCostInput(v);
    const parsed = v.trim() === '' ? undefined : Number(v);
    setDirty(parsed !== product.costPrice);
  };

  const handleSave = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      await updateProduct(product.id, { costPrice: costNum });
      onSaved(product.id, costNum);
      setDirty(false);
      toast.success(`Đã lưu cost "${product.name}"`);
    } catch {
      toast.error('Không thể lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm(`Xoá "${product.name}" khỏi danh sách đã có hoa hồng?`)) return;
    setRemoving(true);
    try {
      await removeProductCostPrice(product.id);
      onRemoved(product.id);
      setCostInput('');
      setDirty(false);
      toast.success(`Đã xoá hoa hồng "${product.name}"`);
    } catch {
      toast.error('Không thể xoá');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Box layoutClassName="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <Box layoutClassName="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-700">
        {product.image
          ? <Image src={product.image} alt={product.name} layoutClassName="h-full w-full object-cover" />
          : <Box layoutClassName="flex h-full w-full items-center justify-center bg-slate-100 text-xs text-slate-400 dark:bg-slate-700">?</Box>}
      </Box>

      <Box layoutClassName="min-w-0 flex-1">
        <Typography as="p" size="sm" layoutClassName="truncate font-semibold" textClassName="text-slate-900 dark:text-white">{product.name}</Typography>
        <Typography as="p" size="xs" variant="muted">Giá bán: {formatVND(product.price)}</Typography>
      </Box>

      {group && commissionPerUnit > 0 && (
        <Box layoutClassName="hidden shrink-0 text-right sm:block">
          <Badge
            size="sm"
            borderClassName="border-transparent"
            backgroundClassName="bg-primary-50 dark:bg-primary-900/20"
            textClassName="text-[10px] font-semibold text-primary-700 dark:text-primary-300"
          >
            {group.name}
          </Badge>
          <Typography as="p" size="xs" layoutClassName="mt-0.5" variant="success">
            từ ~{formatVND(commissionPerUnit)}/sp
          </Typography>
          {margin !== undefined && (
            <Typography as="p" layoutClassName="text-[10px]" textClassName="text-slate-400">margin {pct(margin)}</Typography>
          )}
        </Box>
      )}

      <Box layoutClassName="shrink-0 w-28">
        <Input
          type="number"
          min={0}
          value={costInput}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="Giá cost"
          leftIcon={<DollarSign className="h-3.5 w-3.5" />}
          containerClassName="w-full"
          sizeClassName="py-1.5 text-sm"
          backgroundClassName="bg-slate-50 dark:bg-slate-700"
          borderClassName="border-slate-200 dark:border-slate-600"
          focusClassName="focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
          textClassName="text-slate-900 dark:text-white"
         />
      </Box>

      <Button
        type="button"
        disabled={!dirty || saving}
        onClick={handleSave}
        variant="ghost"
        disableVariantHover
        disableVariantTextColor
        layoutClassName="flex shrink-0 items-center gap-1"
        roundedClassName="rounded-lg"
        backgroundClassName="bg-primary-600 hover:bg-primary-700"
        sizeClassName="px-2.5 py-1.5 text-xs"
        textClassName="font-semibold text-white"
        borderClassName="border-transparent"
        stateClassName="transition-colors disabled:cursor-not-allowed disabled:opacity-40">
        {saving ? <ButtonSpinner /> : <Save className="h-3.5 w-3.5" />}
        Lưu
      </Button>

      {product.costPrice !== undefined && (
        <Button
          type="button"
          disabled={removing}
          onClick={handleRemove}
          title="Xoá khỏi danh sách đã có hoa hồng"
          variant="ghost"
          disableVariantHover
          disableVariantTextColor
          layoutClassName="flex shrink-0 items-center justify-center"
          roundedClassName="rounded-lg"
          borderClassName="border border-rose-200 dark:border-rose-900/40"
          backgroundClassName="bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/30"
          sizeClassName="p-1.5"
          textClassName="text-rose-600 dark:text-rose-300"
          stateClassName="transition-colors disabled:cursor-not-allowed disabled:opacity-40">
          {removing ? <ButtonSpinner className="border-rose-400" /> : <Trash2 className="h-3.5 w-3.5" />}
        </Button>
      )}
    </Box>
  );
};

interface ProductsTabProps {
  groups: CommissionGroup[];
  products: Product[];
  onProductsChange: (products: Product[]) => void;
}

const ProductsTab: React.FC<ProductsTabProps> = ({ groups, products, onProductsChange }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? products.filter(p => p.name.toLowerCase().includes(q)) : products;
  }, [products, search]);

  const withCost = filtered.filter(p => p.costPrice !== undefined);
  const withoutCost = filtered.filter(p => p.costPrice === undefined);

  const handleSaved = (id: string, costPrice: number | undefined) => {
    onProductsChange(products.map(p => p.id === id ? { ...p, costPrice } : p));
  };

  const handleRemoved = (id: string) => {
    onProductsChange(products.map(p => p.id === id ? { ...p, costPrice: undefined } : p));
  };

  return (
    <Box layoutClassName="space-y-4">
      <Card padding="none" layoutClassName="p-3" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
        <FilterToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm sản phẩm..."
        />
      </Card>

      {groups.length === 0 && (
        <EmptyState
          icon={<Award className="h-6 w-6" />}
          title="Chưa có nhóm hoa hồng. Vui lòng cài đặt nhóm trước ở tab Nhóm HH."
        />
      )}

      {withCost.length > 0 && (
        <Box layoutClassName="space-y-2">
          <Typography size="xs" variant="muted" layoutClassName="px-1 font-semibold uppercase tracking-wide">
            Đã có giá cost ({withCost.length})
          </Typography>
          {withCost.map(p => <ProductRow key={p.id} product={p} groups={groups} onSaved={handleSaved} onRemoved={handleRemoved} />)}
        </Box>
      )}

      {withoutCost.length > 0 && (
        <Box layoutClassName="space-y-2">
          <Typography size="xs" variant="muted" layoutClassName="px-1 font-semibold uppercase tracking-wide">
            Chưa có giá cost ({withoutCost.length})
          </Typography>
          {withoutCost.map(p => <ProductRow key={p.id} product={p} groups={groups} onSaved={handleSaved} onRemoved={handleRemoved} />)}
        </Box>
      )}

      {filtered.length === 0 && (
        <Box layoutClassName="py-10 text-center" textClassName="text-sm text-slate-400">Không tìm thấy sản phẩm</Box>
      )}
    </Box>
  );
};

export default ProductsTab;
