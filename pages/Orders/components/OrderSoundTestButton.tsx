import React from 'react';
import { Volume2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { playNotificationSound, speakPaymentAmount } from '@/utils/sound';
import IconButton from '@/components/ui/IconButton';

interface OrderSoundTestButtonProps {
  /** Số tiền đơn hàng để loa đọc "Đã nhận ... đồng". */
  amount: number;
}

/**
 * Nút test loa thanh toán ngay trên từng đơn — phát tiếng "ting" + đọc giá trị
 * đơn hàng tương ứng (giống loa khi có tiền vào thật). Không mở chi tiết đơn.
 */
const OrderSoundTestButton: React.FC<OrderSoundTestButtonProps> = ({ amount }) => {
  const { t } = useLanguage();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    playNotificationSound();
    speakPaymentAmount(Number(amount) || 0);
  };

  return (
    <IconButton
      label={t('paymentSettings.speakerTest')}
      variant="secondary"
      size="sm"
      onClick={handleClick}
      backgroundClassName="bg-primary-50 dark:bg-primary-900/20"
      borderClassName="border border-primary-200 dark:border-primary-800"
      hoverClassName="hover:bg-primary-100 dark:hover:bg-primary-900/30"
      textClassName="text-primary-600 dark:text-primary-300"
    >
      <Volume2 className="h-4 w-4" />
    </IconButton>
  );
};

export default OrderSoundTestButton;
