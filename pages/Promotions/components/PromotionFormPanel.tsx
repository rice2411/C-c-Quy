import React, { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Promotion,
  ApplyMode,
  DiscountType,
  PromotionScope,
  PromotionStatus,
  APPLY_MODES,
  DISCOUNT_TYPES,
  PROMOTION_SCOPES,
} from '@/types/promotion';
import type { Product } from '@/types';
import type { ProductCategory } from '@/types/category';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Field from '@/components/ui/Field';
import Switch from '@/components/ui/Switch';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';
import ProductAutocomplete from './ProductAutocomplete';
import { num, idList, toDateInput } from '../promotionUtils';

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

const fromPromotion = (p: Promotion, categories: ProductCategory[]): FormState => ({
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

interface PromotionFormPanelProps {
  isOpen: boolean;
  /** Promo đang sửa; null = tạo mới. */
  initial: Promotion | null;
  products: Product[];
  categories: ProductCategory[];
  saving: boolean;
  onClose: () => void;
  /** Cha quyết định add/update theo có initial hay không. */
  onSubmit: (payload: Partial<Promotion>) => void;
}

/** Section con — tiêu đề nhỏ + nội dung, gom nhóm field cho form dễ đọc. */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box layoutClassName="space-y-3">
    <Typography as="p" size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-400 dark:text-slate-500">
      {title}
    </Typography>
    {children}
  </Box>
);

const PromotionFormPanel: React.FC<PromotionFormPanelProps> = ({
  isOpen,
  initial,
  products,
  categories,
  saving,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<FormState>(emptyForm());

  // Nạp lại form mỗi khi mở / đổi promo đang sửa.
  useEffect(() => {
    if (!isOpen) return;
    setForm(initial ? fromPromotion(initial, categories) : emptyForm());
  }, [isOpen, initial, categories]);

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('Nhập tên chương trình');
      return;
    }
    if (form.applyMode === 'CODE' && !form.code.trim()) {
      toast.error('Khuyến mãi dạng mã cần nhập mã');
      return;
    }
    if ((form.discountType === 'PERCENT' || form.discountType === 'FIXED') && !num(form.discountValue)) {
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
      maxDiscount: form.discountType === 'PERCENT' ? (num(form.maxDiscount) ?? null) : null,
      groupCategoryId: isBxgy ? form.groupCategoryId : null,
      groupBadgeId: null,
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
    onSubmit(payload);
  };

  const footer = (
    <Box layoutClassName="flex items-center justify-end gap-2">
      <Button variant="secondary" size="sm" onClick={onClose} leftIcon={<X className="h-4 w-4" />}>
        Huỷ
      </Button>
      <Button
        variant="primary"
        size="sm"
        disabled={saving}
        onClick={handleSubmit}
        leftIcon={saving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
      >
        {initial ? 'Cập nhật' : 'Lưu khuyến mãi'}
      </Button>
    </Box>
  );

  return (
    <BaseSlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi'}
      maxWidth="xl"
      footer={footer}
    >
      <Box layoutClassName="space-y-6">
        <Section title="Thông tin chung">
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
        </Section>

        <Section title="Ưu đãi">
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
            <Field label="Trần giảm tối đa (VND)" hint="Bỏ trống = không giới hạn">
              <Input type="number" min={0} value={form.maxDiscount} onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))} placeholder="0" fullWidth />
            </Field>
          )}

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
        </Section>

        <Section title="Phạm vi áp dụng">
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
          <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Đơn tối thiểu (VND)" hint="Bỏ trống = không yêu cầu">
              <Input type="number" min={0} value={form.minOrderValue} onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))} placeholder="0" fullWidth />
            </Field>
            <Field label="Giới hạn lượt dùng" hint="Bỏ trống = không giới hạn">
              <Input type="number" min={1} value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))} placeholder="∞" fullWidth />
            </Field>
          </Box>
        </Section>

        <Section title="Thời gian & trạng thái">
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
        </Section>
      </Box>
    </BaseSlidePanel>
  );
};

export default PromotionFormPanel;
