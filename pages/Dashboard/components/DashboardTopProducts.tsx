import React, { useMemo, useState, useEffect } from 'react';
import { TrendingUp, Package } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import AvatarImage from '@/components/ui/AvatarImage';
import Badge from '@/components/ui/Badge';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import { Product } from '@/types/product';
import { ProductCategory } from '@/types/category';
import { fetchProducts } from '@/services/productService';
import { fetchCategories } from '@/services/categoryService';
import { formatVND } from '@/utils/format/currencyUtil';
import { getOrderRevenueDate } from '@/utils/order/orderUtils';

interface DashboardTopProductsProps {
  orders: Order[];
  /** Khoảng thời gian đang xem (đồng bộ với DashboardChart period) */
  startDate: Date;
  endDate: Date;
  /** Số lượng top hiển thị — mặc định 5 */
  limit?: number;
}

interface TopProduct {
  name: string;
  qty: number;
  revenue: number;
  /** Ảnh sản phẩm (ưu tiên từ order item, fallback product master) */
  image: string;
  /** Để map sang Product → danh mục */
  productId: string;
}

/**
 * Top sản phẩm bán chạy nhất trong period.
 * Aggregate từ `order.items` của đơn DELIVERED + PAID trong khoảng [startDate, endDate].
 * Sort desc theo SỐ LƯỢNG bán (qty), tie-break bằng REVENUE.
 *
 * Hiển thị kèm ẢNH (từ order item / product) và CHIP DANH MỤC (icon + tên + màu).
 * Products/categories fetch 1 lần; nếu API lỗi thì degrade êm (vẫn hiện ảnh + tên).
 */
