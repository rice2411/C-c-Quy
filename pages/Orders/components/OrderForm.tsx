import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Hash, Loader2, Calendar, Clock } from 'lucide-react';
import { Order, OrderStatus, PaymentStatus, PaymentMethod, Product } from '@/types/index';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUserByUid } from '@/services/userService';
import { getNextOrderNumber } from '@/services/orderService';
import { fetchProducts } from '@/services/productService';
import OrderFormCustomerSection from './OrderFormCustomerSection';
import OrderFormItemsSection from './OrderFormItemsSection';
import OrderFormStatusSection from './OrderFormStatusSection';

interface OrderFormProps {
  initialData?: Order | null;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export interface FormItem {
  productId: string;
  productName: string;
  image?: string;
  quantity: number;
  unitPrice: number;
}
const OrderForm: React.FC<OrderFormProps> = ({ initialData, onSave, onCancel }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

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

  // Initialize Data
  useEffect(() => {
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
        const loadedItems = initialData.items.map((item, index) => {
           return {
             productId: item.id,
             productName: item.name,
             quantity: item.quantity,
             unitPrice: item.price,
             image: item.image
           };
        });
        setItems(loadedItems);
      } else {
        setItems([{
           productId: products[0]?.id,
           productName: products[0]?.name || '',
           quantity: 1,
           unitPrice: products[0]?.price || 0,
           image: products[0]?.image
        }]);
      }
    } else {
      // Create New Order
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
      
      setItems([{
         productId: products[0]?.id,
         productName: products[0]?.name || '',
         quantity: 1,
         unitPrice: products[0]?.price || 0,
         image: products[0]?.image
      }]);
    }
  }, [initialData, products]);

  const handleAddItem = () => {
    const first = products[0];
    setItems([...items, {
      productId: first?.id,
      productName: first?.name || '',
      quantity: 1,
      unitPrice: first?.price || 0,
      image: first?.image
    }]);
  };

  const handleRemoveItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const handleUpdateItem = (productId: string, field: keyof FormItem, value: any) => {
    setItems(items.map(item => {
      if (item.productId === productId) {
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
            productId: undefined,
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

  const handleCancel = () => {
    setIsClosing(true);
    setTimeout(() => {
      onCancel();
    }, 280);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!customerName.trim()) {
        throw new Error("Customer name is required");
      }
      
      if (items.length === 0) {
        throw new Error("At least one product is required");
      }
      // Prepare items payload
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
        orderNumber: orderNumber, // Pass the calculated order number
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
        createdBy: currentUser.uid // Thêm thông tin người tạo
      };

      await onSave(formData);
    } catch (err: any) {
      setError(err.message || "Failed to save order");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div 
        className={`absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isClosing ? 'opacity-0' : 'opacity-100'}`} 
        onClick={handleCancel}
      ></div>
      <div className="absolute inset-y-0 right-0 max-w-xl w-full flex pointer-events-none">
        <div className={`w-full h-full bg-white dark:bg-slate-800 shadow-2xl flex flex-col pointer-events-auto transition-colors duration-200 ${isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {initialData ? t('form.editTitle') : t('form.createTitle')}
            </h2>
            <button onClick={handleCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            {/* Order Number Read-Only Field */}
            <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('detail.orderId')}</label>
               <div className="relative">
                  <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={loadingOrderNumber ? 'Generating...' : orderNumber}
                    disabled
                    readOnly
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-500 dark:text-slate-400 font-mono cursor-not-allowed"
                  />
                  {loadingOrderNumber && (
                    <div className="absolute right-3 top-2.5">
                      <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                    </div>
                  )}
               </div>
            </div>

            <OrderFormCustomerSection 
              customerName={customerName} setCustomerName={setCustomerName}
              phone={phone} setPhone={setPhone}
              address={address} setAddress={setAddress}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Ngày nhận hàng</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Giờ nhận (tùy chọn)</label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={isDeliveryTimeEnabled}
                      onChange={(e) => setIsDeliveryTimeEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    Thêm
                  </label>
                </div>
                <div className={`transition-all ${isDeliveryTimeEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="time"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      disabled={!isDeliveryTimeEnabled}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
            <hr className="border-slate-100 dark:border-slate-700" />
            
            {/* Items Section Handling Multiple Products */}
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
              status={status} setStatus={setStatus}
              paymentStatus={paymentStatus} setPaymentStatus={setPaymentStatus}
              paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
              note={note} setNote={setNote}
              total={total}
              customerName={customerName}
              orderNumber={orderNumber}
            />
          </form>
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {t('form.cancel')}
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || loadingOrderNumber}
              className="px-6 py-2 bg-orange-600 dark:bg-orange-500 rounded-lg text-sm font-medium text-white hover:bg-orange-700 dark:hover:bg-orange-600 shadow-sm flex items-center gap-2 disabled:opacity-70 transition-colors"
            >
              {isSubmitting ? t('form.saving') : (
                <>
                  <Save className="w-4 h-4" /> {t('form.save')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;