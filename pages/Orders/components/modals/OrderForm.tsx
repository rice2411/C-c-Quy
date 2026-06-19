import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Calendar, Clock, Hash, Megaphone, Save, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { formatVND } from '@/utils/format/currencyUtil';
import { previewPromotion, fetchPromotions } from '@/services/promotionService';
import { ComputeResult, Promotion } from '@/types/promotion';
import { useAuth } from '@/contexts/AuthContext';
import { collaboratorHasZaloGroup } from '@/services/configurationService';
import { UserRole } from '@/types/user';
import { useCustomers } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/queries/useProductsQuery';
import { qk } from '@/hooks/queryKeys';
import { useLanguage } from '@/contexts/LanguageContext';
import { getNextOrderNumber } from '@/services/orderService';
import { fetchCommissionGroups } from '@/services/commissionGroupService';
import { calcItemCommission } from '@/types/commissionGroup';
import { getUserByUid } from '@/services/userService';
import { fetchMaterialPriceOptions, MaterialPriceOption } from '@/services/stockReceiptService';
import { DeliveryType, Order, OrderDecoration, OrderStatus, PaymentMethod, PaymentStatus, Product } from '@/types/index';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import EmptyState from '@/components/ui/EmptyState';
import Field from '@/components/ui/Field';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';
import CreateCustomerModal from '@/pages/Orders/components/modals/CreateCustomerModal';
import OrderFormCustomerSection from '@/pages/Orders/components/OrderFormCustomerSection';
import OrderFormItemsSection from '@/pages/Orders/components/OrderFormItemsSection';
import OrderFormDecorationSection from '@/pages/Orders/components/OrderFormDecorationSection';
import OrderFormStatusSection from '@/pages/Orders/components/OrderFormStatusSection';
import { pushRecentProductId } from '@/utils/product/recentProducts';

interface OrderFormProps {
  isOpen: boolean;
  initialData?: Order | null;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export interface FormItem {
  id: string;
  productId: string;
  productName: string;
  image?: string;
  quantity: number;
  unitPrice: number;
}
const OrderForm: React.FC<OrderFormProps> = ({ isOpen, initialData, onSave, onCancel }) => {
  const { t } = useLanguage();
  const { currentUser, userData } = useAuth();
  const { customers, createNewCustomer } = useCustomers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);

  const [orderNumber, setOrderNumber] = useState('');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Helper: flash highlight 1 item trong list trong ~1.4s rồi tự clear.
  const flashHighlight = (itemId: string) => {
    setRecentlyAddedId(itemId);
    setTimeout(() => {
      setRecentlyAddedId((prev) => (prev === itemId ? null : prev));
    }, 1400);
  };
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // New: Multiple Items State
  const [items, setItems] = useState<FormItem[]>([]);

  // Products: lấy từ React Query (P2 useProducts) thay vì tự fetch.
  const { products } = useProducts();

  // Trang trí thêm: vật phẩm chọn từ nguyên liệu (materials) — React Query.
  const { data: materialsData } = useQuery({
    queryKey: qk.stockReceipt.materialPriceOptions,
    queryFn: fetchMaterialPriceOptions,
    enabled: !!currentUser && isOpen,
  });
  const materials: MaterialPriceOption[] = materialsData ?? [];

  const [decorations, setDecorations] = useState<OrderDecoration[]>([]);

