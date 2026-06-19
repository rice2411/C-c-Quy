import React, { useMemo, useState, useEffect } from 'react';
import {
  BookOpen, Coins, Percent, Calculator, TrendingUp, Search, Award, Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Product } from '@/types';
import {
  CommissionGroup,
  calcItemCommission,
  findGroupForMargin,
  rateForQuantity,
  itemCommissionAtRate,
  getGroupTiers,
} from '@/types/commissionGroup';
import { fetchProducts } from '@/services/productService';
import { fetchCommissionGroups } from '@/services/commissionGroupService';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Image from '@/components/ui/Image';
import Typography from '@/components/ui/Typography';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

/* ════════════════════════════════════════ HƯỚNG DẪN HOA HỒNG ════════════ */
const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({
  icon, title, children,
}) => (
  <Card padding="md" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
    <Box layoutClassName="mb-2 flex items-center gap-2">
      <Box layoutClassName="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
        {icon}
      </Box>
      <Typography as="p" size="sm" layoutClassName="font-bold" textClassName="text-slate-900 dark:text-white">{title}</Typography>
    </Box>
    <Box layoutClassName="space-y-2 text-sm leading-relaxed" textClassName="text-slate-600 dark:text-slate-300">
      {children}
    </Box>
  </Card>
);

const pctText = (rate: number) => `${+(rate * 100).toFixed(1)}%`;

/** Nhóm của 1 sản phẩm (theo margin; không có cost → nhóm đầu) */
const groupOfProduct = (p: Product, groups: CommissionGroup[]): CommissionGroup | undefined => {
  if (groups.length === 0) return undefined;
  if (p.costPrice !== undefined && p.costPrice >= 0) {
    const profit = p.price - p.costPrice;
    if (profit <= 0) return undefined;
    return findGroupForMargin(profit / p.price, groups);
  }
  return [...groups].sort((a, b) => a.order - b.order)[0];
};

