import React, { useEffect, useMemo, useState } from 'react';
import {
  Coins,
  Percent,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  RotateCcw,
  Users,
  Search,
  Plus,
  Trash2,
  Save,
  GripVertical,
  AlertCircle,
  DollarSign,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Product } from '@/types';
import { Order } from '@/types';
import { OrderStatus } from '@/types/enums';
import { CommissionGroup, calcItemCommission, findGroupForMargin } from '@/types/commissionGroup';
import { fetchProducts, updateProduct } from '@/services/productService';
import {
  fetchCommissionGroups,
  createCommissionGroup,
  updateCommissionGroup,
  deleteCommissionGroup,
} from '@/services/commissionGroupService';
import {
  CollaboratorCommissionSummary,
  buildFullCommissionSummary,
  markCommissionPaid,
  markCommissionPending,
} from '@/services/commissionService';
import { formatVND } from '@/utils/format/currencyUtil';
import Spinner from '@/components/ui/Spinner';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Input from '@/components/ui/Input';

type PageTab = 'groups' | 'products' | 'stats';

/* ─────────────────────────── helpers ─── */
const pct = (v: number) => `${+(v * 100).toFixed(1)}%`;

const CommissionBadge: React.FC<{ status: 'pending' | 'paid' | undefined; cancelled?: boolean }> = ({
  status, cancelled,
}) => {
  if (cancelled)
    return <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-500 dark:bg-red-900/20">Đã huỷ</span>;
  if (status === 'paid')
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Đã trả
      </span>
    );
  return (
    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
      <Clock className="h-3 w-3" /> Chưa trả
    </span>
  );
};

