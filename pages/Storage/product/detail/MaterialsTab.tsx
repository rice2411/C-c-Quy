/**
 * MaterialsTab — tab "Nguyên liệu" list.
 */
import React from 'react';
import type { Product } from '@/types';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';

interface MaterialsTabProps {
  product: Product;
}

const MaterialsTab: React.FC<MaterialsTabProps> = ({ product }) => (
  <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700">
    {!product.materials || product.materials.length === 0 ? (
      <Typography size="sm" variant="muted" layoutClassName="text-center py-6">
        Chưa định nghĩa công thức nguyên liệu cho sản phẩm này.
      </Typography>
    ) : (
      <Box layoutClassName="space-y-2">
        <Typography size="xs" variant="muted" layoutClassName="font-bold uppercase tracking-wider">
          {product.materials.length} nguyên liệu
        </Typography>
        {product.materials.map((m, idx) => (
          <Box
            key={idx}
            layoutClassName="flex items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-slate-700"
          >
            <Typography size="sm">{m.materialId}</Typography>
            <Typography size="sm" layoutClassName="font-semibold">x{m.quantity}</Typography>
          </Box>
        ))}
      </Box>
    )}
  </Card>
);

export default MaterialsTab;
