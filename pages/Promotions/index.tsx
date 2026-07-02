import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Tag, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Promotion,
  ApplyMode,
  DiscountType,
  PromotionScope,
  PromotionStatus,
  APPLY_MODES,
  DISCOUNT_TYPES,
  PROMOTION_SCOPES,
  discountTypeLabel,
} from '@/types/promotion';
import { usePromotions, usePromotionMutations } from '@/hooks/queries/usePromotionsQuery';
import { useProducts } from '@/hooks/queries/useProductsQuery';
import { useCategories } from '@/hooks/queries/useCategoriesQuery';
import { formatVND } from '@/utils/format/currencyUtil';
import ProductAutocomplete from './components/ProductAutocomplete';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Field from '@/components/ui/Field';
import Heading from '@/components/ui/Heading';
import Spinner from '@/components/ui/Spinner';
import Switch from '@/components/ui/Switch';
import Typography from '@/components/ui/Typography';

interface FormState {
  name: string;
  applyMode: ApplyMode;
  code: string;
  discountType: DiscountType;
  discountValue: string;
  maxDiscount: string;
  groupCategoryId: string;
  buyQuantity: string;
  getQuantity: string;
  scope: PromotionScope;
  productIds: string;
  categoryIds: string;
  minOrderValue: string;
  startAt: string;
  endAt: string;
  maxUses: string;
  status: PromotionStatus;
}

const emptyForm = (): FormState => ({
  name: '',
  applyMode: 'AUTO',
  code: '',
  discountType: 'PERCENT',
  discountValue: '',
  maxDiscount: '',
  groupCategoryId: '',
  buyQuantity: '3',
  getQuantity: '1',
  scope: 'ALL',
  productIds: '',
  categoryIds: '',
  minOrderValue: '',
  startAt: '',
  endAt: '',
  maxUses: '',
  status: 'active',
});

const num = (s: string): number | undefined => {
  const n = Number(s);
  return s.trim() === '' || Number.isNaN(n) ? undefined : n;
};
const idList = (s: string): string[] =>
  s.split(',').map((x) => x.trim()).filter(Boolean);

/**
 * Về yyyy-mm-dd cho ô ngày (Input type date). apiClient hồi sinh chuỗi ISO timestamptz
 * thành object Timestamp-like (có .toDate()), nên startAt/endAt có thể là string HOẶC object.
 */
const toDateInput = (v: unknown): string => {
  if (!v) return '';
  if (typeof v === 'string') return v.slice(0, 10);
  const d =
    typeof (v as any)?.toDate === 'function'
      ? (v as any).toDate()
      : typeof (v as any)?.toMillis === 'function'
        ? new Date((v as any).toMillis())
        : null;
  return d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '';
};