/* ════════════════════════════════════════ TAB: Nhóm hoa hồng ══════ */
interface GroupRowProps {
  group: CommissionGroup;
  products: Product[];
  onUpdate: (id: string, data: Partial<Omit<CommissionGroup, 'id'>>) => Promise<void>;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

const GroupRow: React.FC<GroupRowProps> = ({ group, products, onUpdate, onDelete, canDelete }) => {
  const [name, setName] = useState(group.name);
  const [minMargin, setMinMargin] = useState(String(+(group.minMargin * 100).toFixed(1)));
  const [maxMargin, setMaxMargin] = useState(String(+(group.maxMargin * 100).toFixed(1)));
  const [profitShare, setProfitShare] = useState(String(+(group.profitShareRate * 100).toFixed(1)));
  const [fallback, setFallback] = useState(String(+(group.fallbackRate * 100).toFixed(1)));
  const [saving, setSaving] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

  // Sync when group prop changes (e.g. after save from parent)
  useEffect(() => {
    setName(group.name);
    setMinMargin(String(+(group.minMargin * 100).toFixed(1)));
    setMaxMargin(String(+(group.maxMargin * 100).toFixed(1)));
    setProfitShare(String(+(group.profitShareRate * 100).toFixed(1)));
    setFallback(String(+(group.fallbackRate * 100).toFixed(1)));
  }, [group]);

  const isDirty =
    name !== group.name ||
    Number(minMargin) !== +(group.minMargin * 100).toFixed(1) ||
    Number(maxMargin) !== +(group.maxMargin * 100).toFixed(1) ||
    Number(profitShare) !== +(group.profitShareRate * 100).toFixed(1) ||
    Number(fallback) !== +(group.fallbackRate * 100).toFixed(1);

  // Products that fall in this group based on their costPrice margin
  const groupProducts = useMemo(() => {
    return products.filter(p => {
      if (p.costPrice === undefined || p.costPrice < 0) return false;
      const profit = p.price - p.costPrice;
      if (profit <= 0) return false;
      const margin = profit / p.price;
      const matched = findGroupForMargin(margin, [group]);
      // findGroupForMargin with a single group checks if margin fits
      // We need direct comparison
      return margin >= group.minMargin && (margin < group.maxMargin || group.maxMargin >= 1);
    });
  }, [products, group]);

  const handleSave = async () => {
    if (!isDirty) return;
    setSaving(true);
    try {
      const updated = {
        name,
        minMargin: Number(minMargin) / 100,
        maxMargin: Number(maxMargin) / 100,
        profitShareRate: Number(profitShare) / 100,
        fallbackRate: Number(fallback) / 100,
      };
      await onUpdate(group.id, updated);
      toast.success(`Đã lưu nhóm "${name}"`);
    } catch {
      toast.error('Không thể lưu nhóm');
    } finally {
      setSaving(false);
    }
  };

  const fieldCls =
    'w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white';

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800">
      {/* Main row */}
      <div className="flex items-center gap-3 p-3">
        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-slate-300 dark:text-slate-600" />

        {/* Name */}
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          className="min-w-0 w-36 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          placeholder="Tên nhóm"
        />

        {/* Ranges */}
        <div className="hidden flex-1 items-center gap-2 sm:flex flex-wrap">
          <div className="flex items-center gap-1">
            <input type="number" value={minMargin} onChange={e => setMinMargin(e.target.value)} className={fieldCls} min={0} max={99} step={1} />
            <span className="text-xs text-slate-400">–</span>
            <input type="number" value={maxMargin} onChange={e => setMaxMargin(e.target.value)} className={fieldCls} min={1} max={100} step={1} />
            <span className="shrink-0 text-xs text-slate-400">% margin</span>
          </div>
          <span className="text-slate-200 dark:text-slate-600">|</span>
          <div className="flex items-center gap-1">
            <input type="number" value={profitShare} onChange={e => setProfitShare(e.target.value)} className={fieldCls} min={0} max={100} step={0.5} />
            <span className="shrink-0 text-xs text-slate-400">% lợi nhuận</span>
          </div>
          <span className="text-slate-200 dark:text-slate-600">|</span>
          <div className="flex items-center gap-1">
            <input type="number" value={fallback} onChange={e => setFallback(e.target.value)} className={fieldCls} min={0} max={100} step={0.5} />
            <span className="shrink-0 text-xs text-slate-400">% fallback</span>
          </div>
        </div>

        {/* Mobile compact */}
        <div className="flex flex-1 flex-col gap-0.5 text-xs text-slate-500 dark:text-slate-400 sm:hidden">
          <span>{minMargin}–{maxMargin}% margin</span>
          <span>{profitShare}% LP · fb {fallback}%</span>
        </div>

        {/* Products badge + toggle */}
        <button
          type="button"
          onClick={() => setShowProducts(v => !v)}
          className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
            groupProducts.length > 0
              ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-500'
          }`}
          title="Xem sản phẩm thuộc nhóm"
        >
          <Package className="h-3.5 w-3.5" />
          <span>{groupProducts.length}</span>
          {showProducts ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>

        {/* Save */}
        <button
          type="button"
          disabled={!isDirty || saving}
          onClick={handleSave}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-orange-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving
            ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            : <Save className="h-3.5 w-3.5" />}
        </button>

        {/* Delete */}
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(group.id)}
            className="flex shrink-0 items-center rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Products list */}
      {showProducts && (
        <div className="border-t border-slate-100 dark:border-slate-700">
          {groupProducts.length === 0 ? (
            <p className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">
              Chưa có sản phẩm nào thuộc nhóm này (cần nhập giá cost ở tab Sản phẩm)
            </p>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {groupProducts.map(p => {
                const profit = p.price - (p.costPrice ?? 0);
                const margin = profit / p.price;
                const commission = calcItemCommission(p.price, p.costPrice, [group]);
                return (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-700">
                      {p.image
                        ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        : <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] text-slate-400 dark:bg-slate-700">?</div>}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-300">{p.name}</span>
                    <span className="shrink-0 text-xs text-slate-400">{formatVND(p.price)}</span>
                    <span className="shrink-0 text-xs text-slate-400">cost {formatVND(p.costPrice ?? 0)}</span>
                    <span className="shrink-0 text-xs text-slate-400">margin {pct(margin)}</span>
                    <span className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      HH ~{formatVND(commission)}/sp
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface GroupsTabProps {
  groups: CommissionGroup[];
  products: Product[];
  onGroupsChange: (groups: CommissionGroup[]) => void;
}

const GroupsTab: React.FC<GroupsTabProps> = ({ groups, products, onGroupsChange }) => {
  const [adding, setAdding] = useState(false);

  const handleUpdate = async (id: string, data: Partial<Omit<CommissionGroup, 'id'>>) => {
    await updateCommissionGroup(id, data);
    onGroupsChange(groups.map(g => g.id === id ? { ...g, ...data } : g));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xoá nhóm này?')) return;
    await deleteCommissionGroup(id);
    onGroupsChange(groups.filter(g => g.id !== id));
    toast.success('Đã xoá nhóm');
  };

  const handleAdd = async () => {
    setAdding(true);
    try {
      const maxOrder = Math.max(0, ...groups.map(g => g.order));
      const newGroup = await createCommissionGroup({
        name: 'Nhóm mới',
        minMargin: 0,
        maxMargin: 1,
        profitShareRate: 0.1,
        fallbackRate: 0.05,
        order: maxOrder + 1,
      });
      onGroupsChange([...groups, newGroup]);
      toast.success('Đã tạo nhóm mới');
    } catch {
      toast.error('Không thể tạo nhóm');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-900/30 dark:bg-blue-900/10">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
            <p><strong>% Margin</strong>: khoảng biên lợi nhuận để xếp nhóm. VD: margin 30% → nhóm 25–45%.</p>
            <p><strong>% Lợi nhuận</strong>: tỷ lệ chia sẻ trên lợi nhuận. Commission = (Giá – Cost) × %LP.</p>
            <p><strong>% Fallback</strong>: dùng khi sản phẩm không có giá cost. Commission = Giá × %Fallback.</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {groups.map(g => (
          <GroupRow
            key={g.id}
            group={g}
            products={products}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            canDelete={groups.length > 1}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={adding}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500 transition-colors hover:border-orange-400 hover:text-orange-600 disabled:opacity-50 dark:border-slate-600 dark:text-slate-400 dark:hover:border-orange-600 dark:hover:text-orange-400"
      >
        {adding
          ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
          : <Plus className="h-4 w-4" />}
        Thêm nhóm
      </button>
    </div>
  );
};

/* ════════════════════════════════════════ TAB: Sản phẩm ═══════════ */
interface ProductRowProps {
  product: Product;
  groups: CommissionGroup[];
  onSaved: (id: string, costPrice: number | undefined) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({ product, groups, onSaved }) => {
  const [costInput, setCostInput] = useState<string>(
    product.costPrice !== undefined ? String(product.costPrice) : '',
  );
  const [saving, setSaving] = useState(false);
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

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-700">
        {product.image
          ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          : <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs text-slate-400 dark:bg-slate-700">?</div>}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{product.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Giá bán: {formatVND(product.price)}</p>
      </div>

      {group && commissionPerUnit > 0 && (
        <div className="hidden shrink-0 text-right sm:block">
          <span className="block rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
            {group.name}
          </span>
          <span className="mt-0.5 block text-xs text-emerald-600 dark:text-emerald-400">
            ~{formatVND(commissionPerUnit)}/sp
          </span>
          {margin !== undefined && (
            <span className="block text-[10px] text-slate-400">margin {pct(margin)}</span>
          )}
        </div>
      )}

      <div className="relative shrink-0 w-28">
        <DollarSign className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="number"
          min={0}
          value={costInput}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="Giá cost"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-2 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
        />
      </div>

      <button
        type="button"
        disabled={!dirty || saving}
        onClick={handleSave}
        className="flex shrink-0 items-center gap-1 rounded-lg bg-orange-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving
          ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          : <Save className="h-3.5 w-3.5" />}
        Lưu
      </button>
    </div>
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

  return (
    <div className="space-y-4">
      <Card padding="none" layoutClassName="p-3" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
        <Input
          type="text"
          placeholder="Tìm sản phẩm..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftIcon={<Search />}
          leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
          backgroundClassName="bg-slate-50 dark:bg-slate-700"
          borderClassName="border-slate-200 dark:border-slate-600"
        />
      </Card>

      {groups.length === 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300">
          Chưa có nhóm hoa hồng. Vui lòng cài đặt nhóm trước ở tab <strong>Nhóm HH</strong>.
        </div>
      )}

      {withCost.length > 0 && (
        <div className="space-y-2">
          <Typography size="xs" variant="muted" layoutClassName="px-1 font-semibold uppercase tracking-wide">
            Đã có giá cost ({withCost.length})
          </Typography>
          {withCost.map(p => <ProductRow key={p.id} product={p} groups={groups} onSaved={handleSaved} />)}
        </div>
      )}

      {withoutCost.length > 0 && (
        <div className="space-y-2">
          <Typography size="xs" variant="muted" layoutClassName="px-1 font-semibold uppercase tracking-wide">
            Chưa có giá cost ({withoutCost.length})
          </Typography>
          {withoutCost.map(p => <ProductRow key={p.id} product={p} groups={groups} onSaved={handleSaved} />)}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="py-10 text-center text-sm text-slate-400">Không tìm thấy sản phẩm</div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════ TAB: Thống kê CTV ════════ */
interface CollabRowProps {
  summary: CollaboratorCommissionSummary;
  onRefresh: () => void;
}

const CollabRow: React.FC<CollabRowProps> = ({ summary, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const activeOrders = summary.orders.filter(
    o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RETURNED,
  );
  const pendingOrders = activeOrders.filter(o => o.commissionStatus !== 'paid');
  const allPendingSelected =
    pendingOrders.length > 0 && pendingOrders.every(o => selected.has(o.id));

  const toggleSelect = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleMarkPaid = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setBusy(true);
    try {
      await markCommissionPaid(ids);
      toast.success(`Đã trả HH cho ${ids.length} đơn`);
      onRefresh();
    } catch { toast.error('Không thể cập nhật'); }
    finally { setBusy(false); setSelected(new Set()); }
  };

  const handleUnmark = async (orderId: string) => {
    setBusy(true);
    try {
      await markCommissionPending([orderId]);
      toast.success('Đã đặt lại thành chưa trả');
      onRefresh();
    } catch { toast.error('Không thể cập nhật'); }
    finally { setBusy(false); }
  };

  const statusColor = (order: Order) => {
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.RETURNED)
      return 'text-red-400 line-through';
    if (order.commissionStatus === 'paid') return 'text-emerald-600 dark:text-emerald-400';
    return 'text-amber-600 dark:text-amber-400';
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
          {summary.collaboratorName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-white">{summary.collaboratorName}</span>
            {summary.pendingCommission > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                Chưa trả
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span>{summary.orders.length} đơn</span>
            <span>Doanh số: {formatVND(summary.totalSales)}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-bold text-slate-900 dark:text-white">{formatVND(summary.totalCommission)}</div>
          <div className="text-xs">
            {summary.pendingCommission > 0
              ? <span className="text-amber-600 dark:text-amber-400">Chưa trả: {formatVND(summary.pendingCommission)}</span>
              : <span className="text-emerald-600 dark:text-emerald-400">Đã trả hết</span>}
          </div>
        </div>
        <span className="shrink-0 text-slate-400">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700">
          {pendingOrders.length > 0 && (
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 dark:bg-slate-700/40">
              <input
                type="checkbox"
                checked={allPendingSelected}
                onChange={() =>
                  setSelected(
                    allPendingSelected ? new Set() : new Set(pendingOrders.map(o => o.id)),
                  )
                }
                className="h-4 w-4 rounded border-slate-300 accent-orange-500"
              />
              <span className="flex-1 text-xs text-slate-500 dark:text-slate-400">
                {selected.size > 0 ? `Đã chọn ${selected.size} đơn` : 'Chọn tất cả chưa trả'}
              </span>
              {selected.size > 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleMarkPaid}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busy
                    ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Đánh dấu đã trả
                </button>
              )}
            </div>
          )}
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {summary.orders.map(order => {
              const cancelled =
                order.status === OrderStatus.CANCELLED || order.status === OrderStatus.RETURNED;
              const isPaid = order.commissionStatus === 'paid';
              const isPending = !cancelled && !isPaid;
              return (
                <div key={order.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  {isPending
                    ? <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleSelect(order.id)} className="h-4 w-4 rounded border-slate-300 accent-orange-500" />
                    : <div className="h-4 w-4 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <span className={`font-medium ${statusColor(order)}`}>{order.orderNumber || order.id}</span>
                    <span className="ml-2 text-xs text-slate-400">
                      {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : ''}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`font-semibold ${statusColor(order)}`}>{formatVND(order.commissionAmount ?? 0)}</div>
                    <div className="text-xs text-slate-400">/ {formatVND(order.total)}</div>
                  </div>
                  <CommissionBadge status={order.commissionStatus} cancelled={cancelled} />
                  {isPaid && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleUnmark(order.id)}
                      title="Đặt lại thành chưa trả"
                      className="ml-1 shrink-0 rounded p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500 disabled:opacity-50 dark:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-400"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface StatsTabProps {
  groups: CommissionGroup[];
  products: Product[];
}

const StatsTab: React.FC<StatsTabProps> = ({ groups, products }) => {
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<CollaboratorCommissionSummary[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      setSummaries(await buildFullCommissionSummary(groups, products));
    } catch { toast.error('Không thể tải dữ liệu hoa hồng'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const totalPending = useMemo(() => summaries.reduce((s, x) => s + x.pendingCommission, 0), [summaries]);
  const totalPaid = useMemo(() => summaries.reduce((s, x) => s + x.paidCommission, 0), [summaries]);
  const pendingCtvCount = useMemo(() => summaries.filter(x => x.pendingCommission > 0).length, [summaries]);

  if (loading) return (
    <div className="flex flex-1 items-center justify-center py-16">
      <Spinner size="lg" textClassName="text-orange-500" />
    </div>
  );

  if (!summaries.length) return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400 dark:text-slate-500">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <TrendingUp className="h-8 w-8 opacity-30" />
      </div>
      <p className="text-sm">Chưa có đơn nào có hoa hồng CTV</p>
      <p className="text-xs text-slate-300 dark:text-slate-600">Cài đặt nhóm &amp; giá cost cho sản phẩm trước</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Chưa trả</p>
          <p className={`text-lg font-bold ${totalPending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
            {formatVND(totalPending)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Đã trả</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatVND(totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">CTV pending</p>
              <p className={`text-lg font-bold ${pendingCtvCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                {pendingCtvCount}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {summaries.map(s => <CollabRow key={s.collaboratorUid} summary={s} onRefresh={load} />)}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════ MAIN PAGE ════════════════ */
const CommissionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PageTab>('groups');
  const [groups, setGroups] = useState<CommissionGroup[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Single fetch on mount — prevents double-seeding
  useEffect(() => {
    Promise.all([fetchCommissionGroups(), fetchProducts()])
      .then(([g, p]) => { setGroups(g); setProducts(p); })
      .catch(() => toast.error('Không thể tải dữ liệu'))
      .finally(() => setLoading(false));
  }, []);

  const tabs: { key: PageTab; label: string; icon: React.ReactNode }[] = [
    { key: 'groups',   label: 'Nhóm HH',     icon: <Percent className="h-3.5 w-3.5" /> },
    { key: 'products', label: 'Sản phẩm',     icon: <DollarSign className="h-3.5 w-3.5" /> },
    { key: 'stats',    label: 'Thống kê CTV', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  ];

  return (
    <Box layoutClassName="flex h-full flex-col space-y-4 sm:space-y-5">
      {/* Header */}
      <Box layoutClassName="flex items-center gap-3">
        <Box layoutClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
          <Coins className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </Box>
        <Box>
          <Typography as="h1" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-slate-900 dark:text-white">
            Hoa hồng CTV
          </Typography>
          <Typography as="p" size="xs" variant="muted">
            Cài đặt nhóm · Giá cost sản phẩm · Thanh toán hoa hồng
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box layoutClassName="flex gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/60">
        {tabs.map(({ key, label, icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                active
                  ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span className={active ? 'text-orange-500' : ''}>{icon}</span>
              {label}
            </button>
          );
        })}
      </Box>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" textClassName="text-orange-500" />
          </div>
        ) : activeTab === 'groups' ? (
          <GroupsTab groups={groups} products={products} onGroupsChange={setGroups} />
        ) : activeTab === 'products' ? (
          <ProductsTab groups={groups} products={products} onProductsChange={setProducts} />
        ) : (
          <StatsTab groups={groups} products={products} />
        )}
      </div>
    </Box>
  );
};

export default CommissionPage;
