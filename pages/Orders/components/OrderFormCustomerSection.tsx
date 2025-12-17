import React, { useState, useRef, useEffect } from 'react';
import { User, MapPin, Phone, Search, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Customer } from '@/types';

interface CustomerSectionProps {
  customerName: string;
  setCustomerName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
}

const OrderFormCustomerSection: React.FC<CustomerSectionProps> = ({
  customerName, setCustomerName,
  phone, setPhone,
  address, setAddress
}) => {
  const { t } = useLanguage();
  const { customers } = useCustomers();
  
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
  
  const nameRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nameRef.current && !nameRef.current.contains(event.target as Node)) {
        setShowNameDropdown(false);
      }
      if (phoneRef.current && !phoneRef.current.contains(event.target as Node)) {
        setShowPhoneDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectCustomer = (customer: Customer) => {
    setCustomerName(customer.name);
    setPhone(customer.phone);
    
    // Construct full address
    const fullAddress = [customer.address, customer.city, customer.country]
      .filter(part => part && part.trim() !== '')
      .join(', ');
    
    setAddress(fullAddress);
    setShowNameDropdown(false);
    setShowPhoneDropdown(false);
  };

  const normalize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // Name Search: Matches Name OR Phone
  const nameResults = customers.filter(c => {
    if (!customerName.trim()) return false;
    const term = customerName.toLowerCase();
    const phoneTerm = normalize(customerName);
    
    return c.name.toLowerCase().includes(term) || 
           (phoneTerm.length > 3 && normalize(c.phone).includes(phoneTerm));
  }).slice(0, 5);

  // Phone Search: Matches Phone only
  const phoneResults = customers.filter(c => {
    if (!phone.trim()) return false;
    const term = normalize(phone);
    if (term.length < 3) return false; // Don't search for too short numbers
    return normalize(c.phone).includes(term);
  }).slice(0, 5);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
        <User className="w-4 h-4 text-orange-500" /> {t('form.customerDetails')}
      </h3>
      
      <div className="space-y-3">
        {/* Customer Name with Autocomplete */}
        <div className="relative" ref={nameRef}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('form.customerName')} *</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              required
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                setShowNameDropdown(true);
              }}
              onFocus={() => setShowNameDropdown(true)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="Search by name or phone..."
              autoComplete="off"
            />
          </div>

          {/* Name Dropdown Results */}
          {showNameDropdown && nameResults.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <ul className="py-1">
                {nameResults.map((customer) => (
                  <li 
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="px-4 py-2 hover:bg-orange-50 dark:hover:bg-slate-700 cursor-pointer transition-colors group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-orange-700 dark:group-hover:text-orange-400">
                          {customer.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {customer.phone} {customer.email && `• ${customer.email}`}
                        </p>
                      </div>
                      {customer.name.toLowerCase() === customerName.toLowerCase() && (
                        <Check className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Phone with Autocomplete */}
        <div className="relative" ref={phoneRef}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('form.phone')}</label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => {
                 setPhone(e.target.value);
                 setShowPhoneDropdown(true);
              }}
              onFocus={() => setShowPhoneDropdown(true)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="090 123 4567"
              autoComplete="off"
            />
          </div>

          {/* Phone Dropdown Results */}
          {showPhoneDropdown && phoneResults.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <ul className="py-1">
                {phoneResults.map((customer) => (
                  <li 
                    key={`p-${customer.id}`}
                    onClick={() => handleSelectCustomer(customer)}
                    className="px-4 py-2 hover:bg-orange-50 dark:hover:bg-slate-700 cursor-pointer transition-colors group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-orange-700 dark:group-hover:text-orange-400">
                          {customer.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {customer.phone}
                        </p>
                      </div>
                       {normalize(customer.phone) === normalize(phone) && (
                        <Check className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Address */}
        <div>
           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('form.address')}</label>
           <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <textarea 
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={2}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                placeholder="House number, street name..."
              />
           </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFormCustomerSection;