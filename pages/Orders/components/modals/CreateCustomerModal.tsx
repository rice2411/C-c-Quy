import React, { useEffect, useState } from 'react';
import { AlertCircle, Phone, Save, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Input from '@/components/ui/Input';
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
  customerName = ''
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
      setIsSubmitting(false);
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
        variant="primary"
        disableVariantHover
        disableVariantTextColor
      >
        {isSubmitting ? t('form.saving') : 'Tạo khách hàng'}
      </Button>
    </Box>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Tạo khách hàng mới" footer={footer} size="sm">
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

          <Box
            layoutClassName="rounded-lg p-3 text-sm"
            backgroundClassName="bg-orange-50 dark:bg-orange-900/20"
            textClassName="text-orange-700 dark:text-orange-300"
          >
            Số điện thoại <strong>{phone}</strong> chưa tồn tại trong hệ thống. Vui lòng tạo khách hàng mới để tiếp
            tục.
          </Box>

          <Field label="Tên khách hàng" required>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên khách hàng"
              autoFocus
              leftIcon={<User />}
              leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
            />
          </Field>

          <Field label="Số điện thoại" required>
            <Input
              type="tel"
              required
              value={phoneValue}
              onChange={(e) => setPhoneValue(e.target.value)}
              placeholder="090 123 4567"
              leftIcon={<Phone />}
              leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
            />
          </Field>
        </Box>
      </form>
    </BaseModal>
  );
};

export default CreateCustomerModal;
