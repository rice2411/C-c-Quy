import React, { useState, useEffect } from 'react';
import { User, Phone, AlertCircle, Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import BaseModal from '@/components/BaseModal';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, phone: string) => Promise<void>;
  phone: string;
  customerName?: string;
}

const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  phone,
  customerName = '',
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState(customerName);
  const [phoneValue, setPhoneValue] = useState(phone);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(customerName);
      setPhoneValue(phone);
      setError(null);
    }
  }, [isOpen, phone, customerName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!name.trim()) {
        throw new Error('Tên khách hàng là bắt buộc');
      }

      if (!phoneValue.trim()) {
        throw new Error('Số điện thoại là bắt buộc');
      }

      await onSave(name.trim(), phoneValue.trim());
    } catch (err: any) {
      setError(err.message || 'Không thể tạo khách hàng');
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
            <Save className="w-4 h-4" /> Tạo khách hàng
          </>
        )}
      </button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo khách hàng mới"
      footer={footer}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-sm rounded-lg">
          Số điện thoại <strong>{phone}</strong> chưa tồn tại trong hệ thống. Vui lòng tạo khách hàng mới để tiếp tục.
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Tên khách hàng *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="Nhập tên khách hàng"
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Số điện thoại *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              required
              value={phoneValue}
              onChange={(e) => setPhoneValue(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="090 123 4567"
            />
          </div>
        </div>
      </form>
    </BaseModal>
  );
};

export default CreateCustomerModal;

