import React, { useMemo } from 'react';
import { MapPin, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomers } from '@/contexts/CustomerContext';
import AutocompleteInput, { AutocompleteOption } from '@/components/AutocompleteInput';
import Box from '@/components/ui/Box';
import Field from '@/components/ui/Field';
import Heading from '@/components/ui/Heading';
import Textarea from '@/components/ui/Textarea';

interface CustomerSectionProps {
  customerName: string;
  setCustomerName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
}

const OrderFormCustomerSection: React.FC<CustomerSectionProps> = ({
  customerName,
  setCustomerName,
  phone,
  setPhone,
  address,
  setAddress
}) => {
  const { t } = useLanguage();
  const { customers } = useCustomers();

  const normalize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  const customerOptions = useMemo<AutocompleteOption[]>(
    () =>
      customers.map((c) => ({
        id: c.id,
        label: c.name,
        subtitle: `${c.phone}${c.email ? ` • ${c.email}` : ''}`
      })),
    [customers]
  );

  const handleSelectCustomer = (option: AutocompleteOption) => {
    const customer = customers.find((c) => c.id === option.id);
    if (customer) {
      setCustomerName(customer.name);
      setPhone(customer.phone);

      const fullAddress = [customer.address, customer.city, customer.country]
        .filter((part) => part && part.trim() !== '')
        .join(', ');

      setAddress(fullAddress);
    }
  };

  const nameFilterFn = (option: AutocompleteOption, searchValue: string) => {
    if (!searchValue.trim()) return false;
    const term = searchValue.toLowerCase();
    const phoneTerm = normalize(searchValue);
    const customer = customers.find((c) => c.id === option.id);
    if (!customer) return false;

    return (
      customer.name.toLowerCase().includes(term) ||
      (phoneTerm.length > 3 && normalize(customer.phone).includes(phoneTerm))
    );
  };

  const phoneFilterFn = (option: AutocompleteOption, searchValue: string) => {
    if (!searchValue.trim()) return false;
    const term = normalize(searchValue);
    if (term.length < 3) return false;
    const customer = customers.find((c) => c.id === option.id);
    if (!customer) return false;
    return normalize(customer.phone).includes(term);
  };

  return (
    <Box layoutClassName="space-y-4">
      <Heading
        level={3}
        layoutClassName="flex items-center gap-2 uppercase tracking-wider"
        textClassName="text-sm font-semibold"
      >
        <User className="h-4 w-4 text-orange-500" /> {t('form.customerDetails')}
      </Heading>

      <Box layoutClassName="space-y-3">
        <AutocompleteInput
          value={customerName}
          onChange={setCustomerName}
          onSelect={handleSelectCustomer}
          options={customerOptions}
          placeholder="Search by name or phone..."
          label={t('form.customerName')}
          required
          filterFn={nameFilterFn}
        />

        <AutocompleteInput
          value={phone}
          onChange={setPhone}
          onSelect={handleSelectCustomer}
          options={customerOptions}
          placeholder="090 123 4567"
          label={t('form.phone')}
          filterFn={phoneFilterFn}
        />

        <Field label={t('form.address')} htmlFor="order-form-address">
          <Textarea
            id="order-form-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            resize="none"
            placeholder="House number, street name..."
            leftIcon={<MapPin className="h-4 w-4" />}
            leftIconClassName="top-2.5 [&_svg]:h-4 [&_svg]:w-4"
          />
        </Field>
      </Box>
    </Box>
  );
};

export default OrderFormCustomerSection;
