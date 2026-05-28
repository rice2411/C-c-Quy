/**
 * InfoTab — tab "Thông tin" trong ProductDetailPage.
 */
import React from 'react';
import type { Product } from '@/types';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';

const formatDateShort = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const InfoRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <Box layoutClassName="flex items-center justify-between gap-2 rounded-lg border border-slate-100 p-2 dark:border-slate-700">
    <Typography size="xs" variant="muted" layoutClassName="font-medium">{label}</Typography>
    <Typography size="xs" layoutClassName={`truncate font-semibold ${mono ? 'font-mono' : ''}`}>{value}</Typography>
  </Box>
);

interface InfoTabProps {
  product: Product;
}

const InfoTab: React.FC<InfoTabProps> = ({ product }) => (
  <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
    <Heading level={3} textClassName="text-sm font-bold uppercase tracking-wider">Mô tả</Heading>
    <Typography size="sm" layoutClassName="whitespace-pre-wrap text-slate-700 dark:text-slate-200">
      {product.description || <em className="text-slate-400">— Chưa có mô tả —</em>}
    </Typography>
    <Box layoutClassName="grid gap-2 pt-3 sm:grid-cols-2">
      <InfoRow label="ID" value={product.id} mono />
      <InfoRow label="Ngày tạo" value={formatDateShort(product.createdAt)} />
      <InfoRow
        label="Tỷ lệ HH"
        value={product.commissionRate ? `${(product.commissionRate * 100).toFixed(1)}%` : '—'}
      />
      <InfoRow label="Số nguyên liệu" value={String(product.materials?.length ?? 0)} />
    </Box>
  </Card>
);

export default InfoTab;
