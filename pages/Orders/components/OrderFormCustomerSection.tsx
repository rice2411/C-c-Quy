import React, { useMemo } from 'react';
import { Globe, Package, Store, Truck, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomers } from '@/contexts/CustomerContext';
import AddressMapInput, { type ShipInfoSnapshot } from '@/components/AddressMapInput';
import AutocompleteInput, { AutocompleteOption } from '@/components/AutocompleteInput';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Input from '@/components/ui/Input';
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
  shippingCost?: number;
  onShipFeeChange?: (fee: number | null) => void;
  initialShipInfo?: ShipInfoSnapshot;
  onShipInfoChange?: (info: ShipInfoSnapshot | null) => void;
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
  shippingCost,
  onShipFeeChange,
  initialShipInfo,
  onShipInfoChange,
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
        <User className="h-4 w-4 text-primary-500" /> {t('form.customerDetails')}
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

        {/* Delivery type */}
        <Field label={t('deliveryType.label')} htmlFor="order-form-delivery-type">
          <Box layoutClassName="grid grid-cols-3 gap-2">
            {([
              { dt: DeliveryType.SHIP,          icon: <Truck className="h-4 w-4 shrink-0" />,  label: t('deliveryType.ship') },
              { dt: DeliveryType.SHIP_PROVINCE,  icon: <Globe className="h-4 w-4 shrink-0" />,  label: t('deliveryType.shipProvince') },
              { dt: DeliveryType.PICKUP,         icon: <Store className="h-4 w-4 shrink-0" />,  label: t('deliveryType.pickup') },
            ]).map(({ dt, icon, label }) => {
              const active = deliveryType === dt;
              return (
                <Button
                  key={dt}
                  type="button"
                  variant="ghost"
                  disableVariantHover
                  disableVariantTextColor
                  onClick={() => setDeliveryType(dt)}
                  leftIcon={icon}
                  sizeClassName="px-2 py-2.5"
                  textClassName={active
                    ? 'text-xs font-medium text-primary-700 dark:text-primary-200'
                    : 'text-xs font-medium text-slate-600 dark:text-slate-300'}
                  backgroundClassName={active
                    ? 'bg-primary-50 dark:bg-primary-900/30'
                    : 'bg-white dark:bg-slate-800'}
                  borderClassName={active
                    ? 'border border-primary-400 dark:border-primary-500'
                    : 'border border-slate-200 dark:border-slate-600'}
                  hoverClassName={active ? '' : 'hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}
                  roundedClassName="rounded-lg"
                  shadowClassName=""
                  stateClassName="transition-colors"
                >
                  {label}
                </Button>
              );
            })}
          </Box>
        </Field>

        {/* Address + map: SHIP → tính phí ship tự động; SHIP_PROVINCE → chỉ map, phí nhập tay */}
        {deliveryType === DeliveryType.SHIP || deliveryType === DeliveryType.SHIP_PROVINCE ? (
          <>
            <Field label={t('form.address')} htmlFor="order-form-address">
              <AddressMapInput
                id="order-form-address"
                value={address}
                onChange={setAddress}
                placeholder={deliveryType === DeliveryType.SHIP_PROVINCE
                  ? 'Nhập địa chỉ tỉnh thành...'
                  : 'Nhập địa chỉ giao hàng...'}
                showMap
                showFeePanel={deliveryType !== DeliveryType.SHIP_PROVINCE}
                onShipFeeChange={deliveryType === DeliveryType.SHIP ? onShipFeeChange : undefined}
                initialShipInfo={initialShipInfo}
                onShipInfoChange={deliveryType === DeliveryType.SHIP ? onShipInfoChange : undefined}
              />
            </Field>

            {deliveryType === DeliveryType.SHIP_PROVINCE ? (
              <Field label="Phí ship tỉnh" htmlFor="order-form-province-ship-fee">
                <Input
                  id="order-form-province-ship-fee"
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="0"
                  value={shippingCost ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value;onShipFeeChange?.(raw === '' ? null : Number(raw));
                  }}
                  leftIcon={<Package className="h-4 w-4" />}
                  leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
                />
              </Field>
            ) : null}
          </>
        ) : null}
      </Box>
    </Box>
  );
};

export default OrderFormCustomerSection;
