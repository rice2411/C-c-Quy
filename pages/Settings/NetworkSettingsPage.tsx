import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Wifi, Trash2, Plus, ShieldCheck } from 'lucide-react';
import { routes } from '@/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNetworkGuardConfig, useNetworks } from '@/hooks/queries/useNetworkQuery';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Input from '@/components/ui/Input';
import IconButton from '@/components/ui/IconButton';
import Switch from '@/components/ui/Switch';
import Spinner from '@/components/ui/Spinner';
import Tabs from '@/components/ui/Tabs';
import Typography from '@/components/ui/Typography';

type TabId = 'networks' | 'guard';

const sameSet = (a: string[], b: string[]): boolean =>
  a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i]);

/** Cài đặt Mạng hệ thống: dải mạng được duyệt + màn nào yêu cầu mạng. Route /settings/network. */
const NetworkSettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const { guarded, loading: guardLoading, saveGuarded, saving: guardSaving } = useNetworkGuardConfig();
  const { networks, loading: netLoading, upsertNetwork, deleteNetwork, saving: netSaving, fetchCurrentIp } = useNetworks();

  const [tab, setTab] = useState<TabId>('networks');
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [newLabel, setNewLabel] = useState('');
  const [newCidr, setNewCidr] = useState('');

  useEffect(() => setDraft(new Set(guarded)), [guarded]);

  // Màn có thể gắn guard — loại /settings/* + Dashboard (tránh tự khoá khỏi trang cài đặt).
  const screenItems = useMemo(
    () => routes.filter((r) => !r.path.startsWith('/settings') && r.path !== '/'),
    [],
  );

  const dirty = useMemo(() => !sameSet([...draft], guarded), [draft, guarded]);

  const toggle = (path: string) =>
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const handleSaveGuard = async () => {
    try {
      await saveGuarded([...draft]);
      toast.success('Đã lưu cấu hình guard theo mạng.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lưu thất bại.');
    }
  };

  const handleUseCurrentIp = async () => {
    try {
      const { suggestedCidr } = await fetchCurrentIp();
      setNewCidr(suggestedCidr);
      if (!newLabel) setNewLabel('Wi-Fi quán');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không lấy được IP hiện tại.');
    }
  };

  const handleAddNetwork = async () => {
    if (!newCidr.trim()) return toast.error('Nhập IP / dải mạng (CIDR).');
    try {
      await upsertNetwork({ label: newLabel.trim() || undefined, ipCidr: newCidr.trim(), active: true });
      setNewLabel('');
      setNewCidr('');
      toast.success('Đã thêm dải mạng.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Thêm thất bại.');
    }
  };

  const handleToggleActive = async (id: string, label: string | null, ipCidr: string, active: boolean) => {
    try {
      await upsertNetwork({ id, label: label ?? undefined, ipCidr, active });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Cập nhật thất bại.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xoá dải mạng này?')) return;
    try {
      await deleteNetwork(id);
      toast.success('Đã xoá.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xoá thất bại.');
    }
  };

  return (
    <Box layoutClassName="flex h-full flex-col gap-4 p-4 sm:p-6">
      <Box layoutClassName="flex items-center gap-2">
        <Wifi className="h-5 w-5 text-primary-500" />
        <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
          Mạng hệ thống
        </Heading>
      </Box>
      <Typography size="xs" variant="muted">
        Dải mạng được duyệt dùng chung cho chấm công + các màn bật guard. Chưa có dải nào active → guard tự tắt (không khoá ai).
      </Typography>

      <Tabs
        items={[
          { id: 'networks', label: 'Dải mạng' },
          { id: 'guard', label: 'Màn yêu cầu mạng' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as TabId)}
      />

      <Box layoutClassName="min-h-0 flex-1 space-y-5 overflow-y-auto">
        {/* Danh sách dải mạng */}
        {tab === 'networks' ? (
        <Card padding="md" layoutClassName="space-y-3 p-4" borderClassName="border border-slate-200 dark:border-slate-700">
          <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-slate-700 dark:text-slate-200">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Dải mạng được duyệt
          </Typography>

          <Box layoutClassName="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Box layoutClassName="flex-1">
              <Typography size="xs" variant="muted" layoutClassName="mb-1 block">Nhãn</Typography>
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Wi-Fi quán" fullWidth />
            </Box>
            <Box layoutClassName="flex-1">
              <Typography size="xs" variant="muted" layoutClassName="mb-1 block">IP / dải (CIDR)</Typography>
              <Input value={newCidr} onChange={(e) => setNewCidr(e.target.value)} placeholder="vd 118.68.0.0/16" fullWidth />
            </Box>
            <Button type="button" variant="secondary" size="sm" onClick={() => void handleUseCurrentIp()}>
              Dùng IP hiện tại
            </Button>
            <Button type="button" variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} disabled={netSaving} onClick={() => void handleAddNetwork()}>
              Thêm
            </Button>
          </Box>

          {netLoading ? (
            <Box layoutClassName="flex justify-center py-6"><Spinner size="md" textClassName="text-primary-500" /></Box>
          ) : networks.length === 0 ? (
            <Typography size="sm" variant="muted">Chưa có dải mạng nào — thêm ở trên (guard sẽ không chặn cho tới khi có dải active).</Typography>
          ) : (
            <Box layoutClassName="divide-y divide-slate-100 dark:divide-slate-700/60">
              {networks.map((n) => (
                <Box key={n.id} layoutClassName="flex items-center gap-3 py-2.5">
                  <Box layoutClassName="min-w-0 flex-1">
                    <Typography size="sm" layoutClassName="font-medium" textClassName="text-slate-800 dark:text-slate-100">
                      {n.label || '(không nhãn)'}
                    </Typography>
                    <Typography size="xs" variant="muted" layoutClassName="font-mono">{n.ipCidr}</Typography>
                  </Box>
                  <Switch checked={n.active} onCheckedChange={(v) => void handleToggleActive(n.id, n.label, n.ipCidr, v)} />
                  <IconButton label="Xoá" size="sm" variant="ghost" onClick={() => void handleDelete(n.id)}>
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Card>
        ) : null}

        {/* Toggle guard theo màn */}
        {tab === 'guard' ? (
        <Card padding="md" layoutClassName="space-y-3 p-4" borderClassName="border border-slate-200 dark:border-slate-700">
          <Box layoutClassName="flex flex-wrap items-center justify-between gap-2">
            <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-slate-700 dark:text-slate-200">
              <Wifi className="h-4 w-4 text-primary-500" /> Màn yêu cầu mạng được duyệt
            </Typography>
            <Button type="button" variant="primary" size="sm" leftIcon={<Save className="h-4 w-4" />} disabled={!dirty || guardSaving} onClick={() => void handleSaveGuard()}>
              {guardSaving ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </Box>
          <Typography size="xs" variant="muted">
            Bật = màn đó chỉ mở được khi ở mạng quán (chặn cả FE lẫn API). Trang Cài đặt luôn mở để bạn không tự khoá.
          </Typography>

          {guardLoading ? (
            <Box layoutClassName="flex justify-center py-6"><Spinner size="md" textClassName="text-primary-500" /></Box>
          ) : (
            <Box layoutClassName="divide-y divide-slate-100 dark:divide-slate-700/60">
              {screenItems.map((r) => (
                <Box key={r.path} layoutClassName="flex items-center justify-between gap-3 py-2">
                  <Box layoutClassName="min-w-0 flex-1">
                    <Typography size="sm" layoutClassName="font-medium" textClassName="text-slate-800 dark:text-slate-100">
                      {t(r.labelKey)}
                    </Typography>
                    <Typography size="xs" variant="muted" layoutClassName="font-mono">{r.path}</Typography>
                  </Box>
                  <Switch checked={draft.has(r.path)} onCheckedChange={() => toggle(r.path)} />
                </Box>
              ))}
            </Box>
          )}
        </Card>
        ) : null}
      </Box>
    </Box>
  );
};

export default NetworkSettingsPage;
