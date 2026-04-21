import React, { useState, useEffect } from 'react';
import { Save, User, Phone, Mail, MapPin, FileText, AlertCircle, Store } from 'lucide-react';
import { Supplier, SupplierType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';

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
    <Box layoutClassName="flex w-full justify-end gap-3">
      <Button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        variant="secondary"
        disableVariantHover
        disableVariantTextColor
        borderClassName="border border-slate-200 dark:border-slate-600"
        backgroundClassName="bg-transparent"
        hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
        textClassName="text-sm font-medium text-slate-700 dark:text-slate-300"
        roundedClassName="rounded-lg"
        sizeClassName="px-4 py-2"
        stateClassName="transition-colors disabled:opacity-50"
      >
        {t('form.cancel')}
      </Button>
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        leftIcon={isSubmitting ? undefined : <Save />}
        iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
        backgroundClassName="bg-orange-600 dark:bg-orange-500"
        hoverClassName="hover:bg-orange-700 dark:hover:bg-orange-600"
        textClassName="text-sm font-medium text-white"
        roundedClassName="rounded-lg"
        shadowClassName="shadow-sm"
        layoutClassName="flex items-center gap-2"
        sizeClassName="px-6 py-2"
        stateClassName="transition-colors disabled:opacity-70"
        disableVariantHover
        disableVariantTextColor
      >
        {isSubmitting ? t('form.saving') : t('suppliers.form.save')}
      </Button>
    </Box>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? t('suppliers.form.editTitle') : t('suppliers.form.addTitle')}
      footer={footer}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Box layoutClassName="space-y-4">
          {error ? (
            <Box
              layoutClassName="flex items-center gap-2 rounded-lg p-3 text-sm"
              backgroundClassName="bg-red-50 dark:bg-red-900/20"
              textClassName="text-red-600 dark:text-red-400"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </Box>
          ) : null}

          <Field label={t('suppliers.form.type')} htmlFor="supplier-form-type">
            <Box layoutClassName="relative">
              <Store className="pointer-events-none absolute left-3 top-2.5 z-10 h-4 w-4 text-slate-400" />
              <Select
                id="supplier-form-type"
                fullWidth
                value={type}
                onChange={(e) => setType(e.target.value as SupplierType)}
                sizeClassName="pl-9"
                backgroundClassName="bg-slate-50 dark:bg-slate-700"
                borderClassName="border-slate-200 dark:border-slate-600"
              >
                {Object.values(SupplierType).map((value) => {
                  const key = value.toString().toLowerCase();
                  return (
                    <option key={value} value={value}>
                      {t(`suppliers.form.types.${key}`)}
                    </option>
                  );
                })}
              </Select>
            </Box>
          </Field>

          <Field label={`${t('suppliers.form.name')} *`} htmlFor="supplier-form-name">
            <Input
              id="supplier-form-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('suppliers.form.namePlaceholder')}
              leftIcon={<User />}
              leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
            />
          </Field>

          <Field label={t('suppliers.form.contactName')} htmlFor="supplier-form-contact-name">
            <Input
              id="supplier-form-contact-name"
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder={t('suppliers.form.contactPlaceholder')}
              leftIcon={<User />}
              leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
            />
          </Field>

          <Box layoutClassName="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('suppliers.form.phone')} htmlFor="supplier-form-phone">
              <Input
                id="supplier-form-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="090..."
                leftIcon={<Phone />}
                leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
              />
            </Field>

            <Field label={t('suppliers.form.email')} htmlFor="supplier-form-email">
              <Input
                id="supplier-form-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="supplier@mail.com"
                leftIcon={<Mail />}
                leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
              />
            </Field>
          </Box>

          <Field label={t('suppliers.form.address')} htmlFor="supplier-form-address">
            <Input
              id="supplier-form-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('suppliers.form.addressPlaceholder')}
              leftIcon={<MapPin />}
              leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
            />
          </Field>

          <Field label={t('suppliers.form.note')} htmlFor="supplier-form-note">
            <Textarea
              id="supplier-form-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              resize="none"
              placeholder={t('suppliers.form.notePlaceholder')}
              leftIcon={<FileText />}
              leftIconClassName="top-2.5 [&_svg]:h-4 [&_svg]:w-4"
            />
          </Field>
        </Box>
      </form>
    </BaseModal>
  );
};

export default SupplierForm;