const DashboardTopProducts: React.FC<DashboardTopProductsProps> = ({
  orders,
  startDate,
  endDate,
  limit = 5,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [ps, cs] = await Promise.all([fetchProducts(), fetchCategories()]);
        if (!alive) return;
        setProducts(Array.isArray(ps) ? ps : []);
        setCategories(Array.isArray(cs) ? cs : []);
      } catch (err) {
        // Degrade êm: thiếu products/categories thì vẫn hiện ảnh + tên, ẩn chip danh mục
        console.error('DashboardTopProducts: tải products/categories lỗi', err);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const productById = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) if (p.id) m.set(p.id, p);
    return m;
  }, [products]);

  /** Map cả theo id lẫn name (lowercase) vì Product.category có thể lưu id hoặc name. */
  const categoryByKey = useMemo(() => {
    const m = new Map<string, ProductCategory>();
    for (const c of categories) {
      if (c.id) m.set(c.id, c);
      if (c.name) m.set(c.name.toLowerCase(), c);
    }
    return m;
  }, [categories]);

  const topProducts = useMemo<TopProduct[]>(() => {
    const agg = new Map<string, TopProduct>();

    for (const o of orders) {
      if (o.paymentStatus !== PaymentStatus.PAID || o.status !== OrderStatus.DELIVERED) continue;
      // Mốc doanh thu: ưu tiên deliveryDate, fallback createdAt
      const revDate = getOrderRevenueDate(o);
      if (!revDate || revDate < startDate || revDate > endDate) continue;
      if (!Array.isArray(o.items)) continue;
      for (const item of o.items) {
        // Gom theo SẢN PHẨM. LƯU Ý dữ liệu thật: product id được lưu ở `item.id`
        // (OrderForm lưu `id: item.productId`), còn `item.productId` thường UNDEFINED.
        // → ưu tiên productId (dữ liệu tương lai), fallback item.id (product id hiện tại), rồi name.
        const productKey = item.productId || item.id;
        const key = productKey || item.name;
        if (!key) continue;
        const prev =
          agg.get(key) ??
          { name: item.name || '(không tên)', qty: 0, revenue: 0, image: '', productId: productKey || '' };
        prev.qty += Number(item.quantity) || 0;
        prev.revenue += (Number(item.quantity) || 0) * (Number(item.price) || 0);
        if (!prev.image && item.image) prev.image = item.image;
        if (!prev.productId && productKey) prev.productId = productKey;
        agg.set(key, prev);
      }
    }

    return Array.from(agg.values())
      .sort((a, b) => (b.qty - a.qty) || (b.revenue - a.revenue))
      .slice(0, limit);
  }, [orders, startDate, endDate, limit]);

  /** Tra danh mục của 1 top product qua Product master. */
  const resolveCategory = (productId: string): ProductCategory | undefined => {
    const product = productId ? productById.get(productId) : undefined;
    const raw = product?.category;
    if (!raw) return undefined;
    return categoryByKey.get(raw) ?? categoryByKey.get(raw.toLowerCase());
  };

  return (
    <Card padding="none" layoutClassName="flex flex-col overflow-hidden">
      <Box
        layoutClassName="flex shrink-0 items-center gap-2 border-b px-5 py-4"
        borderClassName="border-slate-100 dark:border-slate-700"
      >
        <TrendingUp className="h-5 w-5 text-primary-500" />
        <Heading level={3} textClassName="text-base font-semibold">
          Top sản phẩm bán chạy
        </Heading>
      </Box>

      <Box layoutClassName="flex-1 p-3">
        {topProducts.length === 0 ? (
          <Box layoutClassName="flex h-full items-center justify-center p-6">
            <Typography as="span" size="sm" variant="muted" layoutClassName="text-center">
              Chưa có dữ liệu trong khoảng này
            </Typography>
          </Box>
        ) : (
          <Box layoutClassName="space-y-1.5">
            {topProducts.map((p, idx) => {
              const maxQty = topProducts[0]?.qty || 1;
              const widthPct = Math.max(8, Math.round((p.qty / maxQty) * 100));
              const image = p.image || productById.get(p.productId)?.image || '';
              const category = resolveCategory(p.productId);
              return (
                <Box
                  key={p.name + idx}
                  layoutClassName="relative overflow-hidden px-3 py-2"
                  roundedClassName="rounded-lg"
                  borderClassName="border border-slate-100 dark:border-slate-700"
                >
                  {/* Bar background — visual rank theo qty */}
                  <Box
                    layoutClassName="absolute inset-y-0 left-0"
                    backgroundClassName="bg-primary-50 dark:bg-primary-900/20"
                    stateClassName="transition-all"
                    style={{ width: `${widthPct}%` }}
                  />
                  <Box layoutClassName="relative flex items-center justify-between gap-3">
                    <Box layoutClassName="flex min-w-0 items-center gap-2.5">
                      <Box
                        layoutClassName="inline-flex h-5 w-5 shrink-0 items-center justify-center"
                        roundedClassName="rounded-full"
                        backgroundClassName="bg-primary-100 dark:bg-primary-900/40"
                      >
                        <Typography
                          as="span"
                          size="xs"
                          textClassName="font-bold text-primary-700 dark:text-primary-200"
                        >
                          {idx + 1}
                        </Typography>
                      </Box>
                      <AvatarImage
                        size="md"
                        src={image}
                        alt={p.name}
                        containerClassName="rounded-lg"
                        fallback={<Package className="h-5 w-5 text-primary-400" />}
                      />
                      <Box layoutClassName="flex min-w-0 flex-col">
                        <Typography
                          as="span"
                          size="sm"
                          layoutClassName="truncate font-medium"
                          title={p.name}
                        >
                          {p.name}
                        </Typography>
                        {category ? (
                          <Badge
                            size="sm"
                            layoutClassName="mt-0.5 w-fit"
                            style={
                              category.color
                                ? {
                                    color: category.color,
                                    borderColor: category.color,
                                    backgroundColor: `${category.color}1a`,
                                  }
                                : undefined
                            }
                          >
                            {category.icon ? `${category.icon} ${category.name}` : category.name}
                          </Badge>
                        ) : null}
                      </Box>
                    </Box>
                    <Box layoutClassName="flex shrink-0 flex-col items-end">
                      {/* Con số CHÍNH = tổng số lượng item bán được (không phải giá tiền) */}
                      <Typography
                        as="span"
                        size="sm"
                        textClassName="font-bold text-primary-600 dark:text-primary-400"
                      >
                        {p.qty} sản phẩm
                      </Typography>
                      <Typography as="span" size="xs" variant="muted">
                        {formatVND(p.revenue)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default DashboardTopProducts;
