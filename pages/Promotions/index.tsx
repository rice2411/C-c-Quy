import React, { useEffect, useState } from 'react';
import { Plus, Tag, Ticket, LayoutGrid, List, Table as TableIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Promotion } from '@/types/promotion';
import { usePromotions, usePromotionMutations } from '@/hooks/queries/usePromotionsQuery';
import { useProducts } from '@/hooks/queries/useProductsQuery';
import { useCategories } from '@/hooks/queries/useCategoriesQuery';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import IconButton from '@/components/ui/IconButton';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmModal from '@/components/ConfirmModal';
import PromotionFormPanel from './components/PromotionFormPanel';
import PromotionCard from './components/PromotionCard';
import PromotionGridCard from './components/PromotionGridCard';
import PromotionTable from './components/PromotionTable';
import ReopenModal from './components/ReopenModal';

type PromotionViewMode = 'list' | 'grid' | 'table';

const VIEW_OPTIONS: { id: PromotionViewMode; Icon: React.ComponentType<{ className?: string }>; title: string }[] = [
  { id: 'list', Icon: List, title: 'Danh sách' },
  { id: 'grid', Icon: LayoutGrid, title: 'Lưới' },
  { id: 'table', Icon: TableIcon, title: 'Bảng' },
];

const PromotionsPage: React.FC = () => {
  const { userData } = useAuth();
  const { promotions, loading, error } = usePromotions();
  const { products } = useProducts();
  const { categories } = useCategories();
  const { addPromotion, updatePromotion, deletePromotion, reopenPromotion } = usePromotionMutations();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reopenTarget, setReopenTarget] = useState<Promotion | null>(null);
  const [reopening, setReopening] = useState(false);

  const [viewMode, setViewMode] = useState<PromotionViewMode>(() => {
    if (typeof window === 'undefined') return 'list';
    return (localStorage.getItem('promotion-view-mode') as PromotionViewMode) || 'list';
  });
  useEffect(() => {
    localStorage.setItem('promotion-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (error) toast.error('Không tải được danh sách khuyến mãi');
  }, [error]);

  const openAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (payload: Partial<Promotion>) => {
    setSaving(true);
    try {
      if (editing) {
        await updatePromotion({ id: editing.id, data: payload });
        toast.success('Đã cập nhật khuyến mãi');
      } else {
        await addPromotion({ ...payload, createdBy: userData?.uid });
        toast.success('Đã tạo khuyến mãi');
      }
      closeForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không thể lưu khuyến mãi');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePromotion(deleteTarget.id);
      toast.success('Đã xoá khuyến mãi');
      setDeleteTarget(null);
    } catch {
      toast.error('Không thể xoá');
    } finally {
      setDeleting(false);
    }
  };

  const confirmReopen = async (data: { startAt: string | null; endAt: string | null }) => {
    if (!reopenTarget) return;
    setReopening(true);
    try {
      await reopenPromotion({ id: reopenTarget.id, data });
      toast.success('Đã mở lại chương trình cho đợt mới');
      setReopenTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không thể mở lại');
    } finally {
      setReopening(false);
    }
  };

  if (loading) {
    return (
      <Box layoutClassName="flex flex-1 items-center justify-center py-16">
        <Spinner size="lg" textClassName="text-primary-500" />
      </Box>
    );
  }

  return (
    <Box layoutClassName="flex h-full flex-col space-y-4 p-4">
      {/* Header */}
      <Box layoutClassName="flex items-center justify-between gap-3">
        <Box layoutClassName="flex items-center gap-2">
          <Box layoutClassName="flex h-9 w-9 items-center justify-center rounded-lg" backgroundClassName="bg-primary-100 dark:bg-primary-900/30">
            <Tag className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </Box>
          <Heading level={4}>Khuyến mãi</Heading>
          <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-slate-500 dark:text-slate-300">
            {promotions.length}
          </Badge>
        </Box>
        <Box layoutClassName="flex items-center gap-2">
          {/* Chuyển chế độ hiển thị: danh sách / lưới / bảng */}
          <Box layoutClassName="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-600 dark:bg-slate-800">
            {VIEW_OPTIONS.map(({ id, Icon, title }) => (
              <IconButton
                key={id}
                label={title}
                onClick={() => setViewMode(id)}
                variant="ghost"
                size="sm"
                backgroundClassName={viewMode === id ? 'bg-primary-500 hover:bg-primary-600' : 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}
                textClassName={viewMode === id ? 'text-white' : 'text-slate-500'}
                shadowClassName={viewMode === id ? 'shadow-sm' : ''}
                roundedClassName="rounded-md"
              >
                <Icon className="h-3.5 w-3.5" />
              </IconButton>
            ))}
          </Box>
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>
            Thêm khuyến mãi
          </Button>
        </Box>
      </Box>

      {/* Danh sách */}
      {promotions.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Ticket className="h-8 w-8" />}
            title="Chưa có chương trình khuyến mãi"
            description="Tạo chương trình đầu tiên để áp giảm giá khi lên đơn."
          />
        </Card>
      ) : viewMode === 'table' ? (
        <PromotionTable promotions={promotions} categories={categories} onEdit={openEdit} onDelete={setDeleteTarget} onReopen={setReopenTarget} />
      ) : viewMode === 'grid' ? (
        <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-2">
          {promotions.map((p) => (
            <PromotionGridCard key={p.id} promotion={p} categories={categories} onEdit={openEdit} onDelete={setDeleteTarget} onReopen={setReopenTarget} />
          ))}
        </Box>
      ) : (
        <Box layoutClassName="space-y-2.5">
          {promotions.map((p) => (
            <PromotionCard key={p.id} promotion={p} categories={categories} onEdit={openEdit} onDelete={setDeleteTarget} onReopen={setReopenTarget} />
          ))}
        </Box>
      )}

      {/* Form tạo/sửa */}
      <PromotionFormPanel
        isOpen={showForm}
        initial={editing}
        products={products}
        categories={categories}
        saving={saving}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      {/* Mở lại đợt mới */}
      <ReopenModal
        target={reopenTarget}
        loading={reopening}
        onClose={() => setReopenTarget(null)}
        onConfirm={confirmReopen}
      />

      {/* Xác nhận xoá */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Xoá khuyến mãi"
        message={`Xoá chương trình "${deleteTarget?.name ?? ''}"? Hành động không thể hoàn tác.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
      />
    </Box>
  );
};

export default PromotionsPage;
