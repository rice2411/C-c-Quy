import React, { useState, useMemo, useEffect } from 'react';
import { Download, Calendar, Eye, Settings, Check, ChevronDown, ArrowRight, Table as TableIcon, FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import BaseModal from '../../../components/BaseModal';
import { Order } from '../../../types';
import { exportOrdersToExcel, ExportColumn } from '../../../utils/xlsx';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[]; // Receive full order list to handle filtering internally
}

// Define available columns configuration
const AVAILABLE_COLUMNS: ExportColumn[] = [
  { id: 'orderNumber', label: 'Order #', field: (o) => o.orderNumber || o.id },
  { id: 'date', label: 'Date', field: (o) => new Date(o.date).toLocaleDateString('vi-VN') },
  { id: 'customer', label: 'Customer Name', field: (o) => o.customer.name },
  { id: 'phone', label: 'Phone', field: (o) => `'${o.customer.phone}` }, // Add quote to force string in Excel
  { id: 'address', label: 'Address', field: (o) => o.customer.address },
  { id: 'items', label: 'Products', field: (o) => o.items.map(i => `${i.productName} (x${i.quantity})`).join('; ') },
  { id: 'subtotal', label: 'Subtotal', field: (o) => (o.total - (o.shippingCost || 0)) },
  { id: 'shipping', label: 'Shipping', field: (o) => o.shippingCost || 0 },
  { id: 'total', label: 'Total', field: (o) => o.total },
  { id: 'status', label: 'Status', field: (o) => o.status },
  { id: 'payment', label: 'Payment Status', field: (o) => o.paymentStatus },
  { id: 'paymentMethod', label: 'Payment Method', field: (o) => o.paymentMethod || '' },
  { id: 'sepayId', label: 'Transaction ID', field: (o) => o.sepayId || '' },
  { id: 'notes', label: 'Notes', field: (o) => o.notes },
];

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, orders }) => {
  const { t, language } = useLanguage();

  // State: Range Selection
  const [rangeType, setRangeType] = useState<'month' | 'all' | 'custom'>('month');
  
  // Initialize with current month
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');

  // State: Customization
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>(AVAILABLE_COLUMNS.map(c => c.id));
  const [headerColor, setHeaderColor] = useState('#ea580c'); // Default orange

  // State: Preview Tabs
  const [activeSheet, setActiveSheet] = useState<string>('Overall');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRangeType('month');
      // Reset to current month
      const now = new Date();
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(currentMonthStr);
      setStartMonth(currentMonthStr);
      setEndMonth(currentMonthStr);
      setActiveSheet('Overall');
    }
  }, [isOpen]);

  // Generate Month Options from Jan 2025 to Now
  const monthOptions = useMemo(() => {
    const options = [];
    const start = new Date(2025, 0, 1); // Jan 2025
    const now = new Date();
    
    // Safety check
    if (now < start) {
       return [{ 
         value: '2025-01', 
         label: start.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' }) 
       }];
    }

    const current = new Date(start);
    while (current <= now || (current.getMonth() === now.getMonth() && current.getFullYear() === now.getFullYear())) {
       const label = current.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' });
       // Format YYYY-MM
       const value = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
       options.push({ value, label });
       
       // Increment month
       current.setMonth(current.getMonth() + 1);
       
       // Break if we somehow go way past now to prevent infinite loops
       if (current.getFullYear() > now.getFullYear() + 1) break;
    }
    return options.reverse(); // Newest first
  }, [language]);

  // Filter Logic
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (rangeType === 'month' && selectedMonth) {
        const [year, month] = selectedMonth.split('-').map(Number);
        const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
        result = result.filter(o => {
            const d = new Date(o.date);
            return d >= startOfMonth && d <= endOfMonth;
        });
    } else if (rangeType === 'custom' && startMonth && endMonth) {
        const [sYear, sMonth] = startMonth.split('-').map(Number);
        const [eYear, eMonth] = endMonth.split('-').map(Number);
        
        let start = new Date(sYear, sMonth - 1, 1, 0, 0, 0, 0);
        let end = new Date(eYear, eMonth, 0, 23, 59, 59, 999);

        // Auto-swap if start > end
        if (start > end) {
             const tempStart = start;
             start = new Date(eYear, eMonth - 1, 1, 0, 0, 0, 0);
             end = new Date(sYear, sMonth, 0, 23, 59, 59, 999); 
        }

        result = result.filter(o => {
            const d = new Date(o.date);
            return d >= start && d <= end;
        });
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, rangeType, startMonth, endMonth, selectedMonth]);

  // Grouping Logic for Multi-sheet Preview
  const groupedOrders = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    filteredOrders.forEach(o => {
      const d = new Date(o.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(o);
    });
    return groups;
  }, [filteredOrders]);

  const monthKeys = useMemo(() => Object.keys(groupedOrders).sort(), [groupedOrders]);
  const isMultiSheet = monthKeys.length > 1;

  // Reset active sheet logic
  useEffect(() => {
      if (isMultiSheet) {
          setActiveSheet('Overall');
      } else {
          setActiveSheet('Orders');
      }
  }, [isMultiSheet, monthKeys.join(',')]); // Depend on keys string to detect changes

  // Data for "Overall" Sheet
  const overallData = useMemo(() => {
      if (!isMultiSheet) return [];
      return monthKeys.map(month => {
          const monthOrders = groupedOrders[month];
          const revenue = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0);
          const uniqueCustomers = new Set(monthOrders.map(o => o.customer.id)).size;
          return {
            month,
            orders: monthOrders.length,
            revenue,
            customers: uniqueCustomers,
            avg: monthOrders.length ? revenue / monthOrders.length : 0
          };
      });
  }, [isMultiSheet, monthKeys, groupedOrders]);

  // Data for "Current Active Sheet" (Orders List)
  const currentPreviewOrders = useMemo(() => {
      if (!isMultiSheet) return filteredOrders;
      if (activeSheet === 'Overall') return []; // Overall has its own structure
      return groupedOrders[activeSheet] || [];
  }, [isMultiSheet, activeSheet, filteredOrders, groupedOrders]);


  const activeColumns = useMemo(() => {
    return AVAILABLE_COLUMNS.filter(col => selectedColumnIds.includes(col.id));
  }, [selectedColumnIds]);

  const handleToggleColumn = (id: string) => {
    setSelectedColumnIds(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Prevent empty columns
        return prev.filter(c => c !== id);
      }
      return [...prev, id];
    });
  };

  const handleExport = () => {
    exportOrdersToExcel(filteredOrders, activeColumns, headerColor);
    onClose();
  };

  const formatPreviewValue = (val: any) => {
    if (typeof val === 'number') return val.toLocaleString();
    return val;
  };
  
  const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const footerContent = (
    <div className="flex justify-between w-full">
      <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
        {t('orders.exportCancel')}
      </button>
      <button 
        onClick={handleExport}
        disabled={rangeType === 'custom' && (!startMonth || !endMonth)}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4" />
        {t('orders.exportConfirm')}
      </button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Download className="w-5 h-5 text-orange-600" />
          {t('orders.exportTitle')}
        </span>
      }
      footer={footerContent}
      size="xl"
    >
      <div className="flex flex-col gap-6 h-[650px] animate-fade-in">
         {/* Top Section: Settings */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
            
            {/* Left Column: Range & Color */}
            <div className="flex flex-col gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                   <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                     <Calendar className="w-4 h-4" /> Range
                   </h4>
                   <div className="space-y-2">
                      {/* Option 1: Single Month */}
                      <label className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-all ${rangeType === 'month' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 ring-1 ring-orange-500' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
                        <div className="flex items-center">
                            <input type="radio" name="range" value="month" checked={rangeType === 'month'} onChange={() => setRangeType('month')} className="w-4 h-4 text-orange-600 focus:ring-orange-500" />
                            <span className="ml-3 text-sm font-medium text-slate-900 dark:text-white">{t('orders.exportMonth')}</span>
                        </div>
                        {rangeType === 'month' && (
                            <div className="mt-3 relative animate-fade-in w-full">
                                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                 <select 
                                    value={selectedMonth} 
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer shadow-sm"
                                 >
                                    {monthOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                 </select>
                                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                            </div>
                        )}
                      </label>

                      {/* Option 2: All Time */}
                      <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${rangeType === 'all' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 ring-1 ring-orange-500' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
                        <input type="radio" name="range" value="all" checked={rangeType === 'all'} onChange={() => setRangeType('all')} className="w-4 h-4 text-orange-600 focus:ring-orange-500" />
                        <span className="ml-3 text-sm font-medium text-slate-900 dark:text-white">{t('orders.exportAllTime')}</span>
                      </label>

                      {/* Option 3: Custom Range (Month Selection) */}
                      <label className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-all ${rangeType === 'custom' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 ring-1 ring-orange-500' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
                        <div className="flex items-center">
                            <input type="radio" name="range" value="custom" checked={rangeType === 'custom'} onChange={() => setRangeType('custom')} className="w-4 h-4 text-orange-600 focus:ring-orange-500" />
                            <span className="ml-3 text-sm font-medium text-slate-900 dark:text-white">{t('orders.exportCustom')}</span>
                        </div>
                        {rangeType === 'custom' && (
                          <div className="grid grid-cols-2 gap-2 mt-3 animate-fade-in pl-7">
                            <div className="relative">
                               <select 
                                  value={startMonth}
                                  onChange={(e) => setStartMonth(e.target.value)}
                                  className="w-full pl-2 pr-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
                               >
                                  <option value="" disabled>From</option>
                                  {monthOptions.map(opt => (
                                      <option key={`start-${opt.value}`} value={opt.value}>{opt.label}</option>
                                  ))}
                               </select>
                               <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
                            </div>
                            
                            <div className="relative">
                               <select 
                                  value={endMonth}
                                  onChange={(e) => setEndMonth(e.target.value)}
                                  className="w-full pl-2 pr-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
                               >
                                  <option value="" disabled>To</option>
                                  {monthOptions.map(opt => (
                                      <option key={`end-${opt.value}`} value={opt.value}>{opt.label}</option>
                                  ))}
                               </select>
                               <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
                            </div>
                          </div>
                        )}
                      </label>
                   </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                     <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                       <Settings className="w-4 h-4" /> Header Color
                     </h4>
                     <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={headerColor}
                          onChange={(e) => setHeaderColor(e.target.value)}
                          className="h-8 w-12 p-0 border-0 rounded cursor-pointer shadow-sm"
                        />
                     </div>
                </div>
            </div>

            {/* Right Column: Columns */}
            <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col max-h-[400px]">
               <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Columns to Export</h4>
               <div className="overflow-y-auto flex-1 pr-2 grid grid-cols-1 sm:grid-cols-2 gap-2 content-start">
                  {AVAILABLE_COLUMNS.map(col => (
                     <label key={col.id} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer hover:border-orange-400 dark:hover:border-orange-500 transition-all">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{col.label}</span>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ml-2 ${selectedColumnIds.includes(col.id) ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent'}`}>
                           <Check className="w-3 h-3" />
                        </div>
                        <input type="checkbox" checked={selectedColumnIds.includes(col.id)} onChange={() => handleToggleColumn(col.id)} className="hidden" />
                     </label>
                  ))}
               </div>
            </div>
         </div>

         {/* Bottom Section: Preview */}
         <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-2 shrink-0">
               <div className="flex items-center gap-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Live Preview
                    </h4>
                    {isMultiSheet && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                             <FileSpreadsheet className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                             <span className="text-[10px] font-medium text-blue-700 dark:text-blue-300">Multi-Sheet Export</span>
                        </div>
                    )}
               </div>
               <span className="text-xs text-slate-500">{filteredOrders.length} rows to export</span>
            </div>

            {/* Preview Tabs (Visible only if multi-sheet) */}
            {isMultiSheet && (
                <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                        onClick={() => setActiveSheet('Overall')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                            activeSheet === 'Overall' 
                            ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800 shadow-sm' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                    >
                        <TableIcon className="w-3 h-3" />
                        Overall Summary
                    </button>
                    {monthKeys.map(m => (
                        <button
                            key={m}
                            onClick={() => setActiveSheet(m)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors border ${
                                activeSheet === m 
                                ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800 shadow-sm' 
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            )}
            
            <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 relative shadow-sm">
               
               {isMultiSheet && activeSheet === 'Overall' ? (
                   /* OVERALL SUMMARY TABLE */
                   <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr>
                                {['Month', 'Total Orders', 'Total Revenue', 'Total Customers', 'Avg Order Value'].map(header => (
                                     <th 
                                        key={header} 
                                        className="px-4 py-2.5 border-b border-r border-slate-200 dark:border-slate-600 whitespace-nowrap sticky top-0 z-10 font-semibold"
                                        style={{ backgroundColor: headerColor, color: '#ffffff' }}
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                             {overallData.map((row) => (
                                <tr key={row.month} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                   <td className="px-4 py-2.5 border-r border-slate-100 dark:border-slate-700 font-medium text-slate-900 dark:text-white">{row.month}</td>
                                   <td className="px-4 py-2.5 border-r border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">{row.orders}</td>
                                   <td className="px-4 py-2.5 border-r border-slate-100 dark:border-slate-700 font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(row.revenue)}</td>
                                   <td className="px-4 py-2.5 border-r border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">{row.customers}</td>
                                   <td className="px-4 py-2.5 border-r border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">{formatCurrency(row.avg)}</td>
                                </tr>
                             ))}
                             <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold">
                                 <td className="px-4 py-2.5 border-r border-slate-200 dark:border-slate-700">Total</td>
                                 <td className="px-4 py-2.5 border-r border-slate-200 dark:border-slate-700">{overallData.reduce((sum, r) => sum + r.orders, 0)}</td>
                                 <td className="px-4 py-2.5 border-r border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400">{formatCurrency(overallData.reduce((sum, r) => sum + r.revenue, 0))}</td>
                                 <td className="px-4 py-2.5 border-r border-slate-200 dark:border-slate-700">-</td>
                                 <td className="px-4 py-2.5 border-r border-slate-200 dark:border-slate-700">-</td>
                             </tr>
                        </tbody>
                   </table>
               ) : (
                   /* STANDARD ORDERS TABLE (Used for Single sheet OR individual month tabs) */
                   <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr>
                                {activeColumns.map(col => (
                                <th 
                                    key={col.id} 
                                    className="px-3 py-2 border-b border-r border-slate-200 dark:border-slate-600 whitespace-nowrap sticky top-0 z-10"
                                    style={{ backgroundColor: headerColor, color: '#ffffff' }}
                                >
                                    {col.label}
                                </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {currentPreviewOrders.slice(0, 20).map((order) => (
                                <tr key={order.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                {activeColumns.map(col => (
                                    <td key={`${order.id}-${col.id}`} className="px-3 py-2 border-r border-slate-100 dark:border-slate-700 whitespace-nowrap text-slate-600 dark:text-slate-300">
                                        <div className="max-w-[200px] truncate">
                                            {formatPreviewValue(col.field(order))}
                                        </div>
                                    </td>
                                ))}
                                </tr>
                            ))}
                            {currentPreviewOrders.length > 20 && (
                                <tr>
                                <td colSpan={activeColumns.length} className="p-3 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 sticky bottom-0">
                                    ... showing 20 of {currentPreviewOrders.length} rows
                                </td>
                                </tr>
                            )}
                            {currentPreviewOrders.length === 0 && (
                                <tr>
                                <td colSpan={activeColumns.length} className="p-12 text-center text-slate-400">
                                    No data found for {activeSheet === 'Orders' ? 'selected range' : activeSheet}
                                </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
               )}
            </div>
         </div>
      </div>
    </BaseModal>
  );
};

export default ExportModal;