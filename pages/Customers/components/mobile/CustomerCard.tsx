import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Phone, ShoppingBag } from 'lucide-react';
import { Customer } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import PhoneCarrierBadge from '../PhoneCarrierBadge';
import { classifyVietnameseMobile } from '@/utils/vietnameseMobilePhone';

interface CustomerCardProps {
  customer: Customer;
  productCount: number;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onOpenDetail?: (customer: Customer) => void;
  onSavePhone?: (customerId: string, phone: string) => void | Promise<void>;
}

const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  productCount,
  onEdit,
  onDelete,
  onOpenDetail,
  onSavePhone,
}) => {
  const { t } = useLanguage();
  const [phoneDraft, setPhoneDraft] = useState(customer.phone ?? '');

  useEffect(() => {
    setPhoneDraft(customer.phone ?? '');
  }, [customer.id, customer.phone]);

  const phoneCheck = classifyVietnameseMobile(phoneDraft);
  const isPhoneInvalid = phoneCheck.kind === 'invalid';

  const handleCardActivate = () => {
    onOpenDetail?.(customer);
  };

  const handlePhoneBlur = () => {
    const next = phoneDraft.trim();
    const prev = (customer.phone ?? '').trim();
    if (next === prev) return;
    onSavePhone?.(customer.id, next);
  };

  const stopCardClick = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      padding="none"
      layoutClassName={`group relative z-0 overflow-hidden transition-all duration-200 ease-out hover:z-10 hover:scale-[1.03]${onOpenDetail ? ' cursor-pointer' : ''}`}
      onClick={onOpenDetail ? handleCardActivate : undefined}
      borderClassName={
        isPhoneInvalid
          ? 'border-2 border-red-400/95 dark:border-red-600/90'
          : 'border border-slate-200/90 dark:border-slate-600/80'
      }
      backgroundClassName={
        isPhoneInvalid
          ? 'bg-gradient-to-br from-red-50/95 via-white to-red-50/35 dark:from-red-950/40 dark:via-slate-800 dark:to-red-950/25'
          : 'bg-white dark:bg-slate-800'
      }
      roundedClassName="rounded-2xl"
      shadowClassName={
        isPhoneInvalid
          ? 'shadow-md shadow-red-200/55 ring-1 ring-red-300/45 hover:shadow-lg dark:shadow-none dark:ring-red-800/45 dark:hover:shadow-lg dark:hover:shadow-black/25'
          : 'shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-black/20'
      }
    >
      <Box layoutClassName="p-4">
        <Box layoutClassName="mb-3 flex items-start justify-between gap-2">
          <Box layoutClassName="flex min-w-0 flex-1 items-center gap-3">
            <Box
              layoutClassName="flex h-11 w-11 shrink-0 items-center justify-center text-base font-bold shadow-sm"
              roundedClassName="rounded-full"
              backgroundClassName="bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/45 dark:to-amber-900/25"
              textClassName="text-orange-700 dark:text-orange-300"
            >
              {customer.name.charAt(0).toUpperCase()}
            </Box>
            <Box layoutClassName="min-w-0 flex-1">
              <Typography size="sm" layoutClassName="font-semibold text-slate-900 dark:text-white">
                {customer.name}
              </Typography>
              <Typography size="xs" variant="muted" layoutClassName="font-mono">
                #{customer.id.substring(0, 6)}
              </Typography>
            </Box>
          </Box>
          <Box layoutClassName="flex shrink-0 gap-0.5">
            <IconButton
              type="button"
              label="Edit"
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(customer);
              }}
              layoutClassName="rounded-xl p-2"
              textClassName="text-slate-400"
              hoverClassName="hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-900/35 dark:hover:text-orange-300"
              stateClassName="transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </IconButton>
            <IconButton
              type="button"
              label="Delete"
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(customer.id);
              }}
              layoutClassName="rounded-xl p-2"
              textClassName="text-slate-400"
              hoverClassName="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/25 dark:hover:text-red-400"
              stateClassName="transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </Box>
        </Box>

        <Box layoutClassName="flex flex-wrap items-start gap-2">
          <Box
            layoutClassName="flex min-w-0 flex-1 basis-[min(100%,14rem)] flex-col gap-2 sm:flex-row sm:items-center"
            onClick={stopCardClick}
            onPointerDown={stopCardClick}
          >
            <Input
              type="tel"
              size="sm"
              value={phoneDraft}
              onChange={(e) => setPhoneDraft(e.target.value)}
              onBlur={handlePhoneBlur}
              placeholder={t('customers.phonePlaceholder')}
              leftIcon={<Phone className="h-3.5 w-3.5 text-orange-500" />}
              containerClassName="min-w-0 flex-1"
              borderClassName={
                !phoneDraft.trim()
                  ? 'border-dashed border-slate-300 dark:border-slate-600'
                  : undefined
              }
              backgroundClassName={!phoneDraft.trim() ? 'bg-slate-50/90 dark:bg-slate-900/50' : undefined}
            />
            {!phoneDraft.trim() ? (
              <Badge
                size="sm"
                layoutClassName="shrink-0"
                borderClassName="border border-slate-300/80 dark:border-slate-600"
                backgroundClassName="bg-slate-100 dark:bg-slate-800/90"
                textClassName="text-[11px] font-medium text-slate-600 dark:text-slate-300"
              >
                {t('customers.phoneEmptyBadge')}
              </Badge>
            ) : (
              <PhoneCarrierBadge phone={phoneDraft} />
            )}
          </Box>
          <Badge
            size="sm"
            layoutClassName="inline-flex items-center gap-1.5 px-2.5 py-1.5"
            borderClassName="border border-orange-200/70 dark:border-orange-800/50"
            backgroundClassName="bg-orange-50 dark:bg-orange-950/35"
            textClassName="text-xs font-semibold text-orange-900 dark:text-orange-100"
          >
            <ShoppingBag className="h-3.5 w-3.5 opacity-80" aria-hidden />
            {t('customers.table.totalProducts')}: {productCount}
          </Badge>
        </Box>
      </Box>
    </Card>
  );
};

export default CustomerCard;
