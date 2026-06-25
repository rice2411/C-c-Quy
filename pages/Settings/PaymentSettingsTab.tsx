import React, { useEffect, useState } from 'react';
import { CreditCard, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePaymentConfig } from '@/hooks/usePaymentConfig';
import { formatDateTime } from '@/utils/format/dateUtil';
import { QR_TEMPLATES, SEPAY_BANKS, parseSepayQrLink } from '@/types/paymentConfig';
import type { PaymentConfiguration, QrTemplate } from '@/types/paymentConfig';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Field from '@/components/ui/Field';
import Heading from '@/components/ui/Heading';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';

const PaymentSettingsTab: React.FC = () => {
  const { t } = useLanguage();
  const { config, loading, saving, save } = usePaymentConfig();
  const [draft, setDraft] = useState<PaymentConfiguration>(config);
  const [qrLink, setQrLink] = useState('');

  useEffect(() => { setDraft(config); }, [config]);

  const applyQrLink = (value: string) => {
    const parsed = parseSepayQrLink(value);
    if (!parsed) {
      toast.error(t('paymentSettings.qrLinkInvalid'));
      return;
    }
    setDraft((d) => ({
      ...d,
      ...(parsed.bankCode ? { bankCode: parsed.bankCode } : {}),
      ...(parsed.accountNumber ? { accountNumber: parsed.accountNumber } : {}),
      ...(parsed.qrTemplate
        ? { qrTemplate: parsed.qrTemplate as QrTemplate }
        : {}),
    }));
    toast.success(t('paymentSettings.qrLinkParsed'));
  };

  const handleQrLinkChange = (value: string) => {
    setQrLink(value);
    if (value.trim()) applyQrLink(value);
  };

  const handleSave = async () => {
    const next: PaymentConfiguration = {
      bankCode: draft.bankCode.trim(),
      accountNumber: draft.accountNumber.trim(),
      accountHolder: draft.accountHolder.trim(),
      qrTemplate: draft.qrTemplate,
    };
    if (!next.accountNumber || !next.accountHolder) {
      toast.error(t('paymentSettings.required'));
      return;
    }
    if (!SEPAY_BANKS.some((b) => b.value === next.bankCode)) {
      toast.error(t('paymentSettings.invalidBank'));
      return;
    }
    try {
      await save(next);
      toast.success(t('paymentSettings.saved'));
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
      {/* Section header — không phải page header (parent OrderSettingsTab đã có). */}
      <Box layoutClassName="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
        <Box layoutClassName="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary-500" />
          <Heading level={3} textClassName="text-base font-semibold">{t('paymentSettings.title')}</Heading>
        </Box>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          leftIcon={saving ? <Spinner size="sm" textClassName="text-white" borderClassName="border-white" /> : <Save />}
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
          {saving ? t('paymentSettings.saving') : t('paymentSettings.save')}
        </Button>
      </Box>

      <Card padding="lg">
        <Heading level={3} textClassName="text-base font-semibold mb-3">{t('paymentSettings.bankInfo')}</Heading>

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

        <Box layoutClassName="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('paymentSettings.bankCode')} htmlFor="payment-bank-code">
            <Select
              id="payment-bank-code"
              fullWidth
              value={draft.bankCode}
              onChange={(e) => setDraft((d) => ({ ...d, bankCode: e.target.value }))}
            >
              {SEPAY_BANKS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('paymentSettings.accountNumber')} htmlFor="payment-account-number">
            <Input
              id="payment-account-number"
              type="text"
              value={draft.accountNumber}
              onChange={(e) => setDraft((d) => ({ ...d, accountNumber: e.target.value }))}
              placeholder="96247HTTH1308"
            />
          </Field>
          <Field label={t('paymentSettings.accountHolder')} htmlFor="payment-account-holder">
            <Input
              id="payment-account-holder"
              type="text"
              value={draft.accountHolder}
              onChange={(e) => setDraft((d) => ({ ...d, accountHolder: e.target.value }))}
              placeholder="TON THAT ANH MINH"
            />
          </Field>
          <Field label={t('paymentSettings.qrTemplate')} htmlFor="payment-qr-template">
            <Select
              id="payment-qr-template"
              fullWidth
              value={draft.qrTemplate}
              onChange={(e) => setDraft((d) => ({ ...d, qrTemplate: e.target.value as QrTemplate }))}
            >
              {QR_TEMPLATES.map((tpl) => (
                <option key={tpl.value} value={tpl.value}>
                  {tpl.label}
                </option>
              ))}
            </Select>
          </Field>
        </Box>

        <Typography size="xs" variant="muted" layoutClassName="mt-3">
          {t('paymentSettings.hint')}
        </Typography>

        {draft.updatedAt ? (
          <Typography size="xs" variant="muted" layoutClassName="mt-1">
            {t('paymentSettings.updatedAt')}: {formatDateTime(draft.updatedAt)}
          </Typography>
        ) : null}
      </Card>
    </Box>
  );
};

export default PaymentSettingsTab;
