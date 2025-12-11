import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Hash, Loader2 } from 'lucide-react';
import { Order, OrderStatus, PaymentStatus, PaymentMethod, ProductType } from '../../../types/index';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getNextOrderNumber } from '../../../services/orderService';
import OrderFormCustomerSection from './OrderFormCustomerSection';
import OrderFormItemsSection from './OrderFormItemsSection';
import OrderFormStatusSection from './OrderFormStatusSection';
import { DEFAULT_PRICES } from '../../../constants/index';

interface OrderFormProps {
  initialData?: Order | null;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export interface FormItem {
  internalId: string;
  productType: ProductType;
  customProduct: string;
  quantity: number;
  unitPrice: number;
}

const PRODUCT_TYPES = [ProductType.FAMILY, ProductType.FRIENDSHIP];

const OrderForm: React.FC<OrderFormProps> = ({ initialData, onSave, onCancel }) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orderNumber, setOrderNumber] = useState('');
  const [loadingOrderNumber, setLoadingOrderNumber] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // New: Multiple Items State
  const [items, setItems] = useState<FormItem[]>([]);

  const [shippingCost, setShippingCost] = useState(0);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.UNPAID);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);

  // Initialize Data
  useEffect(() => {
    if (initialData) {
      setOrderNumber(initialData.orderNumber || 'N/A');
      setCustomerName(initialData.customer.name);
      setPhone(initialData.customer.phone);
      setAddress(initialData.customer.address);
      setNote(initialData.notes || '');
      setStatus(initialData.status);
      setPaymentStatus(initialData.paymentStatus || PaymentStatus.UNPAID);
      setPaymentMethod(initialData.paymentMethod || PaymentMethod.CASH);
      setShippingCost(initialData.shippingCost || 0);
      
      if (initialData.items && initialData.items.length > 0) {
        const loadedItems = initialData.items.map((item, index) => {
           let type = ProductType.CUSTOM;
           let customName = item.productName;

           // Try to match ProductType
           const normalizedType = item.productName.toLowerCase();
           if (normalizedType.includes('family') || normalizedType.includes('gia đình')) {
             type = ProductType.FAMILY;
             customName = '';
           } else if (normalizedType.includes('friend') || normalizedType.includes('tình bạn')) {
             type = ProductType.FRIENDSHIP;
             customName = '';
           }

           return {
             internalId: `existing-${index}-${Date.now()}`,
             productType: type,
             customProduct: customName,
             quantity: item.quantity,
             unitPrice: item.price
           };
        });
        setItems(loadedItems);
      } else {
        // Fallback for empty items array (shouldn't happen)
        setItems([{
           internalId: `new-0`,
           productType: ProductType.FAMILY,
           customProduct: '',
           quantity: 5,
           unitPrice: DEFAULT_PRICES[ProductType.FAMILY]
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
      setShippingCost(0);
      setStatus(OrderStatus.PENDING);
      setPaymentStatus(PaymentStatus.UNPAID);
      setPaymentMethod(PaymentMethod.CASH);
      
      setItems([{
         internalId: `new-${Date.now()}`,
         productType: ProductType.FAMILY,
         customProduct: '',
         quantity: 5,
         unitPrice: DEFAULT_PRICES[ProductType.FAMILY]
      }]);
    }
  }, [initialData]);

  const handleAddItem = () => {
    setItems([...items, {
      internalId: `new-${Date.now()}`,
      productType: ProductType.FAMILY,
      customProduct: '',
      quantity: 5,
      unitPrice: DEFAULT_PRICES[ProductType.FAMILY]
    }]);
  };

  const handleRemoveItem = (internalId: string) => {
    setItems(items.filter(i => i.internalId !== internalId));
  };

  const handleUpdateItem = (internalId: string, field: keyof FormItem, value: any) => {
    setItems(items.map(item => {
      if (item.internalId === internalId) {
        const updated = { ...item, [field]: value };
        
        // Auto-update price/qty defaults if product type changes
        if (field === 'productType') {
           if (value === ProductType.FAMILY) {
             updated.quantity = 5;
             updated.unitPrice = DEFAULT_PRICES[ProductType.FAMILY];
             updated.customProduct = '';
           } else if (value === ProductType.FRIENDSHIP) {
             updated.quantity = 3;
             updated.unitPrice = DEFAULT_PRICES[ProductType.FRIENDSHIP];
             updated.customProduct = '';
           } else if (value === ProductType.CUSTOM) {
             updated.quantity = 1;
             updated.unitPrice = 0;
             updated.customProduct = '';
           }
        }
        return updated;
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
         const finalProductName = item.productType === ProductType.CUSTOM ? item.customProduct : item.productType;
         if (!finalProductName.trim()) throw new Error("Product name is required for all items");
         
         return {
           productName: finalProductName,
           quantity: Number(item.quantity),
           price: Number(item.unitPrice)
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
        notes: note,
        status: status,
        paymentStatus: paymentStatus,
        paymentMethod: paymentMethod
      };

      await onSave(formData);
    } catch (err: any) {
      setError(err.message || "Failed to save order");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={onCancel}></div>
      <div className="absolute inset-y-0 right-0 max-w-xl w-full flex pointer-events-none">
        <div className="w-full h-full bg-white dark:bg-slate-800 shadow-2xl flex flex-col pointer-events-auto animate-slide-in-right">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {initialData ? t('form.editTitle') : t('form.createTitle')}
            </h2>
            <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
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
              productTypes={PRODUCT_TYPES}
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
              onClick={onCancel}
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