  const [shippingCost, setShippingCost] = useState(0);
  const [shipInfo, setShipInfo] = useState<NonNullable<Order['shipInfo']> | null>(null);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.UNPAID);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliveryTime, setDeliveryTime] = useState<string>('');
  const [isDeliveryTimeEnabled, setIsDeliveryTimeEnabled] = useState<boolean>(false);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(DeliveryType.SHIP);
  // Đơn hàng test — dùng để test tính năng. Khi bật, Zalo message sẽ có banner === ĐƠN HÀNG TEST ===
  const [isTest, setIsTest] = useState<boolean>(false);

  // Khuyến mãi: chọn chiến dịch (opt-in) + mã nhập + kết quả tính giảm (thẩm quyền BE).
  const [promoCode, setPromoCode] = useState('');
  const [promoPreview, setPromoPreview] = useState<ComputeResult | null>(null);
  const [loadingPromo, setLoadingPromo] = useState(false);
  const [selectedPromoIds, setSelectedPromoIds] = useState<string[]>([]);

  // Tất cả chiến dịch (React Query) — lọc "đang chạy" qua useMemo bên dưới.
  const { data: promotionsData } = useQuery({
    queryKey: qk.promotions.all,
    queryFn: fetchPromotions,
    enabled: !!currentUser && isOpen,
  });
  // Chiến dịch đang trong thời gian hoạt động (active + trong khoảng start/end).
  const campaigns: Promotion[] = useMemo(() => {
    const list = promotionsData ?? [];
    const now = Date.now();
    return list.filter(
      (p) =>
        p.status === 'active' &&
        (!p.startAt || now >= Date.parse(p.startAt)) &&
        (!p.endAt || now <= Date.parse(p.endAt)),
    );
  }, [promotionsData]);

  // Số đơn kế tiếp — chỉ fetch khi mở form TẠO MỚI (không có initialData).
  const isCreating = isOpen && !initialData;
  const { data: nextOrderNumberData, isFetching: loadingOrderNumber } = useQuery({
    queryKey: qk.orders.nextNumber(),
    queryFn: getNextOrderNumber,
    enabled: !!currentUser && isCreating,
  });

  // Initialize or reset form when panel opens; reset fully when opening for new order
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setShowCreateCustomerModal(false);
    setPendingOrderData(null);
    if (initialData) {
      setOrderNumber(initialData.orderNumber || 'N/A');
      setCustomerName(initialData.customer.name);
      setPhone(initialData.customer.phone);
      setAddress(initialData.customer.address);
      setDeliveryDate(initialData.deliveryDate || '');
      setDeliveryTime(initialData.deliveryTime || '');
      setIsDeliveryTimeEnabled(!!initialData.deliveryTime);
      setNote(initialData.note || '');
      setStatus(initialData.status);
      setPaymentStatus(initialData.paymentStatus || PaymentStatus.UNPAID);
      setPaymentMethod(initialData.paymentMethod || PaymentMethod.CASH);
      setDeliveryType(initialData.deliveryType || DeliveryType.SHIP);
      setShippingCost(initialData.shippingCost || 0);
      setShipInfo(initialData.shipInfo ?? null);
      setIsTest(!!initialData.isTest);
      setDecorations(initialData.decorations ?? []);
      // Điền lại mã + chiến dịch đã áp để sửa đơn không mất khuyến mãi.
      setPromoCode(initialData.appliedPromotions?.find((p) => p.code)?.code ?? '');
      setSelectedPromoIds((initialData.appliedPromotions ?? []).map((p) => p.promotionId));
      if (initialData.items && initialData.items.length > 0) {
        const loadedItems = initialData.items.map((item, index) => ({
          id: `item-${Date.now()}-${index}`,
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          image: item.image
        }));
        setItems(loadedItems);
      } else if (products.length > 0) {
        setItems([{
          id: genItemId(),
          productId: products[0]?.id || '',
          productName: products[0]?.name || '',
          quantity: 1,
          unitPrice: products[0]?.price || 0,
          image: products[0]?.image
        }]);
      }
    } else {
      // orderNumber cho đơn mới được set từ React Query (effect riêng bên dưới).
      setCustomerName('');
      setPhone('');
      setAddress('');
      setNote('');
      setDeliveryDate('');
      setDeliveryTime('');
      setIsDeliveryTimeEnabled(false);
      setShippingCost(0);
      setStatus(OrderStatus.PENDING);
      setPaymentStatus(PaymentStatus.UNPAID);
      setPaymentMethod(PaymentMethod.CASH);
      setDeliveryType(DeliveryType.SHIP);
      setItems([]);
      setIsTest(false);
      setDecorations([]);
      setPromoCode('');
      setPromoPreview(null);
      setSelectedPromoIds([]);
    }
  }, [initialData, isOpen]);

  // Đơn TẠO MỚI: đổ orderNumber từ React Query vào ô (đã reset rỗng ở effect trên).
  useEffect(() => {
    if (isCreating && nextOrderNumberData) {
      setOrderNumber(nextOrderNumberData);
    }
  }, [isCreating, nextOrderNumberData]);

  // Đơn mới mở → để rỗng; user search trong ProductSearchBar và click để add.
  // Không auto-add product đầu tiên nữa.


  // Sinh id duy nhất cho 1 form item — KHÔNG dùng Date.now()+items.length vì
  // khi bulk add (forEach trong cùng tick) sẽ ra cùng id, gây React key trùng
  // → quantity input của 2 row chia sẻ cùng state.
  const genItemId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `item-${crypto.randomUUID()}`;
    }
    return `item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  };

  const handleAddItem = () => {
    const first = products[0];
    setItems([...items, {
      id: genItemId(),
      productId: first?.id || '',
      productName: first?.name || '',
      quantity: 1,
      unitPrice: first?.price || 0,
      image: first?.image
    }]);
  };

  /**
   * Thêm 1 sản phẩm vào đơn qua ProductSearchBar.
   * Nếu sản phẩm đã có trong đơn → tự tăng quantity +1 (POS-style).
   * Ngược lại → tạo line item mới.
   */
  const handleAddItemWithProduct = (product: Product) => {
    const newId = genItemId();
    let resolvedId = newId;
    setItems(prev => {
      const existingIdx = prev.findIndex(i => i.productId === product.id);
      if (existingIdx >= 0) {
        resolvedId = prev[existingIdx].id;
        return prev.map((item, idx) =>
          idx === existingIdx ? { ...item, quantity: (item.quantity || 0) + 1 } : item,
        );
      }
      return [...prev, {
        id: newId,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        image: product.image,
      }];
    });
    flashHighlight(resolvedId);
    // Lưu lên localStorage để hiện trong "Hay dùng" lần sau.
    pushRecentProductId(product.id);
  };

  /**
   * Giảm 1 quantity từ ProductSearchBar stepper. Nếu quantity về 0 → xoá item.
   */
  const handleDecrementProduct = (productId: string) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.productId === productId);
      if (idx < 0) return prev;
      const cur = prev[idx];
      const newQty = (cur.quantity || 0) - 1;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      return prev.map((item, i) =>
        i === idx ? { ...item, quantity: newQty } : item,
      );
    });
  };

  // Đã bỏ tính năng "Tạo item tuỳ chỉnh" — đơn chỉ được thêm sản phẩm có sẵn
  // trong inventory. Nếu tìm không thấy → empty state, không cho tạo mới.

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(i => i.id !== itemId));
  };

  const handleUpdateItem = (itemId: string, field: keyof FormItem, value: any) => {
    // Functional setState để cho phép multiple sequential calls (vd. ProductPicker
    // gọi clear productId rồi set productName trong cùng tick).
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        // If selecting a product
        if (field === 'productId') {
          const selected = products.find(p => p.id === value);
          if (selected) {
            return {
              ...item,
              productId: selected.id,
              productName: selected.name,
              unitPrice: selected.price,
              image: selected.image
            };
          }
          // Custom item
          return {
            ...item,
            productId: '',
            productName: '',
            unitPrice: 0,
            image: undefined
          };
        }

        // Otherwise update field normally
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Tổng tiền hàng TRƯỚC giảm (items + decorations).
  const subtotal =
    items.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0) +
    decorations.reduce((sum, d) => sum + Number(d.price) * Number(d.quantity), 0);
  const discountAmount = promoPreview?.discountAmount ?? 0;
  const total = Math.max(0, subtotal + Number(shippingCost) - discountAmount);

  // Giữ mã mới nhất để effect tự-áp dùng mà không phụ thuộc vào từng phím gõ.
  const promoCodeRef = useRef(promoCode);
  useEffect(() => {
    promoCodeRef.current = promoCode;
  }, [promoCode]);

  const runPreview = async (ids: string[], code: string, silent: boolean) => {
    if (items.length === 0) {
      setPromoPreview(null);
      if (!silent) toast.error('Thêm sản phẩm trước khi áp khuyến mãi');
      return;
    }
    if (ids.length === 0 && !code.trim()) {
      setPromoPreview(null); // chưa chọn chiến dịch & chưa nhập mã → không giảm
      return;
    }
    if (!silent) setLoadingPromo(true);
    try {
      const res = await previewPromotion({
        items: items
          .filter((i) => i.productId)
          .map((i) => ({ productId: i.productId, price: Number(i.unitPrice), quantity: Number(i.quantity) })),
        decorations: decorations.map((d) => ({ price: Number(d.price), quantity: Number(d.quantity) })),
        shippingCost: Number(shippingCost),
        code: code.trim() || undefined,
        promotionIds: ids,
      });
      setPromoPreview(res);
      if (!silent) {
        if (res.errors?.length) res.errors.forEach((er) => toast.error(er));
        else if (res.discountAmount > 0) toast.success(`Đã áp dụng — giảm ${formatVND(res.discountAmount)}`);
        else toast('Khuyến mãi chưa áp được cho đơn này');
      }
    } catch (e) {
      if (!silent) toast.error(e instanceof Error ? e.message : 'Không kiểm tra được khuyến mãi');
    } finally {
      if (!silent) setLoadingPromo(false);
    }
  };

  // Tính lại khi giỏ / chiến dịch chọn thay đổi (mã lấy từ ref) — debounce, im lặng.
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (!cancelled) void runPreview(selectedPromoIds, promoCodeRef.current, true);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, decorations, shippingCost, selectedPromoIds]);

  const handlePreviewPromo = () => void runPreview(selectedPromoIds, promoCode, false);


  const normalizePhone = (phoneStr: string) => phoneStr.replace(/[^0-9]/g, '').toLowerCase();

  const checkCustomerExists = (phoneNumber: string): boolean => {
    if (!phoneNumber.trim()) return false;
    const normalizedPhone = normalizePhone(phoneNumber);
    return customers.some(c => normalizePhone(c.phone || '') === normalizedPhone);
  };

  const handleCreateCustomer = async (name: string, phoneNumber: string) => {
    try {
      await createNewCustomer({
        name,
        phone: phoneNumber,
      });
      setShowCreateCustomerModal(false);
      
      if (pendingOrderData) {
        await submitOrderData(pendingOrderData);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tạo khách hàng');
      setShowCreateCustomerModal(false);
      setIsSubmitting(false);
    }
  };

  const submitOrderData = async (formData: any) => {
    if (userData?.role === UserRole.COLABORATOR && currentUser?.uid) {
      const ok = await collaboratorHasZaloGroup(currentUser.uid);
      if (!ok) {
        toast.error(
          'Bạn chưa được thêm vào nhóm Zalo. Hãy liên hệ quản trị viên.',
        );
        setPendingOrderData(null);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      setPendingOrderData(null);
    } catch (err: any) {
      setError(err.message || "Failed to save order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!customerName.trim()) {
        throw new Error("Customer name is required");
      }

      // Bắt buộc deliveryDate — cần cho tính doanh thu theo ngày giao
      if (!deliveryDate || !deliveryDate.trim()) {
        throw new Error("Ngày nhận hàng là bắt buộc");
      }

      if (items.length === 0) {
        throw new Error("At least one product is required");
      }

      const finalItems = items.map(item => {
         const finalProductName = item.productName?.trim();
         if (!finalProductName) throw new Error("Product name is required for all items");
         if (!item.productId) throw new Error("Please select a product for all items");
         
         return {
           id: item.productId,
           name: finalProductName,
           quantity: Number(item.quantity),
           price: Number(item.unitPrice),
           image: item.image
         };
      });

      // Tính hoa hồng nếu creator là CTV và đơn mới (không phải edit)
      let commissionAmount: number | undefined;
      let commissionStatus: 'pending' | undefined;
      if (!initialData?.id && userData?.role === UserRole.COLABORATOR) {
        const groups = await fetchCommissionGroups().catch(() => []);
        commissionAmount = finalItems.reduce((sum, item) => {
          const product = products.find(p => p.id === item.id);
          if (!product) return sum;
          if (groups.length > 0) {
            // Margin-based commission
            const perUnit = calcItemCommission(item.price, product.costPrice, groups);
            return sum + perUnit * item.quantity;
          }
          // Legacy fallback: commissionRate cố định
          const rate = product.commissionRate ?? 0;
          return sum + item.price * item.quantity * rate;
        }, 0);
        if (commissionAmount > 0) commissionStatus = 'pending';
      }

      const formData = {
        id: initialData?.id,
        orderNumber: orderNumber,
        customer: {
          name: customerName,
          phone: phone,
          address: address,
        },
        items: finalItems,
        decorations: decorations,
        shippingCost: Number(shippingCost),
        shipInfo: shipInfo ?? undefined,
        subtotal: subtotal,
        discountAmount: discountAmount,
        appliedPromotions: promoPreview?.appliedPromotions ?? [],
        appliedPromotionCode: promoCode.trim() || undefined,
        appliedPromotionIds: selectedPromoIds,
        total: total,
        note: note,
        deliveryDate: deliveryDate,
        deliveryTime: isDeliveryTimeEnabled && deliveryTime ? deliveryTime : undefined,
        status: status,
        paymentStatus: paymentStatus,
        paymentMethod: paymentMethod,
        deliveryType: deliveryType,
        isTest: isTest,
        createdBy: currentUser.uid,
        ...(commissionAmount !== undefined && { commissionAmount }),
        ...(commissionStatus && { commissionStatus }),
      };

      if (phone.trim() && !checkCustomerExists(phone)) {
        setPendingOrderData(formData);
        setShowCreateCustomerModal(true);
        return;
      }

      await submitOrderData(formData);
    } catch (err: any) {
      setError(err.message || "Failed to save order");
      setIsSubmitting(false);
    }
  };

  const footer = (
    <Box layoutClassName="flex justify-end gap-3">
      <Button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        variant="secondary"
        disableVariantHover
        disableVariantTextColor
        borderClassName="border border-slate-200 dark:border-slate-600"
        backgroundClassName="bg-transparent"
        hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
        textClassName="text-sm font-medium text-slate-700 dark:text-slate-300"
        roundedClassName="rounded-lg"
        sizeClassName="px-4 py-2"
        stateClassName="transition-colors disabled:opacity-50"
      >
        {t('form.cancel')}
      </Button>
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || loadingOrderNumber}
        leftIcon={isSubmitting ? undefined : <Save />}
        iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
        backgroundClassName="bg-primary-600 dark:bg-primary-500"
        hoverClassName="hover:bg-primary-700 dark:hover:bg-primary-600"
        textClassName="text-sm font-medium text-white"
        roundedClassName="rounded-lg"
        shadowClassName="shadow-sm"
        sizeClassName="px-6 py-2"
        layoutClassName="flex items-center gap-2"
        stateClassName="transition-colors disabled:opacity-70"
        variant="primary"
        disableVariantHover
        disableVariantTextColor
      >
        {isSubmitting ? t('form.saving') : t('form.save')}
      </Button>
    </Box>
  );

  return (
    <>
      <BaseSlidePanel
        isOpen={isOpen}
        onClose={onCancel}
        title={initialData ? t('form.editTitle') : t('form.createTitle')}
        maxWidth="xl"
        footer={footer}
      >
        <form onSubmit={handleSubmit} className="min-w-0">
          <Box layoutClassName="space-y-6 p-4 sm:p-6 min-w-0 overflow-x-hidden">
            {error ? (
              <Box
                layoutClassName="flex items-center gap-2 rounded-lg p-3 text-sm"
                backgroundClassName="bg-red-50 dark:bg-red-900/20"
                textClassName="text-red-600 dark:text-red-400"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </Box>
            ) : null}

            <Field label={t('detail.orderId')} htmlFor="order-form-order-number">
              <Box layoutClassName="relative">
                <Input
                  id="order-form-order-number"
                  type="text"
                  value={loadingOrderNumber ? 'Generating...' : orderNumber}
                  disabled
                  readOnly
                  leftIcon={<Hash />}
                  leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
                  backgroundClassName="bg-slate-100 dark:bg-slate-700/50"
                  textClassName="font-mono text-slate-500 dark:text-slate-400"
                  stateClassName="cursor-not-allowed"
                />
                {loadingOrderNumber ? (
                  <Box layoutClassName="absolute right-3 top-2.5">
                    <Spinner size="sm" textClassName="text-primary-500" />
                  </Box>
                ) : null}
              </Box>
            </Field>

            <Checkbox
              checked={isTest}
              onChange={(e) => setIsTest(e.target.checked)}
              label="Đơn hàng test"
            />

            <OrderFormCustomerSection
              customerName={customerName} setCustomerName={setCustomerName}
              phone={phone} setPhone={setPhone}
              address={address} setAddress={setAddress}
              deliveryType={deliveryType}
              setDeliveryType={setDeliveryType}
              shippingCost={shippingCost}
              onShipFeeChange={(fee) => { if (fee != null) setShippingCost(fee); }}
              initialShipInfo={shipInfo ?? undefined}
              onShipInfoChange={setShipInfo}
            />
            <Box layoutClassName="grid grid-cols-1 gap-4 md:grid-cols-2 min-w-0">
              <Field label="Ngày nhận hàng" htmlFor="order-form-delivery-date" required className="min-w-0 overflow-hidden">
                <Input
                  id="order-form-delivery-date"
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  leftIcon={<Calendar />}
                  leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
                />
              </Field>
              <Field
                htmlFor="order-form-delivery-time"
                className="min-w-0 overflow-hidden"
                label={
                  <Box layoutClassName="flex w-full items-center justify-between">
                    <span>Giờ nhận (tùy chọn)</span>
                    <Checkbox
                      checked={isDeliveryTimeEnabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsDeliveryTimeEnabled(checked);
                        if (checked && !deliveryTime) {
                          const now = new Date();
                          const hh = String(now.getHours()).padStart(2, '0');
                          const mm = String(now.getMinutes()).padStart(2, '0');
                          setDeliveryTime(`${hh}:${mm}`);
                        }
                      }}
                      label="Thêm"
                      containerClassName="text-sm text-slate-600 dark:text-slate-400"
                    />
                  </Box>
                }
              >
                <Box
                  layoutClassName="transition-all"
                  stateClassName={isDeliveryTimeEnabled ? 'opacity-100' : 'pointer-events-none opacity-50'}
                >
                  <Input
                    id="order-form-delivery-time"
                    type="time"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    disabled={!isDeliveryTimeEnabled}
                    leftIcon={<Clock />}
                    leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
                  />
                </Box>
              </Field>
            </Box>
            <hr className="border-slate-100 dark:border-slate-700" />

            <OrderFormItemsSection
              items={items}
              onAddItem={handleAddItem}
              onAddItemWithProduct={handleAddItemWithProduct}
              onDecrementProduct={handleDecrementProduct}
              onRemoveItem={handleRemoveItem}
              onUpdateItem={handleUpdateItem}
              shippingCost={shippingCost}
              setShippingCost={setShippingCost}
              total={total}
              products={products}
              recentlyAddedId={recentlyAddedId}
            />

            <hr className="border-slate-100 dark:border-slate-700" />

            <OrderFormDecorationSection
              materials={materials}
              decorations={decorations}
              onChange={setDecorations}
            />

            <hr className="border-slate-100 dark:border-slate-700" />

            {/* ─── Khuyến mãi ─── */}
            <Box layoutClassName="space-y-2">
              <Box layoutClassName="flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-primary-500" />
                <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-800 dark:text-slate-200">
                  Khuyến mãi
                </Typography>
              </Box>

              {campaigns.length > 0 ? (
                <Box layoutClassName="space-y-1">
                  <Typography as="span" size="xs" textClassName="text-slate-500 dark:text-slate-400">
                    Chiến dịch đang chạy — chọn để áp:
                  </Typography>
                  <Box layoutClassName="flex flex-wrap gap-1.5">
                    {campaigns.map((c) => {
                      const on = selectedPromoIds.includes(c.id);
                      return (
                        <Button
                          key={c.id}
                          type="button"
                          size="sm"
                          variant={on ? 'primary' : 'secondary'}
                          onClick={() =>
                            setSelectedPromoIds((prev) =>
                              on ? prev.filter((x) => x !== c.id) : [...prev, c.id],
                            )
                          }
                        >
                          {on ? '✓ ' : ''}{c.name}
                        </Button>
                      );
                    })}
                  </Box>
                </Box>
              ) : (
                <EmptyState
                  icon={<Megaphone className="h-6 w-6" />}
                  title="Không có chiến dịch nào đang chạy."
                  layoutClassName="!min-h-0"
                />
              )}

              <Box layoutClassName="flex items-center gap-2">
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Hoặc nhập mã giảm giá"
                  containerClassName="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={loadingPromo}
                  onClick={handlePreviewPromo}
                  leftIcon={loadingPromo ? <Spinner size="sm" /> : <Tag className="h-4 w-4" />}
                >
                  Áp dụng
                </Button>
              </Box>
              {promoPreview && promoPreview.discountAmount > 0 && (
                <Box layoutClassName="space-y-0.5 rounded-lg p-2" backgroundClassName="bg-emerald-50 dark:bg-emerald-900/20">
                  {(promoPreview.appliedPromotions ?? []).map((ap) => (
                    <Box key={ap.promotionId} layoutClassName="flex items-center justify-between gap-2">
                      <Typography as="span" size="xs" textClassName="text-emerald-800 dark:text-emerald-300">• {ap.name}</Typography>
                      <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-emerald-800 dark:text-emerald-300">−{formatVND(ap.amount)}</Typography>
                    </Box>
                  ))}
                  <Box layoutClassName="flex items-center justify-between gap-2 border-t border-emerald-200 pt-1 dark:border-emerald-800">
                    <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-emerald-900 dark:text-emerald-200">Tổng giảm</Typography>
                    <Typography as="span" size="xs" layoutClassName="font-bold" textClassName="text-emerald-900 dark:text-emerald-200">−{formatVND(promoPreview.discountAmount)}</Typography>
                  </Box>
                </Box>
              )}
              {promoPreview && (promoPreview.giftItems?.length ?? 0) > 0 && (
                <Box layoutClassName="space-y-0.5 rounded-lg p-2" backgroundClassName="bg-amber-50 dark:bg-amber-900/20">
                  <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-amber-800 dark:text-amber-300">🎁 Quà tặng kèm</Typography>
                  {(promoPreview.giftItems ?? []).map((g) => (
                    <Typography key={g.productId} as="p" size="xs" textClassName="text-amber-800 dark:text-amber-300">• {g.name} × {g.quantity}</Typography>
                  ))}
                </Box>
              )}
              {promoPreview?.errors?.map((er, i) => (
                <Typography key={i} as="p" size="xs" variant="danger">✗ {er}</Typography>
              ))}
            </Box>

            <hr className="border-slate-100 dark:border-slate-700" />
            <OrderFormStatusSection
              status={status}
              setStatus={setStatus}
              paymentStatus={paymentStatus}
              setPaymentStatus={setPaymentStatus}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              note={note}
              setNote={setNote}
              total={total}
              orderNumber={orderNumber}
            />
          </Box>
        </form>
      </BaseSlidePanel>

      <CreateCustomerModal
        isOpen={showCreateCustomerModal}
        onClose={() => {
          setShowCreateCustomerModal(false);
          setPendingOrderData(null);
          setIsSubmitting(false);
        }}
        onSave={handleCreateCustomer}
        phone={phone}
        customerName={customerName}
      />
    </>
  );
};


export default OrderForm;
