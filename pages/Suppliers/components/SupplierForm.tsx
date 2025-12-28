import React, { useState, useEffect } from 'react';
import { Save, User, Phone, Mail, MapPin, FileText, AlertCircle, Store } from 'lucide-react';
import { Supplier, SupplierType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import BaseModal from '@/components/BaseModal';

interface SupplierFormProps {
  isOpen: boolean;
  initialData?: Supplier | undefined;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ isOpen, initialData, onSave, onClose }) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState<SupplierType>(SupplierType.GROCERY);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setContactName(initialData.contactName || '');
      setPhone(initialData.phone || '');
      setEmail(initialData.email || '');
      setAddress(initialData.address || '');
      setNote(initialData.note || '');
      setType(initialData.type || SupplierType.GROCERY);
    } else {
      setName('');
      setContactName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNote('');
      setType(SupplierType.GROCERY);
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!name.trim()) throw new Error(t('suppliers.form.errors.nameRequired'));

      const formData = {
        id: initialData?.id,
        name: name.trim(),
        type,
        contactName: contactName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        note: note.trim(),
      };

      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || t('suppliers.form.errors.saveFailed'));
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
            <Save className="w-4 h-4" /> {t('suppliers.form.save')}
          </>
        )}
      </button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? t('suppliers.form.editTitle') : t('suppliers.form.addTitle')}
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
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('suppliers.form.type')}</label>
          <div className="relative">
            <Store className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as SupplierType)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
            >
              {Object.values(SupplierType).map((value) => {
                const key = value.toString().toLowerCase();
                return (
                  <option key={value} value={value}>
                    {t(`suppliers.form.types.${key}`)}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('suppliers.form.name')} *</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder={t('suppliers.form.namePlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('suppliers.form.contactName')}</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder={t('suppliers.form.contactPlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('suppliers.form.phone')}</label>
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('suppliers.form.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="supplier@mail.com"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('suppliers.form.address')}</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder={t('suppliers.form.addressPlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('suppliers.form.note')}</label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <textarea 
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                placeholder={t('suppliers.form.notePlaceholder')}
              />
            </div>
          </div>
      </form>
    </BaseModal>
  );
};

export default SupplierForm;

