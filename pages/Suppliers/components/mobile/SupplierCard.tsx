import React from 'react';
import { Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import Card from '@/components/ui/Card';
import { Supplier } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import IconButton from '@/components/ui/IconButton';
import Typography from '@/components/ui/Typography';

interface SupplierCardProps {
  supplier: Supplier;
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
}

const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onEdit, onDelete }) => {
  const { t } = useLanguage();

  return (
    <Card layoutClassName="relative group">
      <Box layoutClassName="mb-3 flex items-start justify-between">
        <Box layoutClassName="flex items-center gap-3">
          <Box
            layoutClassName="flex h-10 w-10 items-center justify-center text-lg font-bold"
            roundedClassName="rounded-full"
            backgroundClassName="bg-orange-100 dark:bg-orange-900/30"
            textClassName="text-orange-600 dark:text-orange-400"
          >
            {supplier.name.charAt(0).toUpperCase()}
          </Box>
          <Box>
            <Typography as="span" layoutClassName="block font-semibold">{supplier.name}</Typography>
            <Typography as="span" size="xs" variant="muted" layoutClassName="block">ID: {supplier.id.substring(0, 6)}</Typography>
          </Box>
        </Box>
        <Box layoutClassName="flex gap-2">
          <IconButton
            type="button"
            label="Edit"
            onClick={() => onEdit(supplier)}
            variant="ghost"
            layoutClassName="rounded-lg p-2"
            textClassName="text-slate-400"
            hoverClassName="hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-400"
            stateClassName="transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </IconButton>
          <IconButton
            type="button"
            label="Delete"
            onClick={() => onDelete(supplier.id)}
            variant="ghost"
            layoutClassName="rounded-lg p-2"
            textClassName="text-slate-400"
            hoverClassName="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            stateClassName="transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </Box>
      </Box>

      <Box layoutClassName="space-y-2 text-sm" textClassName="text-slate-600 dark:text-slate-300">
        {supplier.contactName && (
          <Box layoutClassName="flex items-center gap-2">
            <Typography as="span" size="xs" layoutClassName="font-medium" textClassName="text-slate-500 dark:text-slate-400">
              {t('suppliers.form.contactName')}:
            </Typography>
            <Typography as="span" size="sm" variant="secondary">{supplier.contactName}</Typography>
          </Box>
        )}
        {supplier.phone && (
          <Box layoutClassName="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <Typography as="span" size="sm" variant="secondary">{supplier.phone}</Typography>
          </Box>
        )}
        {supplier.email && (
          <Box layoutClassName="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            <Typography as="span" size="sm" variant="secondary">{supplier.email}</Typography>
          </Box>
        )}
        {supplier.address && (
          <Box layoutClassName="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <Typography as="span" size="sm" variant="secondary">{supplier.address}</Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default SupplierCard;