const PromotionsPage: React.FC = () => {
  const { userData } = useAuth();
  const { promotions, loading, error } = usePromotions();
  const { products } = useProducts();
  const { categories } = useCategories();
  const { addPromotion, updatePromotion, deletePromotion } = usePromotionMutations();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (error) toast.error('Không tải được danh sách khuyến mãi');
  }, [error]);

  const startAdd = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (p: Promotion) => {
    setForm({
      name: p.name,
      applyMode: p.applyMode,
      code: p.code ?? '',
      discountType: p.discountType,
      discountValue: p.discountValue != null ? String(p.discountValue) : '',
      maxDiscount: p.maxDiscount != null ? String(p.maxDiscount) : '',
      groupCategoryId:
        categories.find((c) => c.id === p.groupCategoryId || c.name === p.groupCategoryId)?.id ??
        p.groupCategoryId ??
        '',
      buyQuantity: p.buyQuantity != null ? String(p.buyQuantity) : '3',
      getQuantity: p.getQuantity != null ? String(p.getQuantity) : '1',
      scope: p.scope,
      productIds: (p.productIds ?? []).join(', '),
      categoryIds: (p.categoryIds ?? []).join(', '),
      minOrderValue: p.minOrderValue != null ? String(p.minOrderValue) : '',
      startAt: toDateInput(p.startAt),
      endAt: toDateInput(p.endAt),
      maxUses: p.maxUses != null ? String(p.maxUses) : '',
      status: p.status,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nhập tên chương trình');
      return;
    }
    if (form.applyMode === 'CODE' && !form.code.trim()) {
      toast.error('Khuyến mãi dạng mã cần nhập mã');
      return;
    }
    if (
      (form.discountType === 'PERCENT' || form.discountType === 'FIXED') &&
      !num(form.discountValue)
    ) {
      toast.error('Nhập giá trị giảm');
      return;
    }
    if (form.discountType === 'BUY_X_GET_Y' && !form.groupCategoryId) {
      toast.error('Chọn danh mục nhóm cho khuyến mãi mua N tặng M');
      return;
    }

    const isBxgy = form.discountType === 'BUY_X_GET_Y';
    const payload: Partial<Promotion> = {
      name: form.name.trim(),
      applyMode: form.applyMode,
      code: form.applyMode === 'CODE' ? form.code.trim().toUpperCase() : null,
      discountType: form.discountType,
      discountValue: num(form.discountValue),
      maxDiscount:
        form.discountType === 'PERCENT' ? (num(form.maxDiscount) ?? null) : null,
      groupCategoryId: isBxgy ? form.groupCategoryId : null,
      groupBadgeId: null, // chuyển hẳn sang gom nhóm theo danh mục
      buyQuantity: isBxgy ? (num(form.buyQuantity) ?? 3) : undefined,
      getQuantity: isBxgy ? (num(form.getQuantity) ?? 1) : undefined,
      scope: form.scope,
      productIds: form.scope === 'PRODUCTS' ? idList(form.productIds) : [],
      categoryIds: form.scope === 'CATEGORIES' ? idList(form.categoryIds) : [],
      minOrderValue: num(form.minOrderValue) ?? 0,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
      endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
      maxUses: num(form.maxUses) ?? null,
      status: form.status,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updatePromotion({ id: editingId, data: payload });
        toast.success('Đã cập nhật khuyến mãi');
      } else {
        await addPromotion({ ...payload, createdBy: userData?.uid });
        toast.success('Đã tạo khuyến mãi');
      }
      cancelForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không thể lưu khuyến mãi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Promotion) => {
    if (!window.confirm(`Xoá khuyến mãi "${p.name}"?`)) return;
    try {
      await deletePromotion(p.id);
      toast.success('Đã xoá khuyến mãi');
    } catch {
      toast.error('Không thể xoá');
    }
  };

  const valueLabel = (p: Promotion): string => {
    if (p.discountType === 'PERCENT')
      return `${p.discountValue ?? 0}%${p.maxDiscount ? ` (tối đa ${formatVND(p.maxDiscount)})` : ''}`;
    if (p.discountType === 'FIXED') return formatVND(p.discountValue ?? 0);
    if (p.discountType === 'FREE_SHIP') return 'Miễn ship';
    if (p.discountType === 'BUY_X_GET_Y') {
      const cat = categories.find((c) => c.id === p.groupCategoryId || c.name === p.groupCategoryId);
      const gn = cat?.name ?? p.groupCategoryId;
      return `Mua ${p.buyQuantity ?? 3} tặng ${p.getQuantity ?? 1}${gn ? ` · nhóm ${gn}` : ''}`;
    }
    return '—';
  };

  if (loading) {
    return (
      <Box layoutClassName="flex flex-1 items-center justify-center py-16">
        <Spinner size="lg" textClassName="text-primary-500" />
      </Box>
    );
  }

  return (
    <Box layoutClassName="space-y-4 p-4">
      <Box layoutClassName="flex items-center justify-between gap-3">
        <Box layoutClassName="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary-500" />
          <Heading level={4}>Khuyến mãi</Heading>
          <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-slate-500 dark:text-slate-300">
            {promotions.length}
          </Badge>
        </Box>
        {!showForm && (
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={startAdd}>
            Thêm khuyến mãi
          </Button>
        )}
      </Box>

      {showForm && (
        <Card padding="md">
          <Box layoutClassName="space-y-3">
            {/* Hàng 1: tên + hình thức */}
            <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Tên chương trình" required>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="VD: Sinh nhật CúcQuý -10%" fullWidth />
              </Field>
              <Field label="Hình thức">
                <Select value={form.applyMode} onChange={(e) => setForm((f) => ({ ...f, applyMode: e.target.value as ApplyMode }))} fullWidth>
                  {APPLY_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </Select>
              </Field>
            </Box>

            {form.applyMode === 'CODE' && (
              <Field label="Mã khuyến mãi" required>
                <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="CUCQUY10" fullWidth />
              </Field>
            )}

            {/* Hàng 2: loại giảm + giá trị */}
            <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Loại giảm">
                <Select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as DiscountType }))} fullWidth>
                  {DISCOUNT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </Select>
              </Field>
              {(form.discountType === 'PERCENT' || form.discountType === 'FIXED') && (
                <Field label={form.discountType === 'PERCENT' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VND)'} required>
                  <Input type="number" min={0} value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} placeholder="0" fullWidth />
                </Field>
              )}
            </Box>

            {form.discountType === 'PERCENT' && (
              <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Trần giảm tối đa (VND)" hint="Bỏ trống = không giới hạn">
                  <Input type="number" min={0} value={form.maxDiscount} onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))} placeholder="0" fullWidth />
                </Field>
              </Box>
            )}

            {/* Mua N tặng M theo nhóm (danh mục) — món rẻ nhất trong nhóm thành 0đ */}
            {form.discountType === 'BUY_X_GET_Y' && (
              <Box layoutClassName="space-y-3 rounded-lg p-3" backgroundClassName="bg-slate-50 dark:bg-slate-900/40">
                <Field
                  label="Nhóm sản phẩm (danh mục)"
                  required
                  hint="Mua đủ (N+M) món cùng danh mục → M món RẺ NHẤT miễn phí. Sản phẩm phải thuộc danh mục này (Cài đặt → Danh mục)."
                >
                  <Select value={form.groupCategoryId} onChange={(e) => setForm((f) => ({ ...f, groupCategoryId: e.target.value }))} fullWidth>
                    <option value="">— Chọn danh mục —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{`${c.icon ?? ''} ${c.name}`.trim()}</option>)}
                  </Select>
                </Field>
                <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Số phải mua (N)">
                    <Input type="number" min={1} value={form.buyQuantity} onChange={(e) => setForm((f) => ({ ...f, buyQuantity: e.target.value }))} placeholder="3" fullWidth />
                  </Field>
                  <Field label="Số được tặng (M)">
                    <Input type="number" min={1} value={form.getQuantity} onChange={(e) => setForm((f) => ({ ...f, getQuantity: e.target.value }))} placeholder="1" fullWidth />
                  </Field>
                </Box>
                {categories.length === 0 && (
                  <Typography as="p" size="xs" variant="muted">
                    Chưa có danh mục. Tạo ở Cài đặt → Danh mục rồi gán cho sản phẩm.
                  </Typography>
                )}
              </Box>
            )}

            {/* Hàng: phạm vi + (sản phẩm/danh mục) */}
            <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Phạm vi">
                <Select value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as PromotionScope }))} fullWidth>
                  {PROMOTION_SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </Field>
              {form.scope === 'PRODUCTS' && (
                <Field label="Sản phẩm áp dụng">
                  <ProductAutocomplete
                    products={products}
                    value={idList(form.productIds)}
                    onChange={(ids) => setForm((f) => ({ ...f, productIds: ids.join(', ') }))}
                    placeholder="Tìm sản phẩm áp dụng…"
                  />
                </Field>
              )}
              {form.scope === 'CATEGORIES' && (
                <Field label="ID danh mục áp dụng" hint="Phân tách bằng dấu phẩy">
                  <Input value={form.categoryIds} onChange={(e) => setForm((f) => ({ ...f, categoryIds: e.target.value }))} placeholder="cat1, cat2" fullWidth />
                </Field>
              )}
            </Box>

            {/* Hàng: đơn tối thiểu + giới hạn lượt */}
            <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Đơn tối thiểu (VND)" hint="Bỏ trống = không yêu cầu">
                <Input type="number" min={0} value={form.minOrderValue} onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))} placeholder="0" fullWidth />
              </Field>
              <Field label="Giới hạn lượt dùng" hint="Bỏ trống = không giới hạn">
                <Input type="number" min={1} value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))} placeholder="∞" fullWidth />
              </Field>
            </Box>

            {/* Hàng: thời gian */}
            <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Bắt đầu">
                <Input type="date" value={form.startAt} onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))} fullWidth />
              </Field>
              <Field label="Kết thúc">
                <Input type="date" value={form.endAt} onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))} fullWidth />
              </Field>
            </Box>

            <Box layoutClassName="flex items-center gap-2">
              <Switch checked={form.status === 'active'} onCheckedChange={(v) => setForm((f) => ({ ...f, status: v ? 'active' : 'inactive' }))} />
              <Typography as="span" size="sm" textClassName="text-slate-600 dark:text-slate-300">
                {form.status === 'active' ? 'Đang chạy' : 'Tắt'}
              </Typography>
            </Box>

            <Box layoutClassName="flex items-center gap-2 pt-1">
              <Button variant="primary" size="sm" disabled={saving} onClick={handleSave} leftIcon={saving ? <Spinner size="sm" /> : undefined}>
                {editingId ? 'Cập nhật' : 'Lưu khuyến mãi'}
              </Button>
              <Button variant="secondary" size="sm" onClick={cancelForm} leftIcon={<X className="h-4 w-4" />}>
                Huỷ
              </Button>
            </Box>
          </Box>
        </Card>
      )}

      {promotions.length === 0 ? (
        <Card padding="lg">
          <Box layoutClassName="flex flex-col items-center justify-center gap-2 py-10">
            <Ticket className="h-8 w-8 text-slate-300" />
            <Typography as="p" size="sm" variant="muted">Chưa có chương trình khuyến mãi nào.</Typography>
          </Box>
        </Card>
      ) : (
        <Box layoutClassName="space-y-2">
          {promotions.map((p) => (
            <Card key={p.id} padding="sm">
              <Box layoutClassName="flex items-center gap-3">
                <Box layoutClassName="min-w-0 flex-1">
                  <Box layoutClassName="flex flex-wrap items-center gap-2">
                    <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-900 dark:text-white">{p.name}</Typography>
                    {p.applyMode === 'CODE' && p.code ? (
                      <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-primary-100 dark:bg-primary-900/30" textClassName="font-mono text-primary-700 dark:text-primary-300">{p.code}</Badge>
                    ) : (
                      <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-sky-100 dark:bg-sky-900/30" textClassName="text-sky-700 dark:text-sky-300">tự áp</Badge>
                    )}
                    <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-slate-600 dark:text-slate-300">{discountTypeLabel(p.discountType)}</Badge>
                    <Badge size="sm" borderClassName="border-transparent" backgroundClassName={p.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'} textClassName={p.status === 'active' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500'}>
                      {p.status === 'active' ? 'đang chạy' : 'tắt'}
                    </Badge>
                  </Box>
                  <Typography as="p" size="xs" variant="muted" layoutClassName="mt-0.5">
                    Giảm: {valueLabel(p)}
                    {p.minOrderValue ? ` · đơn từ ${formatVND(p.minOrderValue)}` : ''}
                    {p.maxUses != null ? ` · ${p.usedCount}/${p.maxUses} lượt` : ` · ${p.usedCount} lượt`}
                  </Typography>
                </Box>
                <Button variant="ghost" size="sm" onClick={() => startEdit(p)} title="Sửa" textClassName="text-slate-400 hover:text-primary-500">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(p)} title="Xoá" textClassName="text-slate-400 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PromotionsPage;
