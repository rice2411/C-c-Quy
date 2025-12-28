import React from 'react';
import { StickyNote, CreditCard, QrCode, Copy, Wallet } from 'lucide-react';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface OrderStatusSectionProps {
  status: OrderStatus;
  setStatus: (val: OrderStatus) => void;
  paymentStatus: PaymentStatus;
  setPaymentStatus: (val: PaymentStatus) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (val: PaymentMethod) => void;
  note: string;
  setNote: (val: string) => void;
  total: number;
  customerName: string;
  orderNumber: string;
}

const OrderFormStatusSection: React.FC<OrderStatusSectionProps> = ({
  status, setStatus,
  paymentStatus, setPaymentStatus,
  paymentMethod, setPaymentMethod,
  note, setNote,
  total,
  customerName,
  orderNumber
}) => {
  const { t } = useLanguage();

  // Construct SePay URL
  // Use order number for description
  const description = `${orderNumber}`;
  const qrUrl = `https://qr.sepay.vn/img?acc=96247HTTH1308&bank=BIDV&amount=${Math.round(total)}&des=${encodeURIComponent(description)}&template=compact`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast here, but simple copy is fine for now
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('form.status')}</label>
            <select 
              value={status}
              onChange={e => setStatus(e.target.value as OrderStatus)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
            >
              {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
         </div>

         <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('detail.payment')}</label>
            <div className="relative">
                <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select 
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
         </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('paymentMethod.label')}</label>
        <div className="relative">
            <Wallet className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select 
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value={PaymentMethod.CASH}>{t('paymentMethod.cash')}</option>
              <option value={PaymentMethod.BANKING}>{t('paymentMethod.banking')}</option>
            </select>
        </div>
      </div>
      
      <div>
         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('form.note')}</label>
         <div className="relative">
            <StickyNote className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <textarea 
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none resize-none"
              placeholder="Special requests, delivery instructions..."
            />
         </div>
      </div>

      {/* Payment QR Section - Only if Banking selected and Amount > 0 */}
      {total > 0 && paymentMethod === PaymentMethod.BANKING && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center sm:items-start animate-fade-in">
           <div className="shrink-0 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
              <img 
                src={qrUrl} 
                alt="Payment QR" 
                className="w-32 h-32 object-contain"
              />
           </div>
           
           <div className="flex-1 space-y-2 w-full text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-blue-800 dark:text-blue-300 font-semibold">
                 <QrCode className="w-4 h-4" />
                 <span>{t('qr.title')}</span>
              </div>
              
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                 <div className="flex justify-between sm:justify-start sm:gap-4 items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 uppercase font-medium min-w-[60px]">{t('qr.bank')}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">BIDV</span>
                 </div>
                 <div className="flex justify-between sm:justify-start sm:gap-4 items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 group cursor-pointer" onClick={() => copyToClipboard('96247HTTH1308')}>
                    <span className="text-xs text-slate-500 uppercase font-medium min-w-[60px]">{t('qr.account')}</span>
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">96247HTTH1308</span>
                       <Copy className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                    </div>
                 </div>
                 <div className="flex justify-between sm:justify-start sm:gap-4 items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 uppercase font-medium min-w-[60px]">{t('qr.accountName')}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">TON THAT ANH MINH</span>
                 </div>
                 <div className="flex justify-between sm:justify-start sm:gap-4 items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 uppercase font-medium min-w-[60px]">{t('qr.amount')}</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                    </span>
                 </div>
                 <div className="flex justify-between sm:justify-start sm:gap-4 items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 uppercase font-medium min-w-[60px]">{t('qr.content')}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 break-all">
                      {description}
                    </span>
                 </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                 {t('qr.instruction')}
              </p>
           </div>
        </div>
      )}
    </div>
  );
};

export default OrderFormStatusSection;