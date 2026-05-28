/**
 * Toàn bộ logic + UI quản lý sản phẩm — Tier 1 pro features:
 *  • Multi-view: Grid / List / Compact (toggle + localStorage)
 *  • Filter chips: status / category / badge / price range / has-material
 *  • Bulk select + bulk actions (status, badge, delete, export CSV)
 *  • Inline edit price + status toggle
 *  • Margin visualization
 *  • Sort options (name / price / margin / recent / popular)
 *  • Sales metrics integration
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ExternalLink,
  Sparkles,
  ArrowUpDown,
  Boxes,
  Check,
  Copy,
  DollarSign,
  Download,
  Edit3,
  Grid3x3,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Loader2,
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order, Product } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchBadgesConfiguration } from '@/services/badgeService';
import { updateProduct, deleteProduct } from '@/services/productService';
import type { ProductBadge } from '@/types/badge';
import { formatVND } from '@/utils/format/currencyUtil';
import { getTagPalette } from '@/utils/product/productTagPalette';
import { computeProductMetrics, type ProductSalesMetric } from '@/pages/Storage/product/productStats';
import CsvImportModal from '@/pages/Storage/product/CsvImportModal';
import FilterToolbar from '@/components/shared/FilterToolbar';
import { calcMargin, marginColor } from '@/utils/product/productMargin';
import { getStockStatus } from '@/utils/product/stockStatus';
import { exportProductsCSV } from '@/utils/product/csvExport';
import InlinePriceEditor from '@/pages/Storage/product/components/InlinePriceEditor';
import StatusChip from '@/pages/Storage/product/components/StatusChip';
import FilterPill from '@/components/shared/FilterPill';
import GridCard from '@/pages/Storage/product/components/GridCard';
import ListRow from '@/pages/Storage/product/components/ListRow';
import CompactCard from '@/pages/Storage/product/components/CompactCard';
import AiInsightsModal from '@/pages/Storage/product/components/AiInsightsModal';
import { generateProductInsights } from '@/services/geminiService';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import IconButton from '@/components/ui/IconButton';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell } from '@/components/ui/Table';

export type ProductViewMode = 'grid' | 'list' | 'compact';
export type ProductSortKey = 'recent' | 'name-asc' | 'name-desc' | 'price-desc' | 'price-asc' | 'margin-desc' | 'popular';

interface Props {
  products: Product[];
  orders: Order[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  onCreate: () => void;
  onEdit: (p: Product) => void;
  onAfterMutate: () => void;
}

// ===== Main component =====
const ProductSection: React.FC<Props> = ({
  products,
  orders,
  loading,
  searchTerm,
  onSearchChange,
  onCreate,
  onEdit,
  onAfterMutate,
}) => {
  const { t } = useLanguage();

  // ===== Settings =====
  const [viewMode, setViewMode] = useState<ProductViewMode>(() => {
    if (typeof window === 'undefined') return 'grid';
    return (localStorage.getItem('product-view-mode') as ProductViewMode) || 'grid';
  });
  useEffect(() => { localStorage.setItem('product-view-mode', viewMode); }, [viewMode]);

  const [sortBy, setSortBy] = useState<ProductSortKey>('recent');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterBadge, setFilterBadge] = useState<string>('all');
  const [filterPrice, setFilterPrice] = useState<'all' | 'low' | 'mid' | 'high'>('all');
  const [filterHasMaterial, setFilterHasMaterial] = useState<'all' | 'yes' | 'no'>('all');
  const [filterMargin, setFilterMargin] = useState<'all' | 'low' | 'losing'>('all');

  // ===== Bulk selection =====
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [aiOpen, setAiOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const runAI = async () => {
    setAiOpen(true);
    if (aiText || aiLoading) return;
    setAiLoading(true);
    try {
      const text = await generateProductInsights(products, orders, 'vi');
      setAiText(text);
    } catch (e: any) {
      setAiText('Lỗi: ' + (e?.message || 'không xác định'));
    } finally {
      setAiLoading(false);
    }
  };
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  // ===== Product badges from config =====
  const [productBadges, setProductBadges] = useState<ProductBadge[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await fetchBadgesConfiguration();
        if (!cancelled) setProductBadges(cfg.productBadges);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);
  const badgeByName = useMemo(() => {
    const m = new Map<string, ProductBadge>();
    productBadges.forEach((b) => m.set(b.name, b));
    return m;
  }, [productBadges]);

  // ===== Sales metrics =====
  const metrics = useMemo(() => computeProductMetrics(orders, products, 30), [orders, products]);

  // ===== Filter + Sort pipeline =====
  const categories = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => p.category && s.add(p.category));
    return Array.from(s).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let out = products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (filterBadge !== 'all' && !(p.tags || []).includes(filterBadge)) return false;
      if (filterHasMaterial === 'yes' && !(p.materials && p.materials.length > 0)) return false;
      if (filterHasMaterial === 'no' && (p.materials && p.materials.length > 0)) return false;
      if (filterPrice === 'low' && p.price >= 50000) return false;
      if (filterPrice === 'mid' && (p.price < 50000 || p.price > 100000)) return false;
      if (filterPrice === 'high' && p.price <= 100000) return false;
      if (filterMargin === 'losing') {
        const m = calcMargin(p);
        if (m === null || m >= 0) return false;
      }
      if (filterMargin === 'low') {
        const m = calcMargin(p);
        if (m === null || m >= 0.2) return false;
      }
      return true;
    });

    out = [...out].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return (a.name || '').localeCompare(b.name || '');
        case 'name-desc': return (b.name || '').localeCompare(a.name || '');
        case 'price-asc': return (a.price || 0) - (b.price || 0);
        case 'price-desc': return (b.price || 0) - (a.price || 0);
        case 'margin-desc': return (calcMargin(b) ?? -999) - (calcMargin(a) ?? -999);
        case 'popular': return (metrics[b.id]?.unitsSold ?? 0) - (metrics[a.id]?.unitsSold ?? 0);
        case 'recent':
        default:
          return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
    });
    return out;
  }, [products, searchTerm, filterStatus, filterCategory, filterBadge, filterPrice, filterHasMaterial, filterMargin, sortBy, metrics]);

  const activeFilterCount =
    (filterStatus !== 'all' ? 1 : 0) +
    (filterCategory !== 'all' ? 1 : 0) +
    (filterBadge !== 'all' ? 1 : 0) +
    (filterPrice !== 'all' ? 1 : 0) +
    (filterHasMaterial !== 'all' ? 1 : 0) +
    (filterMargin !== 'all' ? 1 : 0);

  const clearAllFilters = () => {
    setFilterStatus('all');
    setFilterCategory('all');
    setFilterBadge('all');
    setFilterPrice('all');
    setFilterHasMaterial('all');
    setFilterMargin('all');
    onSearchChange('');
  };

  // ===== Mutation handlers =====
  const handleUpdatePrice = async (id: string, newPrice: number) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    try {
      await updateProduct(id, { ...p, price: newPrice });
      toast.success(`Đã đổi giá ${p.name} → ${formatVND(newPrice)}`);
      onAfterMutate();
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi cập nhật giá');
    }
  };
  const handleToggleStatus = async (id: string) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const next = p.status === 'active' ? 'inactive' : 'active';
    try {
      await updateProduct(id, { ...p, status: next });
      toast.success(`Đã đổi sang ${next === 'active' ? 'Hoạt động' : 'Tạm dừng'}`);
      onAfterMutate();
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi đổi trạng thái');
    }
  };
  const handleDuplicate = async (p: Product) => {
    try {
      const copy = { ...p, name: p.name + ' (copy)' } as any;
      delete copy.id;
      delete copy.createdAt;
      // call addProduct via update with no id
      const { addProduct } = await import('@/services/productService');
      await addProduct(copy);
      toast.success(`Đã nhân bản ${p.name}`);
      onAfterMutate();
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi nhân bản');
    }
  };
  const handleBulkSetStatus = async (status: 'active' | 'inactive') => {
    const ids: string[] = Array.from(selected);
    if (ids.length === 0) return;
    try {
      for (const id of ids) {
        const p = products.find((x) => x.id === id);
        if (p) await updateProduct(id, { ...p, status });
      }
      toast.success(`Đã đổi ${ids.length} sp sang ${status === 'active' ? 'Hoạt động' : 'Tạm dừng'}`);
      clearSelection();
      onAfterMutate();
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi bulk update');
    }
  };
  const handleBulkDelete = async () => {
    const ids: string[] = Array.from(selected);
    if (ids.length === 0) return;
    if (!window.confirm(`Xoá ${ids.length} sản phẩm? Thao tác này không hoàn tác.`)) return;
    try {
      for (const id of ids) await deleteProduct(id);
      toast.success(`Đã xoá ${ids.length} sản phẩm`);
      clearSelection();
      onAfterMutate();
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi xoá');
    }
  };
  const handleBulkExport = () => {
    const subset = products.filter((p) => selected.has(p.id));
    exportProductsCSV(subset, `products-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`Đã export ${subset.length} sp`);
  };
  const handleExportAll = () => {
    exportProductsCSV(filtered, `products-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`Đã export ${filtered.length} sp`);
  };

  // ===== Render helpers =====
  const renderBadgeChips = (tags?: string[]) => {
    if (!tags || tags.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, idx) => {
          const b = badgeByName.get(tag);
          if (b) {
            return (
              <span
                key={`${idx}-${tag}`}
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: b.color + '22', color: b.color, border: `1px solid ${b.color}55` }}
              >
                {b.icon ? <span>{b.icon}</span> : null}
                {tag}
              </span>
            );
          }
          const palette = getTagPalette(tag);
          return <Badge key={`${idx}-${tag}`} className={palette.chip}>{tag}</Badge>;
        })}
      </div>
    );
  };

  // ===== Render top toolbar (filter + view + sort) =====
  const ViewToggle = (
    <Box layoutClassName="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-600 dark:bg-slate-800">
      {([
        { id: 'grid' as const, Icon: LayoutGrid, title: 'Grid' },
        { id: 'list' as const, Icon: List, title: 'List' },
        { id: 'compact' as const, Icon: Grid3x3, title: 'Compact' },
      ]).map(({ id, Icon, title }) => (
        <IconButton
          key={id}
          label={title}
          onClick={() => setViewMode(id)}
          variant="ghost"
          size="sm"
          backgroundClassName={viewMode === id ? 'bg-orange-500 hover:bg-orange-600' : 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}
          textClassName={viewMode === id ? 'text-white' : 'text-slate-500'}
          shadowClassName={viewMode === id ? 'shadow-sm' : ''}
          roundedClassName="rounded-md"
        >
          <Icon className="h-3.5 w-3.5" />
        </IconButton>
      ))}
    </Box>
  );

  const ToolbarActions = (
    <>
      <Button
        type="button"
        onClick={runAI}
        leftIcon={<Sparkles />}
        iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
        sizeClassName="px-3 py-2 text-xs"
        backgroundClassName="bg-gradient-to-r from-purple-600 to-pink-600"
        textClassName="font-semibold text-white"
        roundedClassName="rounded-xl"
        borderClassName="border border-transparent"
        layoutClassName="inline-flex items-center gap-1.5"
        disableVariantHover
        disableVariantTextColor
      >
        AI Insights
      </Button>
      <Button
        type="button"
        onClick={() => setCsvImportOpen(true)}
        leftIcon={<Upload />}
        iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
        sizeClassName="px-3 py-2 text-xs"
        backgroundClassName="bg-white dark:bg-slate-800"
        borderClassName="border border-slate-200 dark:border-slate-600"
        textClassName="font-medium text-slate-700 dark:text-slate-200"
        roundedClassName="rounded-xl"
        layoutClassName="inline-flex items-center gap-1.5"
        disableVariantHover
        disableVariantTextColor
      >
        Import
      </Button>
      <Button
        type="button"
        onClick={handleExportAll}
        leftIcon={<Download />}
        iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
        sizeClassName="px-3 py-2 text-xs"
        backgroundClassName="bg-white dark:bg-slate-800"
        borderClassName="border border-slate-200 dark:border-slate-600"
        textClassName="font-medium text-slate-700 dark:text-slate-200"
        roundedClassName="rounded-xl"
        layoutClassName="inline-flex items-center gap-1.5"
        disableVariantHover
        disableVariantTextColor
      >
        Export
      </Button>
      <Button
        type="button"
        onClick={onCreate}
        leftIcon={<Plus />}
        iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
        sizeClassName="px-4 py-2"
        backgroundClassName="bg-orange-600 hover:bg-orange-700"
        textClassName="font-medium text-white"
        roundedClassName="rounded-xl"
        borderClassName="border border-transparent"
        layoutClassName="inline-flex items-center gap-1.5"
        disableVariantHover
        disableVariantTextColor
      >
        Thêm SP
      </Button>
    </>
  );

  const CustomFilters = (
    <>
      <FilterPill label="Trạng thái" value={filterStatus} onChange={(v) => setFilterStatus(v as any)} options={[
        { value: 'all', label: 'Tất cả' },
        { value: 'active', label: 'Hoạt động' },
        { value: 'inactive', label: 'Tạm dừng' },
      ]} />
      {categories.length > 0 ? (
        <FilterPill label="Category" value={filterCategory} onChange={setFilterCategory} options={[
          { value: 'all', label: 'Tất cả' },
          ...categories.map((c) => ({ value: c, label: c })),
        ]} />
      ) : null}
      {productBadges.length > 0 ? (
        <FilterPill label="Badge" value={filterBadge} onChange={setFilterBadge} options={[
          { value: 'all', label: 'Tất cả' },
          ...productBadges.map((b) => ({ value: b.name, label: `${b.icon ?? ''} ${b.name}` })),
        ]} />
      ) : null}
      <FilterPill label="Giá" value={filterPrice} onChange={(v) => setFilterPrice(v as any)} options={[
        { value: 'all', label: 'Tất cả' },
        { value: 'low', label: '< 50K' },
        { value: 'mid', label: '50-100K' },
        { value: 'high', label: '> 100K' },
      ]} />
      <FilterPill label="Margin" value={filterMargin} onChange={(v) => setFilterMargin(v as any)} options={[
        { value: 'all', label: 'Tất cả' },
        { value: 'low', label: '< 20%' },
        { value: 'losing', label: 'Đang lỗ' },
      ]} />
      <FilterPill label="Nguyên liệu" value={filterHasMaterial} onChange={(v) => setFilterHasMaterial(v as any)} options={[
        { value: 'all', label: 'Tất cả' },
        { value: 'yes', label: 'Có công thức' },
        { value: 'no', label: 'Chưa có' },
      ]} />
    </>
  );

  const ToolbarTop = (
    <FilterToolbar
      search={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="Tìm sản phẩm..."
      sortBy={sortBy}
      onSortChange={(v) => setSortBy(v as ProductSortKey)}
      sortOptions={[
        { value: 'recent', label: 'Mới nhất' },
        { value: 'popular', label: 'Bán chạy' },
        { value: 'name-asc', label: 'Tên A-Z' },
        { value: 'name-desc', label: 'Tên Z-A' },
        { value: 'price-desc', label: 'Giá cao→thấp' },
        { value: 'price-asc', label: 'Giá thấp→cao' },
        { value: 'margin-desc', label: 'Margin cao' },
      ]}
      actions={ToolbarActions}
      viewToggle={ViewToggle}
      customFilters={CustomFilters}
      onClearAll={clearAllFilters}
      advancedFiltersCount={activeFilterCount}
      stats={
        <Typography size="xs" variant="muted" layoutClassName="text-right">
          {filtered.length} / {products.length} sản phẩm
        </Typography>
      }
    />
  );

  // ===== Bulk bar =====
  const BulkBar = selected.size > 0 ? (
    <Box
      layoutClassName="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-orange-300 bg-orange-50/90 p-3 shadow-lg backdrop-blur dark:border-orange-600 dark:bg-orange-950/40"
    >
      <Box layoutClassName="flex items-center gap-2">
        <Typography size="sm" layoutClassName="font-bold text-orange-700 dark:text-orange-300">
          {selected.size} đã chọn
        </Typography>
        <IconButton
          label="Bỏ chọn tất cả"
          variant="ghost"
          size="sm"
          onClick={clearSelection}
          backgroundClassName="bg-transparent hover:bg-orange-200 dark:hover:bg-orange-900/40"
          textClassName="text-orange-700 dark:text-orange-200"
          roundedClassName="rounded-full"
        >
          <X className="h-3.5 w-3.5" />
        </IconButton>
      </Box>
      <Box layoutClassName="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => handleBulkSetStatus('active')} sizeClassName="px-3 py-1.5 text-xs"
          backgroundClassName="bg-emerald-600" textClassName="font-semibold text-white" roundedClassName="rounded-lg"
          disableVariantHover disableVariantTextColor>Bật</Button>
        <Button type="button" onClick={() => handleBulkSetStatus('inactive')} sizeClassName="px-3 py-1.5 text-xs"
          backgroundClassName="bg-slate-600" textClassName="font-semibold text-white" roundedClassName="rounded-lg"
          disableVariantHover disableVariantTextColor>Tắt</Button>
        <Button type="button" onClick={handleBulkExport} leftIcon={<Download />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
          sizeClassName="px-3 py-1.5 text-xs"
          backgroundClassName="bg-white dark:bg-slate-800"
          borderClassName="border border-slate-200 dark:border-slate-600"
          textClassName="font-semibold text-slate-700 dark:text-slate-200"
          roundedClassName="rounded-lg"
          layoutClassName="inline-flex items-center gap-1.5"
          disableVariantHover disableVariantTextColor>Export</Button>
        <Button type="button" onClick={handleBulkDelete} leftIcon={<Trash2 />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
          sizeClassName="px-3 py-1.5 text-xs"
          backgroundClassName="bg-red-600"
          textClassName="font-semibold text-white"
          roundedClassName="rounded-lg"
          layoutClassName="inline-flex items-center gap-1.5"
          disableVariantHover disableVariantTextColor>Xoá</Button>
      </Box>
    </Box>
  ) : null;

  // ===== Loading / empty =====
  if (loading) {
    return (
      <Box layoutClassName="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </Box>
    );
  }

  if (products.length === 0) {
    return (
      <Box layoutClassName="flex flex-col items-center gap-4 py-12 text-center">
        <Package className="h-16 w-16 text-slate-300" />
        <Typography size="sm" variant="muted">Chưa có sản phẩm nào</Typography>
        <Button type="button" onClick={onCreate} sizeClassName="px-4 py-2"
          backgroundClassName="bg-orange-600" textClassName="text-white"
          roundedClassName="rounded-lg" disableVariantHover disableVariantTextColor>
          Tạo sản phẩm đầu tiên
        </Button>
      </Box>
    );
  }

  // ===== Empty filter result =====
  if (filtered.length === 0) {
    return (
      <Box layoutClassName="space-y-3">
        {ToolbarTop}
        <Box layoutClassName="flex flex-col items-center gap-3 py-12 text-center">
          <Search className="h-10 w-10 text-slate-300" />
          <Typography size="sm" variant="muted">Không có sản phẩm nào khớp filter.</Typography>
          <Button
            type="button"
            onClick={clearAllFilters}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            sizeClassName="text-sm"
            backgroundClassName="bg-transparent"
            textClassName="font-semibold text-orange-600 hover:underline"
            borderClassName="border-transparent"
          >
            Xoá filter
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box layoutClassName="space-y-3">
      {ToolbarTop}
      {BulkBar}

      {/* ===== Grid view ===== */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-6">
          {filtered.map((p) => (
            <GridCard
              key={p.id}
              product={p}
              metric={metrics[p.id]}
              selected={selected.has(p.id)}
              onSelectToggle={() => toggleSelect(p.id)}
              onEdit={() => onEdit(p)}
              onDuplicate={() => handleDuplicate(p)}
              onUpdatePrice={(n) => handleUpdatePrice(p.id, n)}
              onToggleStatus={() => handleToggleStatus(p.id)}
              renderBadges={renderBadgeChips}
            />
          ))}
        </div>
      ) : null}

      {/* ===== List view ===== */}
      {viewMode === 'list' ? (
        <Card padding="none" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="overflow-hidden">
          <div className="max-h-[70vh] overflow-auto">
            <Table>
              <TableHead backgroundClassName="bg-slate-50 dark:bg-slate-800" stateClassName="sticky top-0 z-10">
                <TableRow>
                  <TableHeaderCell layoutClassName="w-10 p-2"> </TableHeaderCell>
                  <TableHeaderCell layoutClassName="p-2 text-left text-xs font-bold uppercase text-slate-500">Tên</TableHeaderCell>
                  <TableHeaderCell layoutClassName="p-2 text-left text-xs font-bold uppercase text-slate-500">Category</TableHeaderCell>
                  <TableHeaderCell layoutClassName="p-2 text-right text-xs font-bold uppercase text-slate-500">Giá</TableHeaderCell>
                  <TableHeaderCell layoutClassName="p-2 text-right text-xs font-bold uppercase text-slate-500">Margin</TableHeaderCell>
                  <TableHeaderCell layoutClassName="p-2 text-right text-xs font-bold uppercase text-slate-500">30d</TableHeaderCell>
                  <TableHeaderCell layoutClassName="p-2 text-center text-xs font-bold uppercase text-slate-500">Trạng thái</TableHeaderCell>
                  <TableHeaderCell layoutClassName="w-12 p-2"> </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((p) => (
                  <ListRow
                    key={p.id}
                    product={p}
                    metric={metrics[p.id]}
                    selected={selected.has(p.id)}
                    onSelectToggle={() => toggleSelect(p.id)}
                    onEdit={() => onEdit(p)}
                    onDuplicate={() => handleDuplicate(p)}
                    onUpdatePrice={(n) => handleUpdatePrice(p.id, n)}
                    onToggleStatus={() => handleToggleStatus(p.id)}
                    renderBadges={renderBadgeChips}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : null}

      {/* ===== Compact view ===== */}
      {viewMode === 'compact' ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 pb-6">
          {filtered.map((p) => (
            <CompactCard
              key={p.id}
              product={p}
              metric={metrics[p.id]}
              selected={selected.has(p.id)}
              onSelectToggle={() => toggleSelect(p.id)}
              onEdit={() => onEdit(p)}
            />
          ))}
        </div>
      ) : null}

      {/* AI Insights Modal */}
      <AiInsightsModal
        open={aiOpen}
        loading={aiLoading}
        text={aiText}
        productCount={products.length}
        onClose={() => setAiOpen(false)}
        onRefresh={() => void runAI()}
      />

      {/* CSV Import Modal */}
      {csvImportOpen ? (
        <CsvImportModal
          existingProducts={products}
          onClose={() => setCsvImportOpen(false)}
          onComplete={() => onAfterMutate()}
        />
      ) : null}
    </Box>
  );
};

export default ProductSection;

