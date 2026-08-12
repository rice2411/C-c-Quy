import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bus, Globe, Package, Store, Truck, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomers } from '@/hooks/useCustomers';
import { fetchCoaches } from '@/services/coachService';
import type { OrderCoachInfo } from '@/types/coach';
import AddressMapInput, { type ShipInfoSnapshot } from '@/components/AddressMapInput';
import AutocompleteInput, { AutocompleteOption } from '@/components/AutocompleteInput';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Typography from '@/components/ui/Typography';
import Heading from '@/components/ui/Heading';
import { DeliveryType } from '@/types';

/** Picker chọn nhà xe đã lưu (dùng khi deliveryType = SHIP_COACH). */
const CoachPicker: React.FC<{
  coachInfo?: OrderCoachInfo | null;
  setCoachInfo?: (c: OrderCoachInfo | null) => void;
  shippingCost?: number;
  onShipFeeChange?: (fee: number | null) => void;
}> = ({ coachInfo, setCoachInfo, shippingCost, onShipFeeChange }) => {
  const { data: coaches = [] } = useQuery({ queryKey: ['coaches'], queryFn: fetchCoaches });

  // Nếu đơn cũ có nhà xe không còn trong danh bạ → thêm option ảo để không mất lựa chọn.
  const options = useMemo(() => {
    const list = coaches.map((c) => ({ id: c.id, label: c.route ? `${c.name} · ${c.route}` : c.name }));
    if (coachInfo?.id && !coaches.some((c) => c.id === coachInfo.id)) {
      list.unshift({ id: coachInfo.id, label: `${coachInfo.name} (đã lưu)` });
    }
    return list;
  }, [coaches, coachInfo]);

  const handlePick = (id: string) => {
    if (!id) { setCoachInfo?.(null); return; }
    const c = coaches.find((x) => x.id === id);
    if (c) {
      setCoachInfo?.({ id: c.id, name: c.name, phone: c.phone, route: c.route, pickupPoint: c.pickupPoint });
      // Chưa nhập phí → điền phí gửi mặc định của nhà xe.
      if ((!shippingCost || shippingCost === 0) && c.defaultFee) onShipFeeChange?.(c.defaultFee);
    } else if (coachInfo?.id === id) {
      // giữ nguyên coachInfo đã lưu
    }
  };

  return (
    <>
      <Field label="Nhà xe" htmlFor="order-form-coach">
        <Select
          id="order-form-coach"
          value={coachInfo?.id ?? ''}
          onChange={(e) => handlePick(e.target.value)}
        >
          <option value="">— Chọn nhà xe —</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </Select>
        {coaches.length === 0 ? (
          <Typography as="p" size="xs" variant="muted" layoutClassName="mt-1">
            Chưa có nhà xe nào. Thêm ở Cài đặt → Nhà xe.
          </Typography>
        ) : null}
        {coachInfo ? (
          <Typography as="p" size="xs" variant="muted" layoutClassName="mt-1">
            {[coachInfo.phone, coachInfo.route, coachInfo.pickupPoint].filter(Boolean).join(' · ') || '—'}
          </Typography>
        ) : null}
      </Field>
      <Field label="Phí gửi xe khách" htmlFor="order-form-coach-fee">
        <Input
          id="order-form-coach-fee"
          type="number"
          min={0}
          step={1000}
          placeholder="0"
          value={shippingCost ?? ''}
          onChange={(e) => { const raw = e.target.value; onShipFeeChange?.(raw === '' ? null : Number(raw)); }}
          leftIcon={<Package className="h-4 w-4" />}
          leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
        />
      </Field>
    </>
  );
};

interface CustomerSectionProps {
  customerName: string;
  setCustomerName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  deliveryType: DeliveryType;
  setDeliveryType: (val: DeliveryType) => void;
  trackingNumber?: string;
  setTrackingNumber?: (val: string) => void;
  shippingCost?: number;
  onShipFeeChange?: (fee: number | null) => void;
  initialShipInfo?: ShipInfoSnapshot;
  onShipInfoChange?: (info: ShipInfoSnapshot | null) => void;
  coachInfo?: OrderCoachInfo | null;
  setCoachInfo?: (c: OrderCoachInfo | null) => void;
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
  trackingNumber,
  setTrackingNumber,
  shippingCost,
  onShipFeeChange,
  initialShipInfo,
  onShipInfoChange,
  coachInfo,
  setCoachInfo,
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
          <Box layoutClassName="grid grid-cols-2 gap-2">
            {([
              { dt: DeliveryType.SHIP,          icon: <Truck className="h-4 w-4 shrink-0" />,  label: t('deliveryType.ship') },
              { dt: DeliveryType.SHIP_PROVINCE,  icon: <Globe className="h-4 w-4 shrink-0" />,  label: t('deliveryType.shipProvince') },
              { dt: DeliveryType.SHIP_COACH,     icon: <Bus className="h-4 w-4 shrink-0" />,    label: t('deliveryType.shipCoach') },
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

            {deliveryType === DeliveryType.SHIP_PROVINCE && setTrackingNumber ? (
              <Field label="Mã vận đơn" htmlFor="order-form-tracking-number">
                <Input
                  id="order-form-tracking-number"
                  placeholder="Mã vận đơn của đơn vị vận chuyển (GHTK, GHN, VNPost...)"
                  value={trackingNumber ?? ''}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  leftIcon={<Truck className="h-4 w-4" />}
                  leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
                />
              </Field>
            ) : null}
          </>
        ) : null}

        {/* Ship xe khách: chọn nhà xe đã lưu + phí gửi */}
        {deliveryType === DeliveryType.SHIP_COACH ? (
          <CoachPicker
            coachInfo={coachInfo}
            setCoachInfo={setCoachInfo}
            shippingCost={shippingCost}
            onShipFeeChange={onShipFeeChange}
          />
        ) : null}
      </Box>
    </Box>
  );
};

export default OrderFormCustomerSection;
