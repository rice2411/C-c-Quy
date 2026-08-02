/**
 * Product Detail page — route /storage/product/:id
 * 5 tabs: Info / Pricing & Cost / Materials / Sales / History
 */
import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Boxes,
  Copy,
  DollarSign,
  History,
  Loader2,
  Package,
  Percent,
  Tag,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order, Product } from '@/types';
import { useOrders } from '@/hooks/useOrders';
import {
  useProducts,
  useProductMutations,
  useProductVersions,
} from '@/hooks/queries/useProductsQuery';
import { useBadges } from '@/hooks/queries/useBadgesQuery';
import type { ProductBadge } from '@/types/badge';
import { formatVND } from '@/utils/format/currencyUtil';
import { calcMargin } from '@/utils/product/productMargin';
import { computeProductMetrics, type ProductSalesMetric } from '@/pages/Storage/product/productStats';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import ProductImageCarousel from '@/components/shared/ProductImageCarousel';
import InfoTab from '@/pages/Storage/product/detail/InfoTab';
import PricingTab from '@/pages/Storage/product/detail/PricingTab';
import MaterialsTab from '@/pages/Storage/product/detail/MaterialsTab';
import SalesTab from '@/pages/Storage/product/detail/SalesTab';
import HistoryTab from '@/pages/Storage/product/detail/HistoryTab';

type Tab = 'info' | 'pricing' | 'materials' | 'sales' | 'history';

const TAB_META: Record<Tab, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  info:      { label: 'Thông tin',     icon: Package },
  pricing:   { label: 'Giá & Cost',    icon: DollarSign },
  materials: { label: 'Nguyên liệu',   icon: Boxes },
  sales:     { label: 'Bán hàng',      icon: BarChart3 },
  history:   { label: 'Lịch sử',       icon: History },
};

