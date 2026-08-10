import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  isPaymentSpeakerEnabled,
  playNotificationSound,
  setPaymentSpeakerEnabled,
  speakPaymentAmount,
} from '@/utils/sound';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Switch from '@/components/ui/Switch';
import Typography from '@/components/ui/Typography';

/** Số tiền demo khi bấm "Test loa" — nghe thử câu "Đã nhận ... đồng". */
const DEMO_AMOUNT = 88_000;

/**
 * Card cấu hình "loa thanh toán": bật/tắt đọc số tiền bằng giọng nói khi có tiền vào,
 * kèm nút test để nghe thử ngay. Đặt trong trang cài đặt SePay (phần nhận tiền).
 */
const PaymentSpeakerCard: React.FC = () => {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState<boolean>(() => isPaymentSpeakerEnabled());

  const handleToggle = (next: boolean) => {
    setEnabled(next);
    setPaymentSpeakerEnabled(next);
  };

  const handleTest = () => {
    playNotificationSound();
    speakPaymentAmount(DEMO_AMOUNT);
    toast.success(t('paymentSettings.speakerTestToast'));
  };

  return (
    <Card padding="lg">
      <Box
        layoutClassName="flex items-center gap-2 mb-3"
      >
        <Volume2 className="h-5 w-5 text-primary-500" />
        <Heading level={3} textClassName="text-base font-semibold">
          {t('paymentSettings.speakerTitle')}
        </Heading>
      </Box>

      <Typography size="sm" variant="muted" layoutClassName="mb-4">
        {t('paymentSettings.speakerDesc')}
      </Typography>

      <Box layoutClassName="flex items-center justify-between gap-4">
        <Box layoutClassName="flex items-center gap-3">
          <Switch checked={enabled} onCheckedChange={handleToggle} />
          <Typography as="span" size="sm" textClassName="text-slate-700 dark:text-slate-200">
            {t('paymentSettings.speakerEnable')}
          </Typography>
        </Box>

        <Button
          type="button"
          onClick={handleTest}
          leftIcon={<Volume2 />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          sizeClassName="px-4 py-2"
          backgroundClassName="bg-primary-600"
          hoverClassName="hover:bg-primary-700"
          textClassName="text-sm font-medium text-white"
          roundedClassName="rounded-lg"
          layoutClassName="inline-flex items-center gap-2"
          stateClassName="transition-colors"
          disableVariantHover
          disableVariantTextColor
        >
          {t('paymentSettings.speakerTest')}
        </Button>
      </Box>
    </Card>
  );
};

export default PaymentSpeakerCard;
