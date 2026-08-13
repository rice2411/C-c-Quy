/**
 * CoachesTab — quản lý danh bạ nhà xe, UI theo trang Nhà cung cấp:
 * FilterToolbar (tìm kiếm + Thêm) + lưới Card + modal thêm/sửa. Lưu qua coachService (save-all).
 */
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bus, Coins, MapPin, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCoaches, saveCoaches } from '@/services/coachService';
import { Coach, generateCoachId } from '@/types/coach';
import { formatVND } from '@/utils/format/currencyUtil';
import { normalizeSearchText } from '@/utils/format/stringUtil';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import IconButton from '@/components/ui/IconButton';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';
import ViewToggle from '@/components/ui/ViewToggle';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
import FilterToolbar from '@/components/shared/FilterToolbar';
import CoachEditModal from '@/pages/Settings/CoachEditModal';
import { useViewMode } from '@/hooks/useViewMode';

const CoachesTab: React.FC = () => {
  const coachesQuery = useQuery({ queryKey: ['coaches'], queryFn: fetchCoaches });
  const coaches = coachesQuery.data ?? [];

  const [search, setSearch] = useState('');
  const [view, setView] = useViewMode<'list' | 'table' | 'grid'>('coaches-view', 'grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coach | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = normalizeSearchText(search);
    if (!q) return coaches;
    return coaches.filter((c) =>
      [c.name, c.phone, c.route, c.pickupPoint].some((v) => v && normalizeSearchText(v).includes(q)),
    );
  }, [coaches, search]);

  const persist = async (list: Coach[]) => {
    setSaving(true);
    try {
      const saved = await saveCoaches(list.map((c, i) => ({ ...c, sortOrder: i })));
      coachesQuery.refetch();
      return saved;
    } catch (e: any) {
      toast.error(e?.message || 'Lưu thất bại');
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c: Coach) => { setEditing(c); setModalOpen(true); };

  const handleSaveCoach = async (coach: Coach) => {
    const withId: Coach = coach.id ? coach : { ...coach, id: generateCoachId(coach.name) };
    const exists = coaches.some((c) => c.id === withId.id);
    const next = exists ? coaches.map((c) => (c.id === withId.id ? withId : c)) : [...coaches, withId];
    try {
      await persist(next);
      toast.success(exists ? 'Đã cập nhật nhà xe' : 'Đã thêm nhà xe');
      setModalOpen(false);
    } catch { /* toast đã hiện */ }
  };

  const handleDelete = async (c: Coach) => {
    if (!window.confirm(`Xoá nhà xe "${c.name}"?`)) return;
    try {
      await persist(coaches.filter((x) => x.id !== c.id));
      toast.success('Đã xoá nhà xe');
    } catch { /* */ }
  };

  if (coachesQuery.isLoading) {
    return (
      <Box layoutClassName="flex items-center justify-center p-12">
        <Spinner size="lg" />
      </Box>
    );
  }

  const addButton = (
    <Button
      type="button"
      onClick={openAdd}
      leftIcon={<Plus />}
      iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
      backgroundClassName="bg-primary-600"
      hoverClassName="hover:bg-primary-700"
      textClassName="font-semibold text-white"
      roundedClassName="rounded-xl"
      shadowClassName="shadow-sm shadow-primary-200 dark:shadow-none"
      sizeClassName="px-4 py-2 text-sm"
      layoutClassName="inline-flex items-center gap-1.5"
      stateClassName="transition-colors"
      variant="primary"
      disableVariantHover
      disableVariantTextColor
    >
      Thêm nhà xe
    </Button>
  );

  return (
    <Box layoutClassName="space-y-3">
      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm nhà xe / SĐT / tuyến…"
        viewToggle={<ViewToggle value={view} onChange={(v) => setView(v as 'list' | 'table' | 'grid')} />}
        actions={addButton}
        stats={
          <Typography size="xs" variant="muted" layoutClassName="text-right">
            {filtered.length} / {coaches.length} nhà xe
          </Typography>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState icon={<Bus className="h-6 w-6" />} title="Chưa có nhà xe phù hợp." />
      ) : view === 'table' ? (
        <Box
          layoutClassName="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-900"
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell textClassName="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tên nhà xe</TableHeaderCell>
                <TableHeaderCell textClassName="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">SĐT</TableHeaderCell>
                <TableHeaderCell textClassName="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tuyến</TableHeaderCell>
                <TableHeaderCell textClassName="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Điểm gửi</TableHeaderCell>
                <TableHeaderCell textClassName="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Phí</TableHeaderCell>
                <TableHeaderCell layoutClassName="w-20">
                  <Typography as="span" size="xs" layoutClassName="sr-only">Thao tác</Typography>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} borderClassName="border-t border-slate-100 dark:border-slate-800" hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-800/60" stateClassName="transition-colors">
                  <TableCell>
                    <Typography size="sm" layoutClassName="font-semibold" textClassName="text-slate-900 dark:text-white">{c.name}</Typography>
                  </TableCell>
                  <TableCell textClassName="text-slate-600 dark:text-slate-300">{c.phone || '—'}</TableCell>
                  <TableCell textClassName="text-slate-600 dark:text-slate-300">{c.route || '—'}</TableCell>
                  <TableCell textClassName="text-slate-600 dark:text-slate-300">{c.pickupPoint || '—'}</TableCell>
                  <TableCell textClassName="text-slate-600 dark:text-slate-300">{c.defaultFee ? formatVND(c.defaultFee) : '—'}</TableCell>
                  <TableCell layoutClassName="text-right">
                    <Box layoutClassName="inline-flex items-center gap-1">
                      <IconButton label="Sửa" size="sm" variant="ghost" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton label="Xoá" size="sm" variant="danger" onClick={() => handleDelete(c)}>
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : (
        <Box layoutClassName={`grid gap-3 p-1 ${view === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
          {filtered.map((c) => (
            <Card key={c.id} padding="md" layoutClassName="flex flex-col gap-2" borderClassName="border-slate-200 dark:border-slate-700">
              <Box layoutClassName="flex items-start gap-2">
                <Box
                  layoutClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  backgroundClassName="bg-primary-100 dark:bg-primary-950/60"
                >
                  <Bus className="h-4 w-4 text-primary-700 dark:text-primary-300" />
                </Box>
                <Box layoutClassName="min-w-0 flex-1">
                  <Typography size="base" layoutClassName="break-words font-semibold" textClassName="text-slate-900 dark:text-white">
                    {c.name}
                  </Typography>
                  {c.route ? (
                    <Typography size="xs" variant="muted" layoutClassName="mt-0.5 break-words">{c.route}</Typography>
                  ) : null}
                </Box>
                {c.defaultFee ? (
                  <Badge
                    size="sm"
                    borderClassName="border-transparent"
                    backgroundClassName="bg-emerald-50 dark:bg-emerald-950/40"
                    textClassName="text-emerald-700 dark:text-emerald-300"
                    layoutClassName="shrink-0 gap-1"
                  >
                    <Coins className="h-3 w-3" /> {formatVND(c.defaultFee)}
                  </Badge>
                ) : null}
              </Box>

              <Box layoutClassName="flex flex-wrap gap-x-3 gap-y-1">
                {c.phone ? (
                  <Typography as="span" size="xs" variant="muted" layoutClassName="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {c.phone}
                  </Typography>
                ) : null}
                {c.pickupPoint ? (
                  <Typography as="span" size="xs" variant="muted" layoutClassName="inline-flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" /> {c.pickupPoint}
                  </Typography>
                ) : null}
              </Box>

              {c.note ? (
                <Typography size="xs" variant="muted" layoutClassName="break-words italic">{c.note}</Typography>
              ) : null}

              <Box layoutClassName="mt-auto flex gap-2 border-t border-slate-100 pt-2 dark:border-slate-700/60">
                <Button
                  type="button"
                  onClick={() => openEdit(c)}
                  leftIcon={<Pencil />}
                  iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
                  variant="secondary"
                  disableVariantHover
                  disableVariantTextColor
                  borderClassName="border border-slate-200 dark:border-slate-600"
                  backgroundClassName="bg-white dark:bg-slate-800"
                  hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
                  textClassName="text-xs font-medium text-slate-700 dark:text-slate-200"
                  roundedClassName="rounded-lg"
                  sizeClassName="px-3 py-1.5"
                  layoutClassName="inline-flex flex-1 items-center justify-center gap-1.5"
                >
                  Sửa
                </Button>
                <Button
                  type="button"
                  onClick={() => handleDelete(c)}
                  leftIcon={<Trash2 />}
                  iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
                  variant="secondary"
                  disableVariantHover
                  disableVariantTextColor
                  borderClassName="border border-red-200 dark:border-red-700/50"
                  backgroundClassName="bg-red-50 dark:bg-red-900/20"
                  hoverClassName="hover:bg-red-100 dark:hover:bg-red-900/30"
                  textClassName="text-xs font-medium text-red-700 dark:text-red-300"
                  roundedClassName="rounded-lg"
                  sizeClassName="px-3 py-1.5"
                  layoutClassName="inline-flex items-center justify-center gap-1.5"
                >
                  Xoá
                </Button>
              </Box>
            </Card>
          ))}
        </Box>
      )}

      <CoachEditModal
        isOpen={modalOpen}
        initial={editing}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCoach}
      />
    </Box>
  );
};

export default CoachesTab;