/* ───────────────────── Bảng nhóm & bậc (đọc data hiện tại) ─────────────── */
const GroupTable: React.FC<{ groups: CommissionGroup[]; loading: boolean; canSeeCost: boolean }> = ({
  groups, loading, canSeeCost,
}) => {
  if (loading) {
    return <Box layoutClassName="flex justify-center py-6"><Spinner size="md" textClassName="text-primary-500" /></Box>;
  }
  if (groups.length === 0) {
    return <EmptyState icon={<Award className="h-6 w-6" />} title="Chưa có nhóm hoa hồng." />;
  }
  const sorted = [...groups].sort((a, b) => a.order - b.order);
  return (
    <Box layoutClassName="space-y-2">
      {sorted.map(g => {
        const tiers = getGroupTiers(g);
        return (
          <Box key={g.id} layoutClassName="rounded-lg border border-slate-100 p-2.5 dark:border-slate-700">
            <Box layoutClassName="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-primary-600 dark:text-primary-400">{g.name}</Typography>
              {canSeeCost && (
                <Typography as="span" size="xs" variant="muted">margin {pctText(g.minMargin)}–{pctText(g.maxMargin)}</Typography>
              )}
            </Box>
            <Box layoutClassName="mt-1.5 flex flex-wrap gap-1.5">
              {tiers.map((t, i) => {
                const next = tiers[i + 1];
                const range = next ? `${t.minQty}–${next.minQty - 1}` : `≥${t.minQty}`;
                return (
                  <Badge
                    key={i}
                    size="sm"
                    borderClassName="border-emerald-100 dark:border-emerald-900/40"
                    backgroundClassName="bg-emerald-50/60 dark:bg-emerald-900/15"
                    textClassName="text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
                  >
                    {range} sp → {pctText(t.profitShareRate)} LN
                  </Badge>
                );
              })}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

/* ───────────────────────── CTV tự tính (tương tác, sp thật) ────────────── */
const SelfCalculator: React.FC<{
  groups: CommissionGroup[];
  products: Product[];
  loading: boolean;
  canSeeCost: boolean;
}> = ({ groups, products, loading, canSeeCost }) => {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');

  const examples = useMemo(() => {
    return products
      .map(p => ({ product: p, group: groupOfProduct(p, groups), base: calcItemCommission(p.price, p.costPrice, groups) }))
      .filter(x => x.base > 0 && x.group)
      .sort((a, b) => b.base - a.base);
  }, [products, groups]);

  const qtyByGroup = useMemo(() => {
    const m: Record<string, number> = {};
    examples.forEach(({ product, group }) => {
      if (!group) return;
      m[group.id] = (m[group.id] ?? 0) + (qty[product.id] ?? 0);
    });
    return m;
  }, [examples, qty]);

  const setQuantity = (id: string, v: string) => {
    const n = Math.max(0, Math.floor(Number(v) || 0));
    setQty(prev => ({ ...prev, [id]: n }));
  };

  const rows = examples.map(({ product, group }) => {
    const g = group!;
    const groupQty = qtyByGroup[g.id] ?? 0;
    const rate = rateForQuantity(g, groupQty);
    const perUnit = itemCommissionAtRate(product.price, product.costPrice, g.fallbackRate, rate);
    const q = qty[product.id] ?? 0;
    const eff = product.price > 0 ? perUnit / product.price : 0;
    return { product, group: g, perUnit, q, line: perUnit * q, rate, eff };
  });

  const groupHints = useMemo(() => {
    const seen = new Map<string, CommissionGroup>();
    examples.forEach(({ group }) => { if (group) seen.set(group.id, group); });
    return Array.from(seen.values()).map(g => {
      const q = qtyByGroup[g.id] ?? 0;
      const tiers = getGroupTiers(g);
      const rate = rateForQuantity(g, q);
      const next = tiers.find(t => t.minQty > q);
      return { group: g, qty: q, rate, next };
    }).filter(h => h.qty > 0);
  }, [examples, qtyByGroup]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? rows.filter(r => r.product.name.toLowerCase().includes(q)) : rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search]);

  const total = rows.reduce((s, r) => s + r.line, 0);
  const totalQty = rows.reduce((s, r) => s + r.q, 0);

  if (loading) {
    return <Box layoutClassName="flex justify-center py-8"><Spinner size="md" textClassName="text-primary-500" /></Box>;
  }

  if (examples.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-6 w-6" />}
        title="Chưa có sản phẩm nào được cấu hình hoa hồng để thử tính."
      />
    );
  }

  return (
    <Box layoutClassName="space-y-3">
      <Typography as="p" size="xs" variant="muted">
        Nhập số lượng dự kiến bán/tháng cho từng sản phẩm — hệ thống tính hoa hồng theo bậc của nhóm.
      </Typography>

      <Input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={`Tìm trong ${examples.length} sản phẩm có hoa hồng...`}
        leftIcon={<Search className="h-4 w-4" />}
        sizeClassName="py-2 text-sm"
      />

      <Card padding="none" backgroundClassName="bg-transparent" borderClassName="border-slate-100 dark:border-slate-700" layoutClassName="overflow-hidden">
        <Box layoutClassName="hidden bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide dark:bg-slate-900/40 sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:gap-3" textClassName="text-slate-400">
          <Typography as="span">Sản phẩm</Typography>
          <Typography as="span" layoutClassName="w-24 text-right">Giá bán</Typography>
          <Typography as="span" layoutClassName="w-20 text-center">SL/tháng</Typography>
          <Typography as="span" layoutClassName="w-28 text-right">Hoa hồng</Typography>
        </Box>

        <Box layoutClassName="divide-y divide-slate-50 dark:divide-slate-700/50">
          {visibleRows.length === 0 && (
            <EmptyState icon={<Search className="h-6 w-6" />} title="Không tìm thấy sản phẩm phù hợp" />
          )}
          {visibleRows.map(({ product, group, perUnit, q, line, rate, eff }) => (
            <Box
              key={product.id}
              layoutClassName="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2.5 sm:grid-cols-[1fr_auto_auto_auto]"
            >
              <Box layoutClassName="flex min-w-0 items-center gap-2">
                <Box layoutClassName="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-700">
                  {product.image
                    ? <Image src={product.image} alt={product.name} layoutClassName="h-full w-full object-cover" />
                    : <Box layoutClassName="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] text-slate-400 dark:bg-slate-700">?</Box>}
                </Box>
                <Box layoutClassName="min-w-0">
                  <Typography as="p" size="sm" layoutClassName="truncate font-medium" textClassName="text-slate-800 dark:text-slate-200">{product.name}</Typography>
                  <Typography as="p" layoutClassName="text-[11px]" textClassName="text-slate-400">
                    <Typography as="span" textClassName="text-primary-600 dark:text-primary-400">{group.name}</Typography>
                    {' · '}{canSeeCost ? <>LN {pctText(rate)}</> : <>≈{pctText(eff)} giá bán</>}
                  </Typography>
                </Box>
              </Box>

              <Typography as="span" size="xs" layoutClassName="hidden w-24 text-right sm:block" textClassName="text-slate-500 dark:text-slate-400">
                {formatVND(product.price)}
              </Typography>

              <Box layoutClassName="w-20 sm:flex sm:justify-center">
                <Input
                  type="number"
                  min={0}
                  value={q === 0 ? '' : String(q)}
                  onChange={e => setQuantity(product.id, e.target.value)}
                  placeholder="0"
                  containerClassName="w-16"
                  sizeClassName="py-1 text-center text-sm"
                  backgroundClassName="bg-slate-50 dark:bg-slate-700/50"
                />
              </Box>

              <Box layoutClassName="col-span-2 text-right sm:col-span-1 sm:w-28">
                <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName={line > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'}>
                  {formatVND(line)}
                </Typography>
                <Typography as="span" layoutClassName="ml-1 hidden text-[10px] sm:inline" textClassName="text-slate-400">
                  ({formatVND(perUnit)}/sp)
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Box layoutClassName="flex items-center justify-between border-t border-slate-100 bg-primary-50/60 px-3 py-2.5 dark:border-slate-700 dark:bg-primary-900/10">
          <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-700 dark:text-slate-200">
            Tổng hoa hồng {totalQty > 0 ? `(${totalQty} sp)` : ''}
          </Typography>
          <Typography as="span" layoutClassName="text-base font-bold" variant="success">
            {formatVND(total)}
          </Typography>
        </Box>
      </Card>

      {groupHints.length > 0 && (
        <Box layoutClassName="space-y-1.5">
          {groupHints.map(h => (
            <Box key={h.group.id} layoutClassName="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900/40">
              <TrendingUp className="h-3.5 w-3.5 shrink-0 text-primary-500" />
              <Typography as="span" size="xs" textClassName="text-slate-600 dark:text-slate-300">
                Nhóm <Typography as="span" layoutClassName="font-bold" textClassName="text-primary-600 dark:text-primary-400">{h.group.name}</Typography>:
                {' '}đã {h.qty} sp
                {canSeeCost && <> · đang ở mức <strong>{pctText(h.rate)}</strong></>}
                {h.next
                  ? <> · bán thêm <strong>{h.next.minQty - h.qty} sp</strong> để {canSeeCost ? <>lên {pctText(h.next.profitShareRate)}</> : <>hoa hồng/sp tăng</>}</>
                  : <> · đã đạt mức cao nhất 🎉</>}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

const CommissionGuidePage: React.FC = () => {
  const { userData } = useAuth();
  const canSeeCost =
    userData?.role === UserRole.SUPER_ADMIN || userData?.role === UserRole.ADMIN;

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<CommissionGroup[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    Promise.all([fetchCommissionGroups(), fetchProducts()])
      .then(([g, p]) => { setGroups(g); setProducts(p); })
      .catch(() => toast.error('Không thể tải dữ liệu hướng dẫn'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box layoutClassName="flex h-full flex-col space-y-4 sm:space-y-5">
      {/* Header */}
      <Box layoutClassName="flex items-center gap-3">
        <Box layoutClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
          <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </Box>
        <Box>
          <Typography as="p" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-slate-900 dark:text-white">
            Hướng dẫn hoa hồng
          </Typography>
          <Typography as="p" size="xs" variant="muted">
            Cách hoa hồng được tính
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <Box layoutClassName="flex-1 space-y-3 overflow-y-auto">
        <Section icon={<Percent className="h-4 w-4" />} title="Cách tính">
          {canSeeCost ? (
            <Box layoutClassName="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-900/40">
              <Typography as="p" layoutClassName="font-mono" variant="success">
                HH = (Giá bán − Giá cost) × % Lợi nhuận × Số lượng
              </Typography>
              <Typography as="p" layoutClassName="mt-1.5 font-mono" textClassName="text-amber-700 dark:text-amber-400">
                Chưa có cost → HH = Giá bán × % Fallback × Số lượng
              </Typography>
            </Box>
          ) : (
            <Typography as="p" size="sm" variant="secondary">
              Mỗi sản phẩm có mức hoa hồng riêng do cửa hàng quy định. Bán càng nhiều, hoa hồng mỗi sản phẩm càng cao.
            </Typography>
          )}
          <Typography as="p" size="xs" variant="muted">
            % được xét theo <strong>tổng số lượng bán trong tháng</strong>, đếm <strong>riêng từng nhóm</strong>.
            Đạt mốc nào thì <strong>toàn bộ</strong> số lượng nhóm đó hưởng mức của mốc — không chỉ phần vượt.
            Đơn huỷ/hoàn không tính.
          </Typography>
        </Section>

        <Section icon={<Coins className="h-4 w-4" />} title="Nhóm & bậc số lượng hiện tại">
          <GroupTable groups={groups} loading={loading} canSeeCost={canSeeCost} />
        </Section>

        <Section icon={<Calculator className="h-4 w-4" />} title="Tự tính hoa hồng">
          <SelfCalculator groups={groups} products={products} loading={loading} canSeeCost={canSeeCost} />
        </Section>
      </Box>
    </Box>
  );
};

export default CommissionGuidePage;
