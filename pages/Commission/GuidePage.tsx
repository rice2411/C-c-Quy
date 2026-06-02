import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Coins,
  Wallet,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Percent,
  HelpCircle,
  Calculator,
  Lightbulb,
  TrendingUp,
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

/* ════════════════════════════════════════ HƯỚNG DẪN HOA HỒNG ════════════ */
const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({
  icon, title, children,
}) => (
  <Card padding="md" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
    <Box layoutClassName="mb-2 flex items-center gap-2">
      <Box layoutClassName="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
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

const tierBadge = (children: React.ReactNode) => (
  <Badge
    size="sm"
    borderClassName="border-emerald-100 dark:border-emerald-900/40"
    backgroundClassName="bg-white dark:bg-slate-800"
    textClassName="text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
  >
    {children}
  </Badge>
);

/* ───────────────────────── Ví dụ minh hoạ ──────────────────────────────── */
const WorkedExample: React.FC<{ groups: CommissionGroup[]; loading: boolean; canSeeCost: boolean }> = ({
  groups, loading, canSeeCost,
}) => {
  if (loading) {
    return <Box layoutClassName="flex justify-center py-6"><Spinner size="md" textClassName="text-orange-500" /></Box>;
  }
  const group = [...groups].sort((a, b) => getGroupTiers(b).length - getGroupTiers(a).length)[0];
  if (!group) {
    return (
      <Box layoutClassName="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
        <Typography as="p" size="xs" variant="muted">Chưa có nhóm hoa hồng để minh hoạ.</Typography>
      </Box>
    );
  }

  const tiers = getGroupTiers(group);
  const price = 100000;
  const cost = 60000;
  const profit = price - cost; // 40.000đ minh hoạ (chỉ admin thấy)
  const t0 = tiers[0];
  const t1 = tiers[1];

  const lowQty = t1 ? Math.max(1, t1.minQty - 1) : 10;
  const highQty = t1 ? t1.minQty : lowQty;
  const perUnitLow = profit * t0.profitShareRate;
  const perUnitHigh = t1 ? profit * t1.profitShareRate : perUnitLow;
  const effLow = perUnitLow / price;
  const effHigh = perUnitHigh / price;

  return (
    <Box layoutClassName="space-y-3 text-sm">
      <Box layoutClassName="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
        <Typography as="p" size="sm" layoutClassName="font-semibold" textClassName="text-slate-700 dark:text-slate-200">Giả sử "Bánh A":</Typography>
        <Box layoutClassName="mt-1 space-y-0.5 text-xs" textClassName="text-slate-600 dark:text-slate-300">
          <Typography as="p" size="xs" variant="secondary">• Giá bán <strong>{formatVND(price)}</strong></Typography>
          {canSeeCost && (
            <Typography as="p" size="xs" variant="secondary">• Giá cost {formatVND(cost)} → lợi nhuận <strong>{formatVND(profit)}/sp</strong></Typography>
          )}
          <Typography as="p" size="xs" variant="secondary">• Thuộc nhóm <Typography as="span" layoutClassName="font-semibold" textClassName="text-orange-600 dark:text-orange-400">{group.name}</Typography>, mức hoa hồng theo số lượng bán/tháng:</Typography>
        </Box>
        <Box layoutClassName="mt-2 flex flex-wrap gap-1.5">
          {tiers.map((t, i) => (
            <React.Fragment key={i}>
              {tierBadge(canSeeCost
                ? <>từ {t.minQty} sp → {pctText(t.profitShareRate)}</>
                : <>từ {t.minQty} sp → {formatVND(profit * t.profitShareRate)}/sp</>)}
            </React.Fragment>
          ))}
        </Box>
      </Box>

      {/* Tình huống */}
      <Box layoutClassName="grid gap-2 sm:grid-cols-2">
        <Card padding="sm" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
          <Typography as="p" size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-400">Bán {lowQty} sp / tháng</Typography>
          {canSeeCost ? (
            <>
              <Typography as="p" size="xs" layoutClassName="mt-1" variant="muted">Rate bậc đầu = <strong>{pctText(t0.profitShareRate)}</strong></Typography>
              <Typography as="p" layoutClassName="mt-1 font-mono text-[11px]" textClassName="text-slate-500 dark:text-slate-400">
                {formatVND(profit)} × {pctText(t0.profitShareRate)} = {formatVND(perUnitLow)}/sp
              </Typography>
            </>
          ) : (
            <Typography as="p" size="xs" layoutClassName="mt-1" variant="muted">
              Hoa hồng <strong>{formatVND(perUnitLow)}/sp</strong> (≈{pctText(effLow)} giá bán)
            </Typography>
          )}
          <Typography as="p" size="sm" layoutClassName="mt-1 font-bold" variant="success">
            Tổng: {formatVND(perUnitLow * lowQty)}
          </Typography>
        </Card>

        {t1 && (
          <Card padding="sm" backgroundClassName="bg-emerald-50/50 dark:bg-emerald-900/10" borderClassName="border-emerald-200 dark:border-emerald-900/40">
            <Typography as="p" size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-emerald-500">Bán {highQty} sp / tháng</Typography>
            {canSeeCost ? (
              <>
                <Typography as="p" size="xs" layoutClassName="mt-1" variant="muted">Đạt bậc ≥{t1.minQty} → rate <strong>{pctText(t1.profitShareRate)}</strong></Typography>
                <Typography as="p" layoutClassName="mt-1 font-mono text-[11px]" textClassName="text-slate-500 dark:text-slate-400">
                  {formatVND(profit)} × {pctText(t1.profitShareRate)} = {formatVND(perUnitHigh)}/sp
                </Typography>
              </>
            ) : (
              <Typography as="p" size="xs" layoutClassName="mt-1" variant="muted">
                Đạt bậc ≥{t1.minQty} → hoa hồng <strong>{formatVND(perUnitHigh)}/sp</strong> (≈{pctText(effHigh)} giá bán)
              </Typography>
            )}
            <Typography as="p" size="sm" layoutClassName="mt-1 font-bold" variant="success">
              Tổng: {formatVND(perUnitHigh * highQty)}
            </Typography>
          </Card>
        )}
      </Box>

      {t1 && (
        <Box layoutClassName="rounded-lg bg-orange-50 p-2.5 dark:bg-orange-900/15">
          <Typography as="p" size="xs" textClassName="text-orange-700 dark:text-orange-300">
            👉 Chỉ cần bán thêm để đạt mốc <strong>{t1.minQty} sp</strong>, <strong>toàn bộ</strong> số lượng
            trong nhóm tháng đó được nâng lên mức hoa hồng cao hơn — chứ không chỉ riêng sp vượt mốc.
          </Typography>
        </Box>
      )}
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

  const examples = useMemo(() => {
    return products
      .map(p => ({ product: p, group: groupOfProduct(p, groups), base: calcItemCommission(p.price, p.costPrice, groups) }))
      .filter(x => x.base > 0 && x.group)
      .sort((a, b) => b.base - a.base)
      .slice(0, 8);
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

  const total = rows.reduce((s, r) => s + r.line, 0);
  const totalQty = rows.reduce((s, r) => s + r.q, 0);

  if (loading) {
    return <Box layoutClassName="flex justify-center py-8"><Spinner size="md" textClassName="text-orange-500" /></Box>;
  }

  if (examples.length === 0) {
    return (
      <Box layoutClassName="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
        <Typography as="p" size="xs" variant="muted">Hiện chưa có sản phẩm nào được cấu hình hoa hồng để bạn thử tính.</Typography>
      </Box>
    );
  }

  return (
    <Box layoutClassName="space-y-3">
      <Typography as="p" size="xs" variant="muted">
        Nhập số lượng dự kiến bán trong tháng cho từng sản phẩm để xem hoa hồng của bạn. Bán càng nhiều,
        hoa hồng mỗi sản phẩm càng cao theo bậc.
      </Typography>

      <Card padding="none" backgroundClassName="bg-transparent" borderClassName="border-slate-100 dark:border-slate-700" layoutClassName="overflow-hidden">
        <Box layoutClassName="hidden bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide dark:bg-slate-900/40 sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:gap-3" textClassName="text-slate-400">
          <Typography as="span">Sản phẩm</Typography>
          <Typography as="span" layoutClassName="w-24 text-right">Giá bán</Typography>
          <Typography as="span" layoutClassName="w-20 text-center">SL/tháng</Typography>
          <Typography as="span" layoutClassName="w-28 text-right">Hoa hồng</Typography>
        </Box>

        <Box layoutClassName="divide-y divide-slate-50 dark:divide-slate-700/50">
          {rows.map(({ product, group, perUnit, q, line, rate, eff }) => (
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
                    <Typography as="span" textClassName="text-orange-600 dark:text-orange-400">{group.name}</Typography>
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

        <Box layoutClassName="flex items-center justify-between border-t border-slate-100 bg-orange-50/60 px-3 py-2.5 dark:border-slate-700 dark:bg-orange-900/10">
          <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-700 dark:text-slate-200">
            Tổng hoa hồng {totalQty > 0 ? `(${totalQty} sp)` : ''}
          </Typography>
          <Typography as="span" layoutClassName="text-base font-bold" variant="success">
            {formatVND(total)}
          </Typography>
        </Box>
      </Card>

      {/* Gợi ý lên bậc */}
      {groupHints.length > 0 && (
        <Box layoutClassName="space-y-1.5">
          {groupHints.map(h => (
            <Box key={h.group.id} layoutClassName="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900/40">
              <TrendingUp className="h-3.5 w-3.5 shrink-0 text-orange-500" />
              <Typography as="span" size="xs" textClassName="text-slate-600 dark:text-slate-300">
                Nhóm <Typography as="span" layoutClassName="font-bold" textClassName="text-orange-600 dark:text-orange-400">{h.group.name}</Typography>:
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

      <Typography as="p" layoutClassName="text-[11px]" textClassName="text-slate-400 dark:text-slate-500">
        * Số lượng được đếm <strong>riêng theo từng nhóm</strong>: tăng số lượng các sản phẩm cùng nhóm
        sẽ cùng nâng bậc hoa hồng của nhóm đó.
      </Typography>
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
        <Box layoutClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
          <BookOpen className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </Box>
        <Box>
          <Typography as="p" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-slate-900 dark:text-white">
            Hướng dẫn hoa hồng
          </Typography>
          <Typography as="p" size="xs" variant="muted">
            Cách hoa hồng được tính và theo dõi
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <Box layoutClassName="flex-1 space-y-3 overflow-y-auto">
        <Section icon={<Coins className="h-4 w-4" />} title="Hoa hồng là gì?">
          <Typography as="p" size="sm" variant="secondary">
            Mỗi đơn hàng bạn (CTV) tạo và bán thành công sẽ được hưởng một khoản{' '}
            <strong>hoa hồng</strong> dựa trên sản phẩm trong đơn. Hoa hồng được tính tự động
            theo cấu hình của cửa hàng — bạn không cần tự tính tay.
          </Typography>
        </Section>

        <Section icon={<Percent className="h-4 w-4" />} title="Hoa hồng được tính thế nào?">
          {canSeeCost ? (
            <>
              <Typography as="p" size="sm" variant="secondary">Với mỗi sản phẩm trong đơn, hệ thống tính theo công thức:</Typography>
              <Box layoutClassName="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-900/40">
                <Typography as="p" layoutClassName="font-mono" variant="success">
                  Hoa hồng = (Giá bán − Giá cost) × % Lợi nhuận × Số lượng
                </Typography>
                <Typography as="p" layoutClassName="mt-1.5" variant="muted">
                  Nếu sản phẩm chưa có giá cost, hệ thống dùng công thức dự phòng:
                </Typography>
                <Typography as="p" layoutClassName="mt-1 font-mono" textClassName="text-amber-700 dark:text-amber-400">
                  Hoa hồng = Giá bán × % Fallback × Số lượng
                </Typography>
              </Box>
              <Typography as="p" size="xs" variant="muted">
                Mỗi sản phẩm thuộc một <strong>nhóm hoa hồng</strong> (theo biên lợi nhuận). Mỗi nhóm có
                các <strong>bậc theo số lượng</strong>: <strong>bán càng nhiều thì % lợi nhuận càng cao</strong>.
              </Typography>
            </>
          ) : (
            <>
              <Typography as="p" size="sm" variant="secondary">
                Mỗi sản phẩm có một <strong>mức hoa hồng riêng</strong> do cửa hàng quy định. Bạn xem
                <strong> giá bán</strong> và <strong>hoa hồng tương ứng</strong> của từng sản phẩm ở phần bên dưới.
              </Typography>
              <Typography as="p" size="xs" variant="muted">
                Mỗi sản phẩm thuộc một <strong>nhóm hoa hồng</strong>. Mỗi nhóm có các{' '}
                <strong>bậc theo số lượng</strong>: <strong>bán càng nhiều thì hoa hồng mỗi sản phẩm càng cao</strong>.
              </Typography>
            </>
          )}
        </Section>

        <Section icon={<ShoppingCart className="h-4 w-4" />} title="Bán càng nhiều, hoa hồng càng cao">
          <Typography as="p" size="sm" variant="secondary">
            Số lượng được tính theo <strong>tổng số sản phẩm bạn bán trong tháng</strong>, đếm
            <strong> riêng cho từng nhóm</strong>. Khi đạt mốc số lượng cao hơn, <strong>toàn bộ</strong>{' '}
            số lượng trong nhóm đó được hưởng mức hoa hồng của mốc đã đạt — không chỉ riêng phần vượt mốc.
          </Typography>
        </Section>

        <Section icon={<Lightbulb className="h-4 w-4" />} title="Ví dụ minh hoạ">
          <WorkedExample groups={groups} loading={loading} canSeeCost={canSeeCost} />
        </Section>

        <Section icon={<Calculator className="h-4 w-4" />} title="CTV tự tính hoa hồng">
          <SelfCalculator groups={groups} products={products} loading={loading} canSeeCost={canSeeCost} />
        </Section>

        <Section icon={<ShoppingCart className="h-4 w-4" />} title="Đơn nào được tính hoa hồng?">
          <Typography as="p" size="sm" variant="secondary">
            Chỉ những đơn hàng <strong>không bị huỷ</strong> và <strong>không bị hoàn trả</strong>{' '}
            mới được tính hoa hồng. Đơn đã huỷ/hoàn sẽ hiển thị nhãn <Typography as="span" layoutClassName="font-bold" textClassName="text-red-500">Đã huỷ</Typography>{' '}
            và hoa hồng = 0.
          </Typography>
        </Section>

        <Section icon={<Wallet className="h-4 w-4" />} title="Xem hoa hồng của tôi">
          <Typography as="p" size="sm" variant="secondary">
            Vào mục <strong>Hoa hồng của tôi</strong> để xem tổng hoa hồng, số đã được trả và số
            còn chờ trả của riêng bạn, kèm chi tiết từng đơn.
          </Typography>
          <Box layoutClassName="ml-1 mt-1 space-y-1.5">
            <Box layoutClassName="flex items-center gap-2">
              <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-amber-50 dark:bg-amber-900/20" textClassName="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                <Clock className="h-3 w-3" /> Chưa trả
              </Badge>
              <Typography as="span" size="xs">Hoa hồng đã ghi nhận, đang chờ cửa hàng thanh toán.</Typography>
            </Box>
            <Box layoutClassName="flex items-center gap-2">
              <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-emerald-50 dark:bg-emerald-900/20" textClassName="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Đã trả
              </Badge>
              <Typography as="span" size="xs">Cửa hàng đã thanh toán khoản hoa hồng này cho bạn.</Typography>
            </Box>
          </Box>
        </Section>

        <Section icon={<HelpCircle className="h-4 w-4" />} title="Cần hỗ trợ?">
          <Typography as="p" size="sm" variant="secondary">
            Nếu thấy số liệu hoa hồng chưa đúng hoặc có thắc mắc về thanh toán, vui lòng liên hệ
            quản lý cửa hàng để được kiểm tra và hỗ trợ.
          </Typography>
        </Section>
      </Box>
    </Box>
  );
};

export default CommissionGuidePage;
