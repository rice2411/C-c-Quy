import React, { useState, useEffect } from 'react';
import { Save, User, Phone, AlertCircle } from 'lucide-react';
import { Customer } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Input from '@/components/ui/Input';
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
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPhone(initialData.phone);
    } else {
      setName('');
      setPhone('');
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!name.trim()) throw new Error('Name is required');

      const formData = {
        id: initialData?.id,
        name,
        phone
      };

      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <Box layoutClassName="flex w-full justify-end gap-3">
      <Button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        variant="secondary"
        textClassName="text-sm font-medium text-slate-700 dark:text-slate-300"
        borderClassName="border border-slate-200 dark:border-slate-600"
        roundedClassName="rounded-xl"
        hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
        stateClassName="transition-colors disabled:opacity-50"
      >
        {t('form.cancel')}
      </Button>
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        leftIcon={isSubmitting ? undefined : <Save />}
        iconClassName={isSubmitting ? undefined : 'inline-flex shrink-0'}
        backgroundClassName="bg-gradient-to-r from-orange-600 to-amber-600"
        hoverClassName="hover:from-orange-700 hover:to-amber-700"
        textClassName="text-sm font-semibold text-white"
        roundedClassName="rounded-xl"
        shadowClassName="shadow-sm"
        layoutClassName="flex items-center gap-2"
        stateClassName="transition-colors disabled:opacity-70"
      >
        {isSubmitting ? t('form.saving') : t('customers.form.save')}
      </Button>
    </Box>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? t('customers.form.editTitle') : t('customers.form.addTitle')}
      footer={footer}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Box layoutClassName="space-y-5">
          {error ? (
            <Box
              layoutClassName="flex items-center gap-2 rounded-xl border border-red-100 p-3 text-sm dark:border-red-900/40"
              backgroundClassName="bg-red-50 dark:bg-red-900/20"
              textClassName="text-red-600 dark:text-red-400"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              {error}
            </Box>
          ) : null}

          <Field label={`${t('customers.form.name')} *`} htmlFor="customer-form-name">
            <Input
              id="customer-form-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="h-4 w-4 text-slate-400" />}
              placeholder={t('customers.namePlaceholder')}
            />
          </Field>

          <Field label={t('customers.form.phone')} htmlFor="customer-form-phone">
            <Input
              id="customer-form-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="h-4 w-4 text-slate-400" />}
              placeholder={t('customers.phonePlaceholder')}
            />
          </Field>
        </Box>
      </form>
    </BaseModal>
  );
};

export default CustomerForm;
