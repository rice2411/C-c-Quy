/**
 * FlavorsTab — quản lý danh sách "vị" (tên + màu) tập trung.
 * Thêm/sửa/xoá; lưu ghi đè toàn bộ qua saveFlavors.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { IceCream, Plus, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ProductFlavor } from '@/types/flavor';
import { DEFAULT_FLAVOR_COLORS } from '@/types/flavor';
import { generateFlavorId } from '@/services/flavorService';
import { useFlavors, useSaveFlavors } from '@/hooks/queries/useFlavorsQuery';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';

const FlavorsTab: React.FC = () => {
  const { flavors, loading } = useFlavors();
  const { saveFlavors, saving } = useSaveFlavors();

  const [items, setItems] = useState<ProductFlavor[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState(DEFAULT_FLAVOR_COLORS[0]);

  useEffect(() => {
    if (!seeded && flavors.length >= 0 && !loading) {
      setItems(flavors);
      setSeeded(true);
    }
  }, [flavors, loading, seeded]);

  const nextColor = useMemo(
    () => DEFAULT_FLAVOR_COLORS[items.length % DEFAULT_FLAVOR_COLORS.length],
    [items.length],
  );
  useEffect(() => { setDraftColor(nextColor); }, [nextColor]);

  const persist = async (next: ProductFlavor[]) => {
    const prev = items;
    setItems(next);
    try {
      await saveFlavors(next);
    } catch {
      setItems(prev);
      toast.error('Không lưu được vị');
    }
  };

  const handleAdd = () => {
    const name = draftName.trim().replace(/\s+/g, ' ');
    if (!name) return;
    if (items.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Vị này đã có');
      return;
    }
    void persist([...items, { id: generateFlavorId(name), name, color: draftColor, sortOrder: items.length }]);
    setDraftName('');
  };

  const handleColor = (id: string, color: string) => {
    void persist(items.map((f) => (f.id === id ? { ...f, color } : f)));
  };

  const handleDelete = (id: string) => {
    void persist(items.filter((f) => f.id !== id));
  };

  return (
    <Box layoutClassName="flex h-full flex-col space-y-4 sm:space-y-5">
      <Card padding="md" layoutClassName="space-y-4">
        <Box layoutClassName="flex items-center gap-2">
          <IceCream className="h-5 w-5 text-primary-500" />
          <Heading level={3} textClassName="text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
            Danh sách vị
          </Heading>
          {saving ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
        </Box>

        {/* Thêm vị mới */}
        <Box layoutClassName="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
            placeholder="Tên vị mới (vd: Matcha)"
            backgroundClassName="bg-slate-50 dark:bg-slate-700"
            containerClassName="flex-1"
          />
          <Box layoutClassName="flex items-center gap-1.5">
            {DEFAULT_FLAVOR_COLORS.map((c) => (
              <Button
                key={c}
                type="button"
                onClick={() => setDraftColor(c)}
                aria-label={`Màu ${c}`}
                variant="ghost"
                disableVariantHover
                disableVariantTextColor
                layoutClassName="h-6 w-6"
                roundedClassName="rounded-full"
                borderClassName={draftColor === c ? 'border-2 border-slate-700 dark:border-white' : 'border border-transparent'}
                style={{ backgroundColor: c }}>
                {' '}
              </Button>
            ))}
          </Box>
          <Button
            type="button"
            onClick={handleAdd}
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            sizeClassName="px-3 py-2 text-sm"
            roundedClassName="rounded-lg">
            Thêm
          </Button>
        </Box>

        {/* Danh sách vị */}
        {items.length === 0 ? (
          <Typography size="sm" variant="muted">Chưa có vị nào. Thêm ở trên.</Typography>
        ) : (
          <Box layoutClassName="flex flex-col gap-2">
            {items.map((f) => (
              <Box
                key={f.id}
                layoutClassName="flex flex-wrap items-center gap-2 rounded-lg p-2"
                borderClassName="border border-slate-100 dark:border-slate-700"
                backgroundClassName="bg-slate-50/60 dark:bg-slate-900/30">
                <Box layoutClassName="h-5 w-5 shrink-0 rounded-full" style={{ backgroundColor: f.color || '#64748b' }} />
                <Typography as="span" size="sm" layoutClassName="min-w-0 flex-1 truncate font-medium" textClassName="text-slate-800 dark:text-slate-100">
                  {f.name}
                </Typography>
                <Box layoutClassName="flex items-center gap-1">
                  {DEFAULT_FLAVOR_COLORS.map((c) => (
                    <Button
                      key={c}
                      type="button"
                      onClick={() => handleColor(f.id, c)}
                      aria-label={`Đổi màu ${c}`}
                      variant="ghost"
                      disableVariantHover
                      disableVariantTextColor
                      layoutClassName="h-5 w-5"
                      roundedClassName="rounded-full"
                      borderClassName={f.color === c ? 'border-2 border-slate-700 dark:border-white' : 'border border-transparent'}
                      style={{ backgroundColor: c }}>
                      {' '}
                    </Button>
                  ))}
                </Box>
                <Button
                  type="button"
                  onClick={() => handleDelete(f.id)}
                  aria-label={`Xoá vị ${f.name}`}
                  variant="ghost"
                  disableVariantHover
                  disableVariantTextColor
                  sizeClassName="p-1.5"
                  roundedClassName="rounded-lg"
                  borderClassName="border border-transparent"
                  textClassName="text-slate-400"
                  hoverClassName="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default FlavorsTab;
