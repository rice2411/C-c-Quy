import React, { useMemo } from 'react';
import { Store, Truck, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomers } from '@/contexts/CustomerContext';
import AddressMapInput from '@/components/AddressMapInput';
import AutocompleteInput, { AutocompleteOption } from '@/components/AutocompleteInput';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Heading from '@/components/ui/Heading';
import { DeliveryType } from '@/types';

interface CustomerSectionProps {
  customerName: string;
  setCustomerName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  deliveryType: DeliveryType;
  setDeliveryType: (val: DeliveryType) => void;
  onShipFeeChange?: (fee: number | null) => void;
}

const OrderFormCustomerSection: React.FC<CustomerSectionProps> = ({
  customerName,
  setCustomerName,
  phone,
  setPhone,
  address,
  setAddress,
  deliveryType,
  setDeliveryType,
  onShipFeeChange,
}) => {
  const { t } = useLanguage();
  const { customers } = useCustomers();

  const normalize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  const customerOptions = useMemo<AutocompleteOption[]>(
    () =>
      customers.map((c) => ({
        id: c.id,
        label: c.name,
        subtitle: `${c.phone}${c.email ? ` • ${c.email}` : ''}`,
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

        {/* Delivery type — moved here for better flow: chọn ship trước rồi mới hiện ô địa chỉ */}
        <Field label={t('deliveryType.label')} htmlFor="order-form-delivery-type">
          <Box layoutClassName="grid grid-cols-2 gap-2">
            {([DeliveryType.SHIP, DeliveryType.PICKUP] as DeliveryType[]).map((dt) => {
              const active = deliveryType === dt;
              return (
                <Button
                  key={dt}
                  type="button"
                  variant="ghost"
                  disableVariantHover
                  disableVariantTextColor
                  onClick={() => setDeliveryType(dt)}
                  leftIcon={dt === DeliveryType.SHIP
                    ? <Truck className="h-4 w-4 shrink-0" />
                    : <Store className="h-4 w-4 shrink-0" />}
                  sizeClassName="px-3 py-2.5"
                  textClassName={active
                    ? 'text-sm font-medium text-orange-700 dark:text-orange-200'
                    : 'text-sm font-medium text-slate-600 dark:text-slate-300'}
                  backgroundClassName={active
                    ? 'bg-orange-50 dark:bg-orange-900/30'
                    : 'bg-white dark:bg-slate-800'}
                  borderClassName={active
                    ? 'border border-orange-400 dark:border-orange-500'
                    : 'border border-slate-200 dark:border-slate-600'}
                  hoverClassName={active ? '' : 'hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}
                  roundedClassName="rounded-lg"
                  shadowClassName=""
                  stateClassName="transition-colors"
                >
                  {dt === DeliveryType.SHIP ? t('deliveryType.ship') : t('deliveryType.pickup')}
                </Button>
              );
            })}
          </Box>
        </Field>

        {/* Address + map: chỉ hiển thị khi SHIP */}
        {deliveryType === DeliveryType.SHIP ? (
          <Field label={t('form.address')} htmlFor="order-form-address">
            <AddressMapInput
              id="order-form-address"
              value={address}
              onChange={setAddress}
              placeholder="Nhập địa chỉ giao hàng..."
              showMap
              onShipFeeChange={onShipFeeChange}
            />
          </Field>
        ) : null}
      </Box>
    </Box>
  );
};

export default OrderFormCustomerSection;
