import React, { useState } from 'react';
import { Check, CreditCard, Plus, Trash2, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePaymentAccounts } from '@/hooks/usePaymentAccounts';
import { SEPAY_BANKS, bankLabel, parseSepayQrLink, qrTemplateLabel } from '@/types/paymentConfig';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Field from '@/components/ui/Field';
import Heading from '@/components/ui/Heading';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';

interface ParsedPreview {
  bankCode: string;
  accountNumber: string;
  qrTemplate: string;
}

const PaymentSettingsTab: React.FC = () => {
  const { t } = useLanguage();
  const { accounts, loading, mutating, create, setActive, remove } = usePaymentAccounts();

  const [qrLink, setQrLink] = useState('');
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [accountHolder, setAccountHolder] = useState('');

  const handleQrLinkChange = (value: string) => {
    setQrLink(value);
    const trimmed = value.trim();
    if (!trimmed) {
      setPreview(null);
      return;
    }
    const parsed = parseSepayQrLink(trimmed);
    if (!parsed || !parsed.bankCode || !parsed.accountNumber) {
      setPreview(null);
      return;
    }
    setPreview({
      bankCode: parsed.bankCode,
      accountNumber: parsed.accountNumber,
      qrTemplate: parsed.qrTemplate || 'compact',
    });
  };

  const handleSave = async () => {
    if (!preview) {
      toast.error(t('paymentSettings.qrLinkInvalid'));
      return;
    }
    if (!SEPAY_BANKS.some((b) => b.value === preview.bankCode)) {
      toast.error(t('paymentSettings.invalidBank'));
      return;
    }
    const holder = accountHolder.trim();
    if (!holder) {
      toast.error(t('paymentSettings.holderRequired'));
      return;
    }
    try {
      await create({
        bankCode: preview.bankCode,
        accountNumber: preview.accountNumber,
        accountHolder: holder,
        qrTemplate: preview.qrTemplate,
      });
      toast.success(t('paymentSettings.created'));
      setQrLink('');
      setPreview(null);
      setAccountHolder('');
    } catch (err: any) {
      toast.error(err?.message || t('paymentSettings.saveError'));
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await setActive(id);
      toast.success(t('paymentSettings.activated'));
    } catch (err: any) {
      toast.error(err?.message || t('paymentSettings.saveError'));
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm(t('paymentSettings.confirmDelete'))) return;
    try {
      await remove(id);
      toast.success(t('paymentSettings.deleted'));
    } catch (err: any) {
      toast.error(err?.message || t('paymentSettings.saveError'));
    }
  };

  if (loading) {
    return (
      <Box layoutClassName="flex items-center justify-center py-12">
        <Spinner size="md" />
      </Box>
    );
  }

  return (
    <Box layoutClassName="space-y-4">
      {/* Section header */}
      <Box
        layoutClassName="flex items-center gap-2 border-b pb-3"
        borderClassName="border-slate-200 dark:border-slate-700"
      >
        <CreditCard className="h-5 w-5 text-primary-500" />
        <Heading level={3} textClassName="text-base font-semibold">
          {t('paymentSettings.title')}
        </Heading>
      </Box>

      {/* ============ Khu Thêm tài khoản ============ */}
      <Card padding="lg">
        <Heading level={3} textClassName="text-base font-semibold mb-3">
          {t('paymentSettings.addTitle')}
        </Heading>

        <Field label={t('paymentSettings.qrLink')} htmlFor="payment-qr-link">
          <Input
            id="payment-qr-link"
            type="text"
            value={qrLink}
            onChange={(e) => handleQrLinkChange(e.target.value)}
            placeholder={t('paymentSettings.qrLinkPlaceholder')}
          />
          <Typography size="xs" variant="muted" layoutClassName="mt-1">
            {t('paymentSettings.qrLinkHint')}
          </Typography>
        </Field>

        {preview ? (
          <Box layoutClassName="mt-4 space-y-4">
            {/* Card preview */}
            <Box
              layoutClassName="space-y-2 p-4"
              borderClassName="border border-blue-100 dark:border-blue-800"
              backgroundClassName="bg-blue-50 dark:bg-blue-900/20"
              roundedClassName="rounded-xl"
            >
              <Box
                layoutClassName="flex items-center gap-2"
                textClassName="font-semibold text-blue-800 dark:text-blue-300"
              >
                <Wallet className="h-4 w-4" />
                <Typography as="span">{t('paymentSettings.previewTitle')}</Typography>
              </Box>
              <Box layoutClassName="flex items-center justify-between gap-4">
                <Typography
                  as="span"
                  size="xs"
                  layoutClassName="font-medium uppercase"
                  textClassName="text-slate-500"
                >
                  {t('paymentSettings.bankCode')}
                </Typography>
                <Typography as="span" layoutClassName="font-bold" textClassName="text-slate-800 dark:text-slate-200">
                  {bankLabel(preview.bankCode)}
                </Typography>
              </Box>
              <Box layoutClassName="flex items-center justify-between gap-4">
                <Typography
                  as="span"
                  size="xs"
                  layoutClassName="font-medium uppercase"
                  textClassName="text-slate-500"
                >
                  {t('paymentSettings.accountNumber')}
                </Typography>
                <Typography
                  as="span"
                  layoutClassName="font-mono font-bold"
                  textClassName="text-slate-800 dark:text-slate-200"
                >
                  {preview.accountNumber}
                </Typography>
              </Box>
              <Box layoutClassName="flex items-center justify-between gap-4">
                <Typography
                  as="span"
                  size="xs"
                  layoutClassName="font-medium uppercase"
                  textClassName="text-slate-500"
                >
                  {t('paymentSettings.qrTemplate')}
                </Typography>
                <Typography as="span" layoutClassName="font-bold" textClassName="text-slate-800 dark:text-slate-200">
                  {qrTemplateLabel(preview.qrTemplate)}
                </Typography>
              </Box>
            </Box>

            <Field label={t('paymentSettings.accountHolder')} htmlFor="payment-account-holder">
              <Input
                id="payment-account-holder"
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="TON THAT ANH MINH"
              />
            </Field>

            <Button
              type="button"
              onClick={handleSave}
              disabled={mutating}
              leftIcon={mutating ? <Spinner size="sm" textClassName="text-white" borderClassName="border-white" /> : <Plus />}
              iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
              sizeClassName="px-4 py-2"
              backgroundClassName="bg-primary-600"
              hoverClassName="hover:bg-primary-700"
              textClassName="text-sm font-medium text-white"
              roundedClassName="rounded-lg"
              layoutClassName="inline-flex items-center gap-2"
              stateClassName="transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              disableVariantHover
              disableVariantTextColor
            >
              {t('paymentSettings.saveAccount')}
            </Button>
          </Box>
        ) : null}
      </Card>

      {/* ============ Khu Danh sách tài khoản ============ */}
      <Card padding="lg">
        <Heading level={3} textClassName="text-base font-semibold mb-3">
          {t('paymentSettings.listTitle')}
        </Heading>

        {accounts.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-6 w-6" />}
            title={t('paymentSettings.emptyTitle')}
            description={t('paymentSettings.emptyHint')}
          />
        ) : (
          <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {accounts.map((acc) => (
              <Box
                key={acc.id}
                layoutClassName="flex flex-col gap-3 p-4"
                borderClassName={
                  acc.isActive
                    ? 'border-2 border-primary-400 dark:border-primary-600'
                    : 'border border-slate-200 dark:border-slate-700'
                }
                backgroundClassName={acc.isActive ? 'bg-primary-50/50 dark:bg-primary-900/10' : 'bg-white dark:bg-slate-800'}
                roundedClassName="rounded-xl"
              >
                <Box layoutClassName="flex items-start justify-between gap-2">
                  <Box layoutClassName="min-w-0 space-y-1">
                    <Box layoutClassName="flex flex-wrap items-center gap-2">
                      <Typography as="span" layoutClassName="font-semibold" textClassName="text-slate-800 dark:text-slate-100">
                        {bankLabel(acc.bankCode)}
                      </Typography>
                      {acc.isActive ? (
                        <Badge
                          size="sm"
                          layoutClassName="px-2 py-0.5 text-xs font-medium"
                          borderClassName="border border-primary-300 dark:border-primary-700"
                          backgroundClassName="bg-primary-100 dark:bg-primary-900/40"
                          textClassName="text-primary-700 dark:text-primary-200"
                        >
                          {t('paymentSettings.activeBadge')}
                        </Badge>
                      ) : null}
                    </Box>
                    <Typography
                      as="p"
                      size="sm"
                      layoutClassName="font-mono"
                      textClassName="text-slate-600 dark:text-slate-300"
                    >
                      {acc.accountNumber}
                    </Typography>
                    <Typography
                      as="p"
                      size="sm"
                      layoutClassName="uppercase"
                      textClassName="text-slate-500 dark:text-slate-400"
                    >
                      {acc.accountHolder}
                    </Typography>
                  </Box>
                  <IconButton
                    type="button"
                    label={t('paymentSettings.deleteAccount')}
                    variant="secondary"
                    disabled={mutating}
                    backgroundClassName="bg-red-50 dark:bg-red-900/20"
                    hoverClassName="hover:bg-red-100 dark:hover:bg-red-900/30"
                    textClassName="text-red-600 dark:text-red-300"
                    onClick={() => handleRemove(acc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </Box>

                <Button
                  type="button"
                  onClick={() => handleSetActive(acc.id)}
                  disabled={mutating || acc.isActive}
                  leftIcon={acc.isActive ? <Check /> : undefined}
                  iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
                  sizeClassName="px-3 py-1.5"
                  backgroundClassName={acc.isActive ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-white dark:bg-slate-800'}
                  borderClassName={acc.isActive ? 'border border-primary-300 dark:border-primary-700' : 'border border-slate-300 dark:border-slate-600'}
                  hoverClassName={acc.isActive ? '' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}
                  textClassName={acc.isActive ? 'text-xs font-semibold text-primary-700 dark:text-primary-200' : 'text-xs font-semibold text-slate-600 dark:text-slate-300'}
                  roundedClassName="rounded-lg"
                  layoutClassName="inline-flex items-center justify-center gap-2"
                  stateClassName="transition-colors disabled:cursor-not-allowed"
                  variant="secondary"
                  disableVariantHover
                  disableVariantTextColor
                >
                  {acc.isActive ? t('paymentSettings.inUse') : t('paymentSettings.useThis')}
                </Button>
              </Box>
            ))}
          </Box>
        )}

        <Typography size="xs" variant="muted" layoutClassName="mt-3">
          {t('paymentSettings.hint')}
        </Typography>
      </Card>
    </Box>
  );
};

export default PaymentSettingsTab;
