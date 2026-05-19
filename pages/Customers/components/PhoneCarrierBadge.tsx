import React from 'react';
import Badge from '@/components/ui/Badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { classifyVietnameseMobile, type VietMobileCarrier } from '@/utils/validation/vietnameseMobilePhone';

interface PhoneCarrierBadgeProps {
  phone: string;
}

const CARRIER_STYLES: Record<
  VietMobileCarrier,
  { border: string; bg: string; text: string }
> = {
  viettel: {
    border: 'border-red-300/80 dark:border-red-700/70',
    bg: 'bg-red-50 dark:bg-red-950/45',
    text: 'font-semibold text-red-800 dark:text-red-200',
  },
  mobi: {
    border: 'border-blue-300/80 dark:border-blue-700/70',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'font-semibold text-blue-800 dark:text-blue-200',
  },
  vina: {
    border: 'border-amber-300/90 dark:border-amber-700/70',
    bg: 'bg-amber-100/90 dark:bg-amber-950/45',
    text: 'font-semibold text-amber-900 dark:text-amber-100',
  },
  vietnamobile: {
    border: 'border-teal-300/85 dark:border-teal-700/70',
    bg: 'bg-teal-50 dark:bg-teal-950/45',
    text: 'font-semibold text-teal-800 dark:text-teal-200',
  },
  gmobile: {
    border: 'border-violet-300/85 dark:border-violet-700/70',
    bg: 'bg-violet-50 dark:bg-violet-950/45',
    text: 'font-semibold text-violet-800 dark:text-violet-200',
  },
};

const PhoneCarrierBadge: React.FC<PhoneCarrierBadgeProps> = ({ phone }) => {
  const { t } = useLanguage();
  const result = classifyVietnameseMobile(phone);

  if (result.kind === 'empty') {
    return null;
  }

  if (result.kind === 'valid') {
    const styles = CARRIER_STYLES[result.carrier];
    const labelKey = `customers.phoneBadge.${result.carrier}`;

    return (
      <Badge
        size="sm"
        layoutClassName="shrink-0"
        borderClassName={styles.border}
        backgroundClassName={styles.bg}
        textClassName={`text-[11px] ${styles.text}`}
      >
        {t(labelKey)}
      </Badge>
    );
  }

  return (
    <Badge
      size="sm"
      layoutClassName="shrink-0"
      borderClassName="border-slate-300/80 dark:border-slate-600"
      backgroundClassName="bg-slate-100 dark:bg-slate-800/90"
      textClassName="text-[11px] font-medium text-slate-600 dark:text-slate-300"
    >
      {t('customers.phoneBadge.invalid')}
    </Badge>
  );
};

export default PhoneCarrierBadge;