const formatDateShort = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const MiniMetric: React.FC<{
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  sub?: string;
  accent: string;
}> = ({ icon: Icon, label, value, sub, accent }) => (
  <Box
    layoutClassName="rounded-lg border p-2"
    style={{ borderColor: accent + '33', backgroundColor: accent + '0C' }}
  >
    <Box layoutClassName="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
      <Typography size="xs" variant="muted" layoutClassName="font-bold uppercase tracking-wide">{label}</Typography>
    </Box>
    <Typography size="sm" layoutClassName="mt-1 font-bold tabular-nums" style={{ color: accent }}>{value}</Typography>
    {sub ? <Typography size="xs" variant="muted" layoutClassName="truncate">{sub}</Typography> : null}
  </Box>
);

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders } = useOrders();

  const [activeTab, setActiveTab] = useState<Tab>('info');

  const { products, loading } = useProducts();
  const { addProduct, deleteProduct, updateProduct } = useProductMutations();
  const { productBadges } = useBadges();
  const { versions, loading: versionsLoading } = useProductVersions(id, activeTab === 'history');

  const product = useMemo<Product | null>(
    () => products.find((p) => p.id === id) ?? null,
    [products, id],
  );

  // ===== Metrics =====
  const metrics30: ProductSalesMetric | undefined = useMemo(() => {
    if (!product) return undefined;
    return computeProductMetrics(orders, [product], 30)[product.id];
  }, [orders, product]);

  const metricsAll: ProductSalesMetric | undefined = useMemo(() => {
    if (!product) return undefined;
    return computeProductMetrics(orders, [product])[product.id];
  }, [orders, product]);

  const dailySales = useMemo(() => {
    if (!product) return [];
    const days: { date: string; units: number; revenue: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      days.push({ date: d.toISOString().slice(0, 10), units: 0, revenue: 0 });
    }
    const byDate = new Map(days.map((d) => [d.date, d]));
    for (const o of orders as Order[]) {
      const st = String(o.status ?? '').toUpperCase();
      if (st === 'CANCELLED' || st === 'RETURNED') continue;
      const od = (o.orderDate as any)?.toDate?.() ?? (o.orderDate ? new Date(o.orderDate as any) : null);
      if (!od) continue;
      const key = od.toISOString().slice(0, 10);
      const slot = byDate.get(key);
      if (!slot) continue;
      for (const it of o.items || []) {
        if (it.productId === product.id) {
          slot.units += it.quantity || 0;
          slot.revenue += (it.price || 0) * (it.quantity || 0);
        }
      }
    }
    return days;
  }, [orders, product]);

  const topBuyers = useMemo(() => {
    if (!product) return [];
    const map = new Map<string, { name: string; count: number; units: number; revenue: number }>();
    for (const o of orders as Order[]) {
      const st = String(o.status ?? '').toUpperCase();
      if (st === 'CANCELLED' || st === 'RETURNED') continue;
      for (const it of o.items || []) {
        if (it.productId !== product.id) continue;
        const name = o.customer?.name || '(không tên)';
        const key = (o.customer?.phone || name) as string;
        if (!map.has(key)) map.set(key, { name, count: 0, units: 0, revenue: 0 });
        const m = map.get(key)!;
        m.count += 1;
        m.units += it.quantity || 0;
        m.revenue += (it.price || 0) * (it.quantity || 0);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.units - a.units).slice(0, 5);
  }, [orders, product]);

  const badgeByName = useMemo(() => {
    const m = new Map<string, ProductBadge>();
    productBadges.forEach((b) => m.set(b.name, b));
    return m;
  }, [productBadges]);

  // ===== Actions =====
  const handleToggleStatus = async () => {
    if (!product) return;
    const next = product.status === 'active' ? 'inactive' : 'active';
    try {
      await updateProduct({ id: product.id, data: { ...product, status: next } });
      toast.success(`Đã đổi sang ${next === 'active' ? 'Hoạt động' : 'Tạm dừng'}`);
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi');
    }
  };

  const handleDuplicate = async () => {
    if (!product) return;
    try {
      const copy: any = { ...product, name: product.name + ' (copy)' };
      delete copy.id;
      delete copy.createdAt;
      await addProduct(copy);
      toast.success(`Đã nhân bản ${product.name}`);
      navigate('/storage');
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi');
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!window.confirm(`Xoá sản phẩm "${product.name}"? Thao tác không hoàn tác.`)) return;
    try {
      await deleteProduct(product.id);
      toast.success('Đã xoá');
      navigate('/storage');
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi');
    }
  };

  if (loading) {
    return (
      <Box layoutClassName="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
      </Box>
    );
  }

  if (!product) {
    return (
      <Box layoutClassName="mx-auto max-w-2xl space-y-6 px-4 py-12 text-center">
        <Package className="mx-auto h-16 w-16 text-slate-300" />
        <Heading level={2} textClassName="text-xl font-semibold">Không tìm thấy sản phẩm</Heading>
        <Typography size="sm" variant="muted">ID không tồn tại hoặc đã bị xoá.</Typography>
        <Link to="/storage" className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          <ArrowLeft className="h-4 w-4" /> Về Kho
        </Link>
      </Box>
    );
  }

  const margin = calcMargin(product);
  const marginAccent =
    margin === null ? '#64748b' :
    margin < 0 ? '#dc2626' :
    margin < 0.2 ? '#eab308' : '#16a34a';

  return (
    <Box layoutClassName="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      {/* Header */}
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-2">
        <Link to="/storage" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary-600 dark:text-slate-300">
          <ArrowLeft className="h-4 w-4" /> Quay lại Kho
        </Link>
        <Box layoutClassName="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handleToggleStatus}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase shadow-sm ${
              product.status === 'active'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            }`}
           variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
            {product.status === 'active' ? '● Hoạt động' : '○ Tạm dừng'}
          </Button>
          <Button
            type="button"
            onClick={handleDuplicate}
            leftIcon={<Copy />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
            sizeClassName="px-3 py-1.5 text-xs"
            backgroundClassName="bg-white dark:bg-slate-800"
            borderClassName="border border-slate-200 dark:border-slate-600"
            textClassName="font-semibold text-slate-700 dark:text-slate-200"
            roundedClassName="rounded-lg"
            layoutClassName="inline-flex items-center gap-1.5"
            disableVariantHover
            disableVariantTextColor
          >
            Nhân bản
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            leftIcon={<Trash2 />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
            sizeClassName="px-3 py-1.5 text-xs"
            backgroundClassName="bg-red-50 dark:bg-red-900/20"
            borderClassName="border border-red-200 dark:border-red-800"
            textClassName="font-semibold text-red-700 dark:text-red-300"
            roundedClassName="rounded-lg"
            layoutClassName="inline-flex items-center gap-1.5"
            disableVariantHover
            disableVariantTextColor
          >
            Xoá
          </Button>
        </Box>
      </Box>

      {/* Hero */}
      <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
        <Box layoutClassName="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Box layoutClassName="w-full sm:w-56 shrink-0">
            <ProductImageCarousel
              primary={product.image}
              gallery={product.gallery}
              alt={product.name}
              aspectClass="aspect-square"
              enableLightbox
              showThumbnails={(product.gallery?.length || 0) > 0}
            />
          </Box>
          <Box layoutClassName="min-w-0 flex-1 space-y-2">
            <Heading level={1} textClassName="text-2xl font-bold">{product.name}</Heading>
            {product.category ? (
              <Typography size="xs" variant="muted" layoutClassName="inline-flex items-center gap-1.5 font-medium">
                <Tag className="h-3 w-3" /> {product.category}
              </Typography>
            ) : null}
            {product.tags && product.tags.length > 0 ? (
              <Box layoutClassName="flex flex-wrap gap-1.5">
                {product.tags.map((tag, i) => {
                  const b = badgeByName.get(tag);
                  if (b) {
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase"
                        style={{ backgroundColor: b.color + '22', color: b.color, border: `1px solid ${b.color}55` }}
                      >
                        {b.icon ? <span>{b.icon}</span> : null} {tag}
                      </span>
                    );
                  }
                  return (
                    <span
                      key={i}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    >
                      {tag}
                    </span>
                  );
                })}
              </Box>
            ) : null}

            <Box layoutClassName="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MiniMetric icon={DollarSign} label="Giá bán" value={formatVND(product.price)} accent="#4abab9" />
              <MiniMetric
                icon={Percent}
                label="Margin"
                value={margin !== null ? `${Math.round(margin * 100)}%` : '—'}
                accent={marginAccent}
              />
              <MiniMetric
                icon={TrendingUp}
                label="30 ngày"
                value={metrics30 ? `${metrics30.unitsSold} sp` : '0 sp'}
                accent="#0ea5e9"
                sub={metrics30 ? formatVND(metrics30.revenue) : '—'}
              />
              <MiniMetric
                icon={Users}
                label="Tổng đơn"
                value={String(metricsAll?.orderCount ?? 0)}
                accent="#a855f7"
                sub={metricsAll?.lastOrderAt ? `Cuối: ${formatDateShort(metricsAll.lastOrderAt).slice(0, 10)}` : 'Chưa có'}
              />
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Tabs */}
      <Box layoutClassName="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700">
        {(Object.entries(TAB_META) as Array<[Tab, { label: string; icon: any }]>).map(([key, meta]) => {
          const Icon = meta.icon;
          const active = activeTab === key;
          return (
            <Button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`relative inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
             variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
              <Icon className="h-4 w-4" />
              {meta.label}
            </Button>
          );
        })}
      </Box>

      {/* Tab content */}
      {activeTab === 'info' ? <InfoTab product={product} /> : null}
      {activeTab === 'pricing' ? <PricingTab product={product} margin={margin} /> : null}
      {activeTab === 'materials' ? <MaterialsTab product={product} /> : null}
      {activeTab === 'sales' ? (
        <SalesTab dailySales={dailySales} metrics30={metrics30} topBuyers={topBuyers} />
      ) : null}
      {activeTab === 'history' ? <HistoryTab versions={versions} loading={versionsLoading} /> : null}
    </Box>
  );
};

export default ProductDetailPage;
