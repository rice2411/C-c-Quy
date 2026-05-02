import React, { useEffect, useState } from 'react';
import { AlertCircle, Calendar, Clock, Hash, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { collaboratorHasZaloGroup } from '@/services/configurationService';
import { UserRole } from '@/types/user';
import { useCustomers } from '@/contexts/CustomerContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getNextOrderNumber } from '@/services/orderService';
import { fetchProducts } from '@/services/productService';
import { getUserByUid } from '@/services/userService';
import { Order, OrderStatus, PaymentMethod, PaymentStatus, Product } from '@/types/index';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Field from '@/components/ui/Field';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Spinner from '@/components/ui/Spinner';
import CreateCustomerModal from '@/pages/Orders/components/modals/CreateCustomerModal';
import OrderFormCustomerSection from '@/pages/Orders/components/OrderFormCustomerSection';
import OrderFormItemsSection from '@/pages/Orders/components/OrderFormItemsSection';
import OrderFormStatusSection from '@/pages/Orders/components/OrderFormStatusSection';

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
  const [loadingOrderNumber, setLoadingOrderNumber] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // New: Multiple Items State
  const [items, setItems] = useState<FormItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [shippingCost, setShippingCost] = useState(0);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.UNPAID);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliveryTime, setDeliveryTime] = useState<string>('');
  const [isDeliveryTimeEnabled, setIsDeliveryTimeEnabled] = useState<boolean>(false);

  // Load products from inventory
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (error) {
        console.error('Failed to load products', error);
      }
    };
    loadProducts();
  }, []);

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
      setShippingCost(initialData.shippingCost || 0);
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
          id: `item-${Date.now()}-0`,
          productId: products[0]?.id || '',
          productName: products[0]?.name || '',
          quantity: 1,
          unitPrice: products[0]?.price || 0,
          image: products[0]?.image
        }]);
      }
    } else {
      const fetchNextId = async () => {
        setLoadingOrderNumber(true);
        try {
          const nextId = await getNextOrderNumber();
          setOrderNumber(nextId);
        } catch (e) {
          console.error("Failed to fetch next ID");
        } finally {
          setLoadingOrderNumber(false);
        }
      };
      fetchNextId();
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
      setItems([]);
    }
  }, [initialData, isOpen]);

  // Default to one item when opening for new order and products are loaded
  useEffect(() => {
    if (isOpen && !initialData && products.length > 0 && items.length === 0) {
      setItems([{
        id: `item-${Date.now()}-0`,
        productId: products[0]?.id || '',
        productName: products[0]?.name || '',
        quantity: 1,
        unitPrice: products[0]?.price || 0,
        image: products[0]?.image
      }]);
    }
  }, [isOpen, initialData, products, items.length]);

  const handleAddItem = () => {
    const first = products[0];
    setItems([...items, {
      id: `item-${Date.now()}-${items.length}`,
      productId: first?.id || '',
      productName: first?.name || '',
      quantity: 1,
      unitPrice: first?.price || 0,
      image: first?.image
    }]);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(i => i.id !== itemId));
  };

  const handleUpdateItem = (itemId: string, field: keyof FormItem, value: any) => {
    setItems(items.map(item => {
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

  // Calculate total: Sum(Item Price * Qty) + Shipping
  const calculateTotal = () => {
      const itemsTotal = items.reduce((sum, item) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0);
      return itemsTotal + Number(shippingCost);
  };

  const total = calculateTotal();


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

      const formData = {
        id: initialData?.id,
        orderNumber: orderNumber,
        customer: {
          name: customerName,
          phone: phone,
          address: address,
        },
        items: finalItems,
        shippingCost: Number(shippingCost),
        total: total,
        note: note,
        deliveryDate: deliveryDate || undefined,
        deliveryTime: isDeliveryTimeEnabled && deliveryTime ? deliveryTime : undefined,
        status: status,
        paymentStatus: paymentStatus,
        paymentMethod: paymentMethod,
        createdBy: currentUser.uid
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
        backgroundClassName="bg-orange-600 dark:bg-orange-500"
        hoverClassName="hover:bg-orange-700 dark:hover:bg-orange-600"
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
        <form onSubmit={handleSubmit}>
          <Box layoutClassName="space-y-6 p-6">
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
                    <Spinner size="sm" textClassName="text-orange-500" />
                  </Box>
                ) : null}
              </Box>
            </Field>

            <OrderFormCustomerSection 
              customerName={customerName} setCustomerName={setCustomerName}
              phone={phone} setPhone={setPhone}
              address={address} setAddress={setAddress}
            />
            <Box layoutClassName="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Ngày nhận hàng" htmlFor="order-form-delivery-date">
                <Input
                  id="order-form-delivery-date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  leftIcon={<Calendar />}
                  leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
                />
              </Field>
              <Box layoutClassName="space-y-2">
                <Box layoutClassName="flex items-center justify-between">
                  <Label htmlFor="order-form-delivery-time" className="mb-0">
                    Giờ nhận (tùy chọn)
                  </Label>
                  <Checkbox
                    checked={isDeliveryTimeEnabled}
                    onChange={(e) => setIsDeliveryTimeEnabled(e.target.checked)}
                    label="Thêm"
                    containerClassName="text-sm text-slate-600 dark:text-slate-400"
                  />
                </Box>
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
              </Box>
            </Box>
            <hr className="border-slate-100 dark:border-slate-700" />

            <OrderFormItemsSection 
              items={items}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onUpdateItem={handleUpdateItem}
              shippingCost={shippingCost}
              setShippingCost={setShippingCost}
              total={total}
              products={products}
            />

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