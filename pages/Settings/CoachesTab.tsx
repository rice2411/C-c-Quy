/**
 * CoachesTab — quản lý danh bạ nhà xe (dùng lại cho hình thức "Ship xe khách").
 * Fetch + save-all qua coachService. Mỗi nhà xe 1 thẻ có các ô nhập; thêm/xoá/lưu.
 */
import React, { useEffect, useState } from 'react';
import { Bus, Plus, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCoaches, saveCoaches } from '@/services/coachService';
import { Coach, generateCoachId } from '@/types/coach';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';

const CoachesTab: React.FC = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchCoaches()
      .then((list) => { if (alive) setCoaches(list); })
      .catch(() => toast.error('Không tải được danh bạ nhà xe'))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const addCoach = () => {
    setCoaches((prev) => [
      ...prev,
      { id: generateCoachId('coach'), name: '', phone: '', route: '', pickupPoint: '', defaultFee: 0, note: '', sortOrder: prev.length },
    ]);
    setDirty(true);
  };

  const updateCoach = (id: string, patch: Partial<Coach>) => {
    setCoaches((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setDirty(true);
  };

  const removeCoach = (id: string) => {
    setCoaches((prev) => prev.filter((c) => c.id !== id).map((c, i) => ({ ...c, sortOrder: i })));
    setDirty(true);
  };

  const handleSave = async () => {
    const cleaned = coaches
      .map((c, i) => ({ ...c, name: c.name.trim(), sortOrder: i }))
      .filter((c) => c.name);
    if (cleaned.length !== coaches.length) {
      toast.error('Nhà xe phải có tên — bỏ qua dòng trống');
    }
    setSaving(true);
    try {
      const saved = await saveCoaches(cleaned);
      setCoaches(saved);
      setDirty(false);
      toast.success('Đã lưu danh bạ nhà xe');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box layoutClassName="flex items-center justify-center p-12">
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-4">
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
        <Box>
          <Heading level={3} layoutClassName="flex items-center gap-2" textClassName="text-base font-semibold">
            <Bus className="h-5 w-5 text-primary-500" />
            Danh bạ nhà xe
          </Heading>
          <Typography size="xs" variant="muted" layoutClassName="mt-1">
            Lưu thông tin nhà xe để chọn nhanh khi tạo đơn "Ship xe khách".
          </Typography>
        </Box>
        <Box layoutClassName="flex items-center gap-2">
          <Button
            type="button"
            onClick={addCoach}
            leftIcon={<Plus />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
            sizeClassName="px-3 py-1.5 text-xs"
            backgroundClassName="bg-primary-50 dark:bg-primary-900/20"
            textClassName="font-semibold text-primary-700 dark:text-primary-300"
            borderClassName="border border-primary-200 dark:border-primary-800"
            roundedClassName="rounded-lg"
            layoutClassName="inline-flex items-center gap-1.5"
            disableVariantHover
            disableVariantTextColor
          >
            Thêm nhà xe
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            leftIcon={saving ? <Spinner size="sm" textClassName="text-white" borderClassName="border-white" /> : <Save />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-4 py-2 text-sm"
            backgroundClassName="bg-primary-600"
            textClassName="font-semibold text-white"
            roundedClassName="rounded-xl"
            layoutClassName="inline-flex items-center gap-2 disabled:opacity-50"
            disableVariantHover
            disableVariantTextColor
          >
            {saving ? 'Đang lưu…' : 'Lưu'}
          </Button>
        </Box>
      </Box>

      {coaches.length === 0 ? (
        <Typography size="xs" variant="muted">Chưa có nhà xe nào. Bấm "Thêm nhà xe".</Typography>
      ) : (
        <Box layoutClassName="space-y-3">
          {coaches.map((c) => (
            <Box
              key={c.id}
              layoutClassName="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2"
              roundedClassName="rounded-xl"
              borderClassName="border border-slate-200 dark:border-slate-700"
              backgroundClassName="bg-slate-50/60 dark:bg-slate-800/40"
            >
              <Box>
                <Label htmlFor={`coach-name-${c.id}`}>Tên nhà xe</Label>
                <Input id={`coach-name-${c.id}`} value={c.name} onChange={(e) => updateCoach(c.id, { name: e.target.value })} placeholder="VD: Nhà xe Phương Trang" />
              </Box>
              <Box>
                <Label htmlFor={`coach-phone-${c.id}`}>SĐT</Label>
                <Input id={`coach-phone-${c.id}`} value={c.phone ?? ''} onChange={(e) => updateCoach(c.id, { phone: e.target.value })} placeholder="09xx xxx xxx" />
              </Box>
              <Box>
                <Label htmlFor={`coach-route-${c.id}`}>Tuyến (bến đi → bến đến)</Label>
                <Input id={`coach-route-${c.id}`} value={c.route ?? ''} onChange={(e) => updateCoach(c.id, { route: e.target.value })} placeholder="VD: Bến Miền Đông → Đà Lạt" />
              </Box>
              <Box>
                <Label htmlFor={`coach-pickup-${c.id}`}>Điểm nhận/gửi hàng</Label>
                <Input id={`coach-pickup-${c.id}`} value={c.pickupPoint ?? ''} onChange={(e) => updateCoach(c.id, { pickupPoint: e.target.value })} placeholder="VD: Quầy gửi hàng bến xe" />
              </Box>
              <Box>
                <Label htmlFor={`coach-fee-${c.id}`}>Phí gửi mặc định (VND)</Label>
                <Input
                  id={`coach-fee-${c.id}`}
                  type="number"
                  min={0}
                  step={1000}
                  value={c.defaultFee ?? 0}
                  onChange={(e) => updateCoach(c.id, { defaultFee: Math.max(0, Number(e.target.value) || 0) })}
                />
              </Box>
              <Box layoutClassName="flex items-end gap-2">
                <Box layoutClassName="min-w-0 flex-1">
                  <Label htmlFor={`coach-note-${c.id}`}>Ghi chú</Label>
                  <Input id={`coach-note-${c.id}`} value={c.note ?? ''} onChange={(e) => updateCoach(c.id, { note: e.target.value })} placeholder="Ghi chú thêm" />
                </Box>
                <IconButton
                  label="Xoá nhà xe"
                  variant="danger"
                  size="md"
                  onClick={() => removeCoach(c.id)}
                  roundedClassName="rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Card>
  );
};

export default CoachesTab;
