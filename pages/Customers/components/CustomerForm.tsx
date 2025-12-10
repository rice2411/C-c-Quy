import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, MapPin, Globe, AlertCircle } from 'lucide-react';
import { Customer } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import BaseModal from '../../../components/BaseModal';

interface CustomerFormProps {
  isOpen: boolean;
  initialData?: Customer | undefined;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ isOpen, initialData, onSave, onClose }) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Vietnam');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEmail(initialData.email);
      setPhone(initialData.phone);
      setAddress(initialData.address);
      setCity(initialData.city);
      setCountry(initialData.country || 'Vietnam');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setCity('');
      setCountry('Vietnam');
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!name.trim()) throw new Error("Name is required");

      const formData = {
        id: initialData?.id,
        name,
        email,
        phone,
        address,
        city,
        country
      };

      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-3 w-full">
       <button 
        type="button" 
        onClick={onClose}
        disabled={isSubmitting}
        className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
      >
        {t('form.cancel')}
      </button>
      <button 
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="px-6 py-2 bg-orange-600 dark:bg-orange-500 rounded-lg text-sm font-medium text-white hover:bg-orange-700 dark:hover:bg-orange-600 shadow-sm flex items-center gap-2 disabled:opacity-70 transition-colors"
      >
         {isSubmitting ? t('form.saving') : (
          <>
            <Save className="w-4 h-4" /> {t('customers.form.save')}
          </>
        )}
      </button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? t('customers.form.editTitle') : t('customers.form.addTitle')}
      footer={footer}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('customers.form.name')} *</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Full Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('customers.form.phone')}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="tel" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="090..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('customers.form.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="example@mail.com"
                />
              </div>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('customers.form.address')}</label>
             <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Street address..."
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('customers.form.city')}</label>
                <input 
                  type="text" 
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('customers.form.country')}</label>
                <div className="relative">
                   <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                   <input 
                    type="text" 
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
             </div>
          </div>
      </form>
    </BaseModal>
  );
};

export default CustomerForm;