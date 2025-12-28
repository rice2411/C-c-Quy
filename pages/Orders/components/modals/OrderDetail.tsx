import React, { useState } from 'react';
import { X, MapPin, Phone, Mail, Truck, CreditCard, Sparkles, AlertTriangle, FileText, QrCode, Copy, Receipt, Wallet, StickyNote, User } from 'lucide-react';
import { Order, OrderItem, PaymentMethod, OrderStatus, PaymentStatus } from '@/types';
import { STATUS_COLORS } from '@/constant/order'; 
import { generateOrderAnalysis } from '@/services/geminiService';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatVND } from '@/utils/currencyUtil';
import { generateQRCodeImage, getOrderTotal } from '@/utils/orderUtils';
import BaseSlidePanel from '@/components/BaseSlidePanel';
interface OrderDetailProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onEdit?: () => void;
  onUpdateOrder?: (id: string, data: Partial<Order>) => Promise<void>;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ isOpen, order, onClose, onEdit, onUpdateOrder }) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'details' | 'ai'>('details');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<'email' | 'risk' | 'summary' | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [localOrder, setLocalOrder] = useState(order);

  React.useEffect(() => {
    setLocalOrder(order);
  }, [order]);

  const currentOrder = localOrder || order;
  if (!currentOrder) return null;

  const handleAiAction = async (type: 'email' | 'risk' | 'summary') => {
    setSelectedPrompt(type);
    setLoadingAi(true);
    const response = await generateOrderAnalysis(currentOrder, type, language);
    setAiResponse(response);
    setLoadingAi(false);
  };


  const calculateLineItemTotal = (item: OrderItem) => {
    return item.price * item.quantity;
  };

  const shippingCost = currentOrder.shippingCost || 0;
  
  const subtotal = currentOrder.items.reduce((sum, item) => sum + calculateLineItemTotal(item), 0);
  
  const finalTotal = getOrderTotal(currentOrder);

  const description = `${currentOrder.orderNumber}`;
  const qrUrl =generateQRCodeImage(description, finalTotal);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleUpdateField = async (patch: Partial<Order>, setLoading: (v: boolean) => void) => {
    if (!currentOrder?.id || !onUpdateOrder) return;
    setLoading(true);
    try {
      await onUpdateOrder(currentOrder.id, { ...currentOrder, ...patch });
      setLocalOrder(prev => prev ? { ...prev, ...patch } : prev);
      setIsStatusOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const headerContent = (
    <div className="flex items-start justify-between w-full">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{currentOrder.orderNumber || `Order #${currentOrder.id}`}</h2>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[currentOrder.status]}`}>
            {currentOrder.status}
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('detail.placedOn')} {new Date(currentOrder.createdAt.toDate()).toLocaleString()}
        </p>
        {currentOrder.deliveryDate && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ngày nhận hàng: {new Date(currentOrder.deliveryDate).toLocaleDateString()}
            {currentOrder.deliveryTime && ` • ${currentOrder.deliveryTime}`}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="p-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );

  const footer = (
    <div className="flex justify-end gap-3">
      <button
        onClick={onClose}
        className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        {t('detail.close')}
      </button>
      {onEdit && (
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-orange-600 dark:bg-orange-500 rounded-lg text-sm font-medium text-white hover:bg-orange-700 dark:hover:bg-orange-600 shadow-sm shadow-orange-200 dark:shadow-none transition-colors"
        >
          {t('detail.edit')}
        </button>
      )}
    </div>
  );

  return (
    <BaseSlidePanel
      isOpen={isOpen && !!order}
      onClose={onClose}
      maxWidth="2xl"
      headerContent={headerContent}
      footer={footer}
    >
      <div className="flex flex-col h-full">
        <div className="border-b border-slate-100 dark:border-slate-700 px-6 flex space-x-6 bg-white dark:bg-slate-800 transition-colors">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t('detail.tabDetails')}
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'ai'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {t('detail.tabAi')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-6 transition-colors">
            {activeTab === 'details' ? (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">{t('detail.customer')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {currentOrder.customer.name && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-300">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="text-sm">
                            <p className="font-medium text-slate-900 dark:text-white">{t('detail.customerName')}</p>
                            <p className="text-slate-600 dark:text-slate-300">{currentOrder.customer.name}</p>
                          </div>
                        </div>
                      )}
                      {currentOrder.customer.email && (
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-300">
                             <Mail className="w-4 h-4" />
                           </div>
                           <div className="text-sm">
                             <p className="font-medium text-slate-900 dark:text-white">{t('detail.email')}</p>
                             <span className="text-slate-600 dark:text-slate-300">{currentOrder.customer.email}</span>
                           </div>
                        </div>
                      )}
                      {currentOrder.customer.phone && (
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-300">
                             <Phone className="w-4 h-4" />
                           </div>
                           <div className="text-sm">
                             <p className="font-medium text-slate-900 dark:text-white">{t('detail.phone')}</p>
                             <span className="text-slate-600 dark:text-slate-300">{currentOrder.customer.phone}</span>
                           </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-300">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-slate-900 dark:text-white">{t('detail.shippingAddress')}</p>
                        <p className="text-slate-500 dark:text-slate-400">{currentOrder.customer.address || 'No address provided'}</p>
                        {currentOrder.customer.city && <p className="text-slate-500 dark:text-slate-400">{currentOrder.customer.city}, {currentOrder.customer.country}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note Section - Separate card */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                    {t('detail.note')}
                  </h3>
                  {currentOrder.note ? (
                    <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 rounded-lg p-4">
                      <p className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                        {currentOrder.note}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 rounded-lg p-4">
                      <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                        {t('detail.noNote') || 'No note provided'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                   <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">{t('detail.items')}</h3>
                   <div className="space-y-4">
                     {currentOrder.items.map((item) => (
                       <div key={item.id} className="flex items-center gap-4 py-2">
                         <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-slate-100 dark:bg-slate-700" />
                         <div className="flex-1">
                           <h4 className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</h4>
                           <p className="text-xs text-slate-500 dark:text-slate-400">ID: {item.id}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-sm font-medium text-slate-900 dark:text-white">{formatVND(calculateLineItemTotal(item))}</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400">Qty: {item.quantity}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                   
                   <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
                     <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
                       <span>{t('detail.subtotal')}</span>
                       <span>{formatVND(subtotal)}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
                       <span>{t('detail.shipping')}</span>
                       <span>{formatVND(shippingCost)}</span>
                     </div>
                     <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-700">
                       <span className="font-medium text-slate-900 dark:text-white">{t('detail.total')}</span>
                       <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatVND(finalTotal)}</span>
                     </div>
                   </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                   <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">{t('detail.fulfillment')}</h3>
                   <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <Truck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-sm text-slate-600 dark:text-slate-300">Order Number</span>
                        </div>
                        <span className="text-sm font-mono font-medium text-slate-900 dark:text-white">{currentOrder.orderNumber || t('detail.notAssigned')}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <StickyNote className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-sm text-slate-600 dark:text-slate-300">{t('orders.tableStatus')}</span>
                        </div>
                        <div className="relative flex items-center gap-2">
                          <button
                            type="button"
                            disabled={updatingStatus}
                            onClick={() => setIsStatusOpen((v) => !v)}
                            className="w-full b text-left px-3 py-2 text-xs font-semibold flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <span
                              className={`${updatingStatus ? 'opacity-60 cursor-not-allowed' : ''} px-2 w-full text-center py-0.5 rounded-full text-[10px] border border-transparent ${STATUS_COLORS[currentOrder.status]}`}
                            >
                            { t(`orders.statusLabels.${currentOrder.status}`)}
                            </span>
                            <span className={`${updatingStatus ? 'opacity-60 cursor-not-allowed' : ''} text-[10px] text-slate-700/70 dark:text-slate-200/70 ml-2`}>▼</span>
                          </button>
                          {isStatusOpen && !updatingStatus && (
                            <div className="absolute right-0 top-full mt-2  bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20">
                              <div className="py-2 max-h-64 overflow-y-auto">
                                {Object.values(OrderStatus).map((status) => (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => {
                                      setIsStatusOpen(false);
                                      handleUpdateField({ status }, setUpdatingStatus);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                                      currentOrder.status === status ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'
                                    }`}
                                  >
                                    <span className={`px-2 w-full text-center py-0.5 rounded-full text-[10px] border border-transparent ${STATUS_COLORS[status]}`}>
                                      {t(`orders.statusLabels.${status}`)}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-sm text-slate-600 dark:text-slate-300">{t('detail.payment')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {[PaymentStatus.PAID, PaymentStatus.UNPAID].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleUpdateField({ paymentStatus: status }, setUpdatingPayment)}
                              disabled={updatingPayment}
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase border transition-all ${
                                currentOrder.paymentStatus === status
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                              } ${updatingPayment ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <Wallet className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-sm text-slate-600 dark:text-slate-300">{t('detail.paymentMethod')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {[PaymentMethod.BANKING, PaymentMethod.CASH].map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => handleUpdateField({ paymentMethod: method }, setUpdatingPayment)}
                              disabled={updatingPayment}
                              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                                currentOrder.paymentMethod === method
                                  ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                                  : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                              } ${updatingPayment ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              {method === PaymentMethod.BANKING ? t('paymentMethod.banking') : t('paymentMethod.cash')}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <Receipt className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-sm text-slate-600 dark:text-slate-300">{t('detail.transactionNumber')}</span>
                        </div>
                        <span className="text-sm font-mono font-medium text-slate-900 dark:text-white">
                            {currentOrder.sepayId ? `#${currentOrder.sepayId}` : t('detail.notAssigned')}
                        </span>
                      </div>
                   </div>
                </div>

                {/* Payment QR Section - Show ONLY if Banking is selected */}
                {currentOrder.paymentMethod === PaymentMethod.BANKING && (
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors animate-fade-in">
                     <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">{t('qr.sectionTitle')}</h3>
                     <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center sm:items-start">
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
                                    {formatVND(finalTotal)}
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
                  </div>
                )}

              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="bg-gradient-to-r from-orange-500 to-rose-600 dark:from-orange-700 dark:to-rose-800 rounded-xl p-6 text-white mb-6 shadow-md transition-colors">
                   <div className="flex items-center gap-3 mb-2">
                     <Sparkles className="w-6 h-6 text-yellow-300" />
                     <h3 className="font-bold text-lg">Gemini Intelligence</h3>
                   </div>
                   <p className="text-orange-50 dark:text-orange-100 text-sm">
                     {t('detail.aiIntro')}
                   </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <button 
                    onClick={() => handleAiAction('email')}
                    className={`p-4 rounded-xl border text-left transition-all ${selectedPrompt === 'email' ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 ring-2 ring-orange-500 ring-opacity-50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md'}`}
                  >
                    <Mail className="w-5 h-5 text-orange-500 dark:text-orange-400 mb-2" />
                    <span className="block font-medium text-slate-900 dark:text-white text-sm">{t('detail.draftEmail')}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Apology or update for {currentOrder.customer.name.split(' ')[0]}</span>
                  </button>

                  <button 
                     onClick={() => handleAiAction('risk')}
                     className={`p-4 rounded-xl border text-left transition-all ${selectedPrompt === 'risk' ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 ring-2 ring-orange-500 ring-opacity-50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md'}`}
                  >
                    <AlertTriangle className="w-5 h-5 text-orange-500 dark:text-orange-400 mb-2" />
                    <span className="block font-medium text-slate-900 dark:text-white text-sm">{t('detail.riskCheck')}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Analyze fraud & fulfillment risks</span>
                  </button>

                  <button 
                     onClick={() => handleAiAction('summary')}
                     className={`p-4 rounded-xl border text-left transition-all ${selectedPrompt === 'summary' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 ring-2 ring-blue-500 ring-opacity-50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'}`}
                  >
                    <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400 mb-2" />
                    <span className="block font-medium text-slate-900 dark:text-white text-sm">{t('detail.summarize')}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Internal briefing for ops team</span>
                  </button>
                </div>

                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm overflow-hidden flex flex-col transition-colors">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                    {loadingAi ? 'Generating Analysis...' : 'AI Output'}
                  </h4>
                  
                  {loadingAi ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-70">
                      <div className="w-10 h-10 border-4 border-orange-200 dark:border-orange-800 border-t-orange-600 dark:border-t-orange-400 rounded-full animate-spin"></div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('detail.consulting')}</p>
                    </div>
                  ) : aiResponse ? (
                     <div className="flex-1 overflow-y-auto">
                       <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{aiResponse}</p>
                       <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                         <button 
                           onClick={() => navigator.clipboard.writeText(aiResponse)}
                           className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 transition-colors"
                         >
                           {t('detail.copyClipboard')}
                         </button>
                       </div>
                     </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                      Select an action above to generate content.
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
    </BaseSlidePanel>
  );
};

export default OrderDetail;