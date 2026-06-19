import React, { useEffect, useMemo, useState } from 'react';
import { Check, Package, Plus, Save, Tag, Trash2, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBadges, useSaveBadges } from '@/hooks/queries/useBadgesQuery';
import {
  DEFAULT_BADGE_COLORS,
  type CustomerBadgeOperator,
  type CustomerBadgeRule,
  type CustomerBadgeRuleType,
  type OrderBadge,
  type ProductBadge,
} from '@/types/badge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';

// ============ ChipBadge — render 1 chip (clickable + X) ============
const ChipBadge: React.FC<{
  name: string;
  color: string;
  icon?: string;
  active?: boolean;
  onClick: () => void;
  onDelete: () => void;
}> = ({ name, color, icon, active, onClick, onDelete }) => (
  <span
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
    className={`group inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
      active ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''
    }`}
    style={{
      backgroundColor: color + '22',
      color: color,
      border: `1.5px solid ${color}55`,
      ...(active ? { boxShadow: `0 0 0 2px ${color}` } : {}),
    }}
  >
    {icon ? <span>{icon}</span> : null}
    <span>{name || '(chưa đặt tên)'}</span>
    <Button
      type="button"
      onClick={(e) => { e.stopPropagation(); onDelete(); }}
      aria-label="Xoá"
      className="ml-1 flex h-4 w-4 items-center justify-center rounded-full opacity-50 hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/15"
     variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
      <X className="h-3 w-3" strokeWidth={3} />
    </Button>
  </span>
);

// ============ Color swatches picker ============
const ColorPicker: React.FC<{ value: string; onChange: (c: string) => void }> = ({ value, onChange }) => (
  <Box layoutClassName="flex flex-wrap gap-1.5">
    {DEFAULT_BADGE_COLORS.map((c) => (
      <Button
        key={c}
        type="button"
        onClick={() => onChange(c)}
        className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-white transition-all dark:ring-offset-slate-800 ${value === c ? 'ring-2 ring-slate-800 dark:ring-white' : 'hover:scale-110'}`}
        style={{ backgroundColor: c }}
        aria-label={c}
       variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent" />
    ))}
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 w-7 cursor-pointer rounded-full border-0 p-0"
      aria-label="Custom color"
    />
  </Box>
);

const RULE_TYPE_LABELS: Record<CustomerBadgeRuleType, string> = {
  orderCount: 'Số đơn',
  totalSpent: 'Tổng tiền (đ)',
  avgOrderValue: 'Đơn TB (đ)',
};

const OPERATOR_LABELS: Record<CustomerBadgeOperator, string> = {
  '>=': '≥',
  '>': '>',
  '<': '<',
  '<=': '≤',
};

// ============ Inline Editor Card ============
interface EditorProps<T extends { name: string; color: string; icon?: string }> {
  draft: T;
  onChange: (patch: Partial<T>) => void;
  onClose: () => void;
  /** Optional: render extra fields below (for customer rule) */
  extra?: React.ReactNode;
  accent?: string;
}
function BadgeEditor<T extends { name: string; color: string; icon?: string }>({
  draft,
  onChange,
  onClose,
  extra,
  accent = '#4abab9',
}: EditorProps<T>) {
  return (
    <Box
      layoutClassName="mt-3 space-y-3 rounded-xl border-2 p-3"
      style={{ borderColor: accent + '55', backgroundColor: accent + '08' }}
    >
      <Box layoutClassName="flex flex-wrap items-center gap-2">
        <Input
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value } as Partial<T>)}
          placeholder="Tên badge..."
          containerClassName="min-w-[180px] flex-1"
          autoFocus
        />
        <Input
          value={draft.icon ?? ''}
          onChange={(e) => onChange({ icon: e.target.value } as Partial<T>)}
          placeholder="Icon"
          containerClassName="w-24"
        />
      </Box>
      <ColorPicker value={draft.color} onChange={(c) => onChange({ color: c } as Partial<T>)} />
      {extra}
      <Box layoutClassName="flex justify-end">
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
          Xong
        </Button>
      </Box>
    </Box>
  );
}

// ============ BadgesTab main ============
const BadgesTab: React.FC = () => {
  const { currentUser } = useAuth();
  const { badges, loading, error } = useBadges();
  const { saveBadges, saving } = useSaveBadges();

  const [orderBadges, setOrderBadges] = useState<OrderBadge[]>([]);
  const [productBadges, setProductBadges] = useState<ProductBadge[]>([]);
  const [customerRules, setCustomerRules] = useState<CustomerBadgeRule[]>([]);
  const [dirty, setDirty] = useState(false);

  // Which one is being edited inline. Format: 'order:<id>' | 'product:<id>' | 'customer:<id>'
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // Seed local editable state từ query (chỉ khi chưa chỉnh sửa dở — tránh đè data đang nhập).
  useEffect(() => {
    if (dirty) return;
    setOrderBadges(badges.orderBadges);
    setProductBadges(badges.productBadges);
    setCustomerRules(badges.customerRules);
  }, [badges, dirty]);

  useEffect(() => {
    if (error) toast.error('Không tải được cấu hình Badge');
  }, [error]);

  const handleSave = async () => {
    try {
      await saveBadges({
        orderBadges,
        productBadges,
        customerRules,
        updatedBy: currentUser?.uid ?? null,
      });
      toast.success('Đã lưu cấu hình badge');
      setDirty(false);
      setEditingKey(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Không lưu được');
    }
  };

  // ===== Order =====
  const addOrderBadge = () => {
    const id = crypto.randomUUID();
    setOrderBadges((prev) => [...prev, {
      id, name: 'Badge mới',
      color: DEFAULT_BADGE_COLORS[prev.length % DEFAULT_BADGE_COLORS.length],
      icon: '', sortOrder: prev.length,
    }]);
    setEditingKey(`order:${id}`);
    setDirty(true);
  };
  const updateOrderBadge = (id: string, patch: Partial<OrderBadge>) => {
    setOrderBadges((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    setDirty(true);
  };
  const removeOrderBadge = (id: string) => {
    setOrderBadges((prev) => prev.filter((b) => b.id !== id));
    if (editingKey === `order:${id}`) setEditingKey(null);
    setDirty(true);
  };

  // ===== Product =====
  const addProductBadge = () => {
    const id = crypto.randomUUID();
    setProductBadges((prev) => [...prev, {
      id, name: 'Badge mới',
      color: DEFAULT_BADGE_COLORS[(prev.length + 1) % DEFAULT_BADGE_COLORS.length],
      icon: '', sortOrder: prev.length,
    }]);
    setEditingKey(`product:${id}`);
    setDirty(true);
  };
  const updateProductBadge = (id: string, patch: Partial<ProductBadge>) => {
    setProductBadges((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    setDirty(true);
  };
  const removeProductBadge = (id: string) => {
    setProductBadges((prev) => prev.filter((b) => b.id !== id));
    if (editingKey === `product:${id}`) setEditingKey(null);
    setDirty(true);
  };

  // ===== Customer =====
  const addCustomerRule = () => {
    const id = crypto.randomUUID();
    setCustomerRules((prev) => [...prev, {
      id, name: 'Rule mới',
      color: DEFAULT_BADGE_COLORS[(prev.length + 2) % DEFAULT_BADGE_COLORS.length],
      icon: '', ruleType: 'orderCount', operator: '>=', threshold: 5,
      sortOrder: prev.length,
    }]);
    setEditingKey(`customer:${id}`);
    setDirty(true);
  };
  const updateCustomerRule = (id: string, patch: Partial<CustomerBadgeRule>) => {
    setCustomerRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setDirty(true);
  };
  const removeCustomerRule = (id: string) => {
    setCustomerRules((prev) => prev.filter((r) => r.id !== id));
    if (editingKey === `customer:${id}`) setEditingKey(null);
    setDirty(true);
  };

  const editingOrder = useMemo(
    () => editingKey?.startsWith('order:') ? orderBadges.find((b) => b.id === editingKey.slice(6)) : undefined,
    [editingKey, orderBadges]
  );
  const editingProduct = useMemo(
    () => editingKey?.startsWith('product:') ? productBadges.find((b) => b.id === editingKey.slice(8)) : undefined,
    [editingKey, productBadges]
  );
  const editingCustomer = useMemo(
    () => editingKey?.startsWith('customer:') ? customerRules.find((r) => r.id === editingKey.slice(9)) : undefined,
    [editingKey, customerRules]
  );

  if (loading) {
    return (
      <Box layoutClassName="flex items-center justify-center p-12">
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <Box layoutClassName="space-y-6">
      {/* Header */}
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
        <Box>
          <Heading level={2} textClassName="flex items-center gap-2 text-xl font-semibold">
            <Tag className="h-6 w-6 text-primary-500" />
            Quản lý Badges
          </Heading>
          <Typography size="sm" variant="muted" layoutClassName="mt-1">
            Click vào chip để chỉnh, X để xoá. Đừng quên bấm Lưu.
          </Typography>
        </Box>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          leftIcon={saving ? <Spinner size="sm" textClassName="text-white" borderClassName="border-white" /> : <Save />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          sizeClassName="px-4 py-2"
          backgroundClassName="bg-gradient-to-r from-primary-600 to-primary-600"
          textClassName="text-sm font-semibold text-white"
          roundedClassName="rounded-xl"
          layoutClassName="inline-flex items-center gap-2 disabled:opacity-50"
          disableVariantHover
          disableVariantTextColor
        >
          {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
        </Button>
      </Box>

      {/* Section 1: Order Badges */}
      <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
        <Box layoutClassName="flex flex-wrap items-center justify-between gap-2">
          <Box>
            <Typography size="sm" layoutClassName="flex items-center gap-2 font-bold uppercase tracking-wider">
              <Tag className="h-4 w-4 text-primary-500" />
              Badges cho đơn
            </Typography>
            <Typography size="xs" variant="muted">
              VIP / Quà tặng / Khẩn cấp / Test...
            </Typography>
          </Box>
          <Button
            type="button"
            onClick={addOrderBadge}
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
            Thêm
          </Button>
        </Box>

        {orderBadges.length === 0 ? (
          <Typography size="xs" variant="muted">Chưa có badge nào.</Typography>
        ) : (
          <Box layoutClassName="flex flex-wrap gap-2">
            {orderBadges.map((b) => (
              <ChipBadge
                key={b.id}
                name={b.name}
                color={b.color}
                icon={b.icon}
                active={editingKey === `order:${b.id}`}
                onClick={() => setEditingKey(`order:${b.id}`)}
                onDelete={() => removeOrderBadge(b.id)}
              />
            ))}
          </Box>
        )}

        {editingOrder ? (
          <BadgeEditor
            draft={editingOrder}
            onChange={(p) => updateOrderBadge(editingOrder.id, p)}
            onClose={() => setEditingKey(null)}
            accent={editingOrder.color}
          />
        ) : null}
      </Card>

      {/* Section 2: Product Badges */}
      <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
        <Box layoutClassName="flex flex-wrap items-center justify-between gap-2">
          <Box>
            <Typography size="sm" layoutClassName="flex items-center gap-2 font-bold uppercase tracking-wider">
              <Package className="h-4 w-4 text-sky-500" />
              Badges cho sản phẩm
            </Typography>
            <Typography size="xs" variant="muted">
              Bán chạy / Mới / Sale / Signature / Hot...
            </Typography>
          </Box>
          <Button
            type="button"
            onClick={addProductBadge}
            leftIcon={<Plus />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
            sizeClassName="px-3 py-1.5 text-xs"
            backgroundClassName="bg-sky-50 dark:bg-sky-900/20"
            textClassName="font-semibold text-sky-700 dark:text-sky-300"
            borderClassName="border border-sky-200 dark:border-sky-800"
            roundedClassName="rounded-lg"
            layoutClassName="inline-flex items-center gap-1.5"
            disableVariantHover
            disableVariantTextColor
          >
            Thêm
          </Button>
        </Box>

        {productBadges.length === 0 ? (
          <Typography size="xs" variant="muted">Chưa có badge nào.</Typography>
        ) : (
          <Box layoutClassName="flex flex-wrap gap-2">
            {productBadges.map((b) => (
              <ChipBadge
                key={b.id}
                name={b.name}
                color={b.color}
                icon={b.icon}
                active={editingKey === `product:${b.id}`}
                onClick={() => setEditingKey(`product:${b.id}`)}
                onDelete={() => removeProductBadge(b.id)}
              />
            ))}
          </Box>
        )}

        {editingProduct ? (
          <BadgeEditor
            draft={editingProduct}
            onChange={(p) => updateProductBadge(editingProduct.id, p)}
            onClose={() => setEditingKey(null)}
            accent={editingProduct.color}
          />
        ) : null}
      </Card>

      {/* Section 3: Customer rules */}
      <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
        <Box layoutClassName="flex flex-wrap items-center justify-between gap-2">
          <Box>
            <Typography size="sm" layoutClassName="flex items-center gap-2 font-bold uppercase tracking-wider">
              <Users className="h-4 w-4 text-emerald-500" />
              Auto-badge cho khách
            </Typography>
            <Typography size="xs" variant="muted">
              Tự gán theo tiêu chí (VD: VIP ≥ 10 đơn, Top spender ≥ 5tr)
            </Typography>
          </Box>
          <Button
            type="button"
            onClick={addCustomerRule}
            leftIcon={<Plus />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
            sizeClassName="px-3 py-1.5 text-xs"
            backgroundClassName="bg-emerald-50 dark:bg-emerald-900/20"
            textClassName="font-semibold text-emerald-700 dark:text-emerald-300"
            borderClassName="border border-emerald-200 dark:border-emerald-800"
            roundedClassName="rounded-lg"
            layoutClassName="inline-flex items-center gap-1.5"
            disableVariantHover
            disableVariantTextColor
          >
            Thêm
          </Button>
        </Box>

        {customerRules.length === 0 ? (
          <Typography size="xs" variant="muted">Chưa có rule nào.</Typography>
        ) : (
          <Box layoutClassName="flex flex-wrap gap-2">
            {customerRules.map((r) => (
              <ChipBadge
                key={r.id}
                name={`${r.name} (${RULE_TYPE_LABELS[r.ruleType]} ${OPERATOR_LABELS[r.operator]} ${r.threshold})`}
                color={r.color}
                icon={r.icon}
                active={editingKey === `customer:${r.id}`}
                onClick={() => setEditingKey(`customer:${r.id}`)}
                onDelete={() => removeCustomerRule(r.id)}
              />
            ))}
          </Box>
        )}

        {editingCustomer ? (
          <BadgeEditor
            draft={editingCustomer}
            onChange={(p) => updateCustomerRule(editingCustomer.id, p)}
            onClose={() => setEditingKey(null)}
            accent={editingCustomer.color}
            extra={
              <Box layoutClassName="flex flex-wrap items-center gap-2">
                <Typography size="xs" variant="muted" layoutClassName="font-bold uppercase">Khi</Typography>
                <Select
                  size="sm"
                  value={editingCustomer.ruleType}
                  onChange={(e) => updateCustomerRule(editingCustomer.id, { ruleType: e.target.value as CustomerBadgeRuleType })}
                  sizeClassName="py-1.5 text-xs"
                  textClassName="font-medium"
                  stateClassName="dark:[color-scheme:dark]"
                >
                  {(Object.entries(RULE_TYPE_LABELS) as Array<[CustomerBadgeRuleType, string]>).map(([k, lbl]) => (
                    <option key={k} value={k}>{lbl}</option>
                  ))}
                </Select>
                <Select
                  size="sm"
                  value={editingCustomer.operator}
                  onChange={(e) => updateCustomerRule(editingCustomer.id, { operator: e.target.value as CustomerBadgeOperator })}
                  sizeClassName="py-1.5 text-xs"
                  textClassName="font-bold"
                  stateClassName="dark:[color-scheme:dark]"
                >
                  {(Object.entries(OPERATOR_LABELS) as Array<[CustomerBadgeOperator, string]>).map(([k, lbl]) => (
                    <option key={k} value={k}>{lbl}</option>
                  ))}
                </Select>
                <Input
                  type="number"
                  value={String(editingCustomer.threshold)}
                  onChange={(e) => updateCustomerRule(editingCustomer.id, { threshold: Number(e.target.value) })}
                  containerClassName="w-32"
                />
              </Box>
            }
          />
        ) : null}
      </Card>
    </Box>
  );
};

export default BadgesTab;
