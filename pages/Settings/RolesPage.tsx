import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, Plus, Trash2, Check, Save, Lock } from 'lucide-react';
import { useRoles, useRoleMutations } from '@/hooks/queries/useRolesQuery';
import { RolePermissions } from '@/types/user';
import { PERMISSION_MODULES, PERM_ACTIONS, PERM_GROUPS, type PermAction } from '@/config/permissionModules';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import IconButton from '@/components/ui/IconButton';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';

const eq = (a: RolePermissions, b: RolePermissions): boolean =>
  JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});

/** Cài đặt → Quyền và Tính năng: chọn 1 quyền → bật/tắt từng hành động (Xem/Tạo/Sửa/Xóa) theo module. */
const RolesPage: React.FC = () => {
  const { roles, loading } = useRoles();
  const { save, remove, setPermissions, saving } = useRoleMutations();

  const [selectedKey, setSelectedKey] = useState<string>('');
  const [draft, setDraft] = useState<RolePermissions>({});
  const [renames, setRenames] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState('');

  // Chọn role đầu tiên khi tải xong.
  useEffect(() => {
    if (!selectedKey && roles.length) setSelectedKey(roles[0].key);
    setRenames(Object.fromEntries(roles.map((r) => [r.key, r.name])));
  }, [roles, selectedKey]);

  const selected = useMemo(() => roles.find((r) => r.key === selectedKey), [roles, selectedKey]);
  const savedPerms = selected?.permissions ?? {};

  // Nạp draft mỗi khi đổi role.
  useEffect(() => {
    setDraft(JSON.parse(JSON.stringify(selected?.permissions ?? {})));
  }, [selectedKey, selected?.permissions]);

  const isSuper = selectedKey === 'super_admin';
  const dirty = !eq(draft, savedPerms);

  const toggle = (moduleKey: string, action: PermAction) => {
    if (isSuper) return;
    setDraft((prev) => {
      const mod = { ...(prev[moduleKey] ?? {}) };
      mod[action] = !mod[action];
      return { ...prev, [moduleKey]: mod };
    });
  };

  const savePerms = async () => {
    try {
      await setPermissions(selectedKey, draft);
      toast.success('Đã lưu phân quyền');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lưu thất bại');
    }
  };

  const handleRename = async (key: string) => {
    const name = (renames[key] ?? '').trim();
    if (!name) return;
    try {
      await save({ key, name });
      toast.success('Đã lưu vai trò');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lưu thất bại');
    }
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await save({ name });
      setNewName('');
      toast.success('Đã thêm vai trò');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Thêm thất bại');
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await remove(key);
      if (selectedKey === key) setSelectedKey('');
      toast.success('Đã xoá vai trò');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xoá thất bại');
    }
  };

  return (
    <Box layoutClassName="flex h-full flex-col gap-4">
      <Box layoutClassName="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary-500" />
        <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
          Quyền và Tính năng
        </Heading>
      </Box>

      {loading ? (
        <Box layoutClassName="flex items-center gap-2 py-10">
          <Spinner /> <Typography size="sm" variant="muted">Đang tải…</Typography>
        </Box>
      ) : (
        <Box layoutClassName="grid flex-1 gap-4 md:grid-cols-[260px_1fr]">
          {/* ── Cột trái: danh sách quyền ── */}
          <Card padding="none" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="flex flex-col overflow-hidden">
            <Box layoutClassName="border-b border-slate-100 px-3 py-2 dark:border-slate-700">
              <Typography size="xs" layoutClassName="font-semibold uppercase tracking-wide" variant="muted">Quyền (vai trò)</Typography>
            </Box>
            <Box layoutClassName="flex-1 space-y-1 overflow-y-auto p-2">
              {roles.map((r) => {
                const active = r.key === selectedKey;
                const renamed = (renames[r.key] ?? '') !== r.name;
                return (
                  <Box
                    key={r.key}
                    role="button"
                    onClick={() => setSelectedKey(r.key)}
                    layoutClassName="group flex items-center gap-1.5 rounded-lg px-2 py-1.5"
                    borderClassName={active ? 'border border-primary-300 dark:border-primary-700' : 'border border-transparent'}
                    backgroundClassName={active ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-transparent'}
                    hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <Input
                      value={renames[r.key] ?? ''}
                      onChange={(e) => setRenames((p) => ({ ...p, [r.key]: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                      sizeClassName="min-w-0 flex-1 px-1.5 py-0.5 text-sm"
                      borderClassName="border border-transparent"
                      backgroundClassName="bg-transparent"
                      textClassName={active ? 'font-semibold text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-200'}
                    />
                    {renamed && (
                      <IconButton type="button" label="Lưu tên" onClick={() => void handleRename(r.key)} disabled={saving} variant="ghost" textClassName="text-emerald-600" hoverClassName="hover:text-emerald-700">
                        <Check className="h-3.5 w-3.5" />
                      </IconButton>
                    )}
                    {r.builtIn ? (
                      <Badge size="sm" layoutClassName="px-1 py-0 text-[9px]" borderClassName="border-transparent" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-slate-400 dark:text-slate-400">gốc</Badge>
                    ) : (
                      <IconButton type="button" label="Xoá" onClick={() => void handleDelete(r.key)} disabled={saving} variant="ghost" textClassName="text-rose-400" hoverClassName="hover:text-rose-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconButton>
                    )}
                  </Box>
                );
              })}
            </Box>
            <Box layoutClassName="flex items-center gap-1.5 border-t border-slate-100 p-2 dark:border-slate-700">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Thêm vai trò…"
                sizeClassName="min-w-0 flex-1 px-2 py-1 text-sm"
                borderClassName="border border-slate-200 dark:border-slate-600"
                roundedClassName="rounded"
                onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd(); }}
              />
              <IconButton type="button" label="Thêm vai trò" onClick={() => void handleAdd()} disabled={saving || !newName.trim()} variant="ghost" textClassName="text-primary-600" hoverClassName="hover:text-primary-700">
                <Plus className="h-4 w-4" />
              </IconButton>
            </Box>
          </Card>

          {/* ── Cột phải: ma trận tính năng của quyền đang chọn ── */}
          <Card padding="none" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="flex flex-col overflow-hidden">
            <Box layoutClassName="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-slate-700">
              <Box layoutClassName="flex items-center gap-2">
                <Typography size="sm" layoutClassName="font-semibold" textClassName="text-slate-800 dark:text-slate-100">
                  {selected ? `Tính năng · ${selected.name}` : 'Chọn một vai trò'}
                </Typography>
                {isSuper && (
                  <Badge size="sm" layoutClassName="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px]" borderClassName="border-transparent" backgroundClassName="bg-purple-100 dark:bg-purple-900/30" textClassName="text-purple-700 dark:text-purple-300">
                    <Lock className="h-3 w-3" /> luôn full quyền
                  </Badge>
                )}
              </Box>
              <Button
                type="button"
                onClick={() => void savePerms()}
                disabled={saving || !dirty || isSuper || !selected}
                variant="primary"
                leftIcon={<Save />}
                iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
                sizeClassName="px-3 py-1.5 text-sm"
                roundedClassName="rounded-lg"
                backgroundClassName="bg-primary-600"
                hoverClassName="hover:bg-primary-700"
                textClassName="font-medium text-white"
                layoutClassName="inline-flex items-center gap-1.5"
                stateClassName="disabled:cursor-not-allowed disabled:opacity-50"
                disableVariantHover
              >
                Lưu phân quyền
              </Button>
            </Box>

            {selected ? (
              <Box layoutClassName="flex-1 space-y-4 overflow-y-auto p-4">
                {PERM_GROUPS.map((group) => {
                  const mods = PERMISSION_MODULES.filter((m) => m.group === group);
                  if (!mods.length) return null;
                  return (
                    <Box key={group} layoutClassName="space-y-1.5">
                      <Typography size="xs" layoutClassName="font-semibold uppercase tracking-wide" variant="muted">{group}</Typography>
                      {mods.map((m) => (
                        <Box
                          key={m.key}
                          layoutClassName="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2"
                          borderClassName="border border-slate-100 dark:border-slate-700"
                          backgroundClassName="bg-white dark:bg-slate-800"
                        >
                          <Typography size="sm" layoutClassName="font-medium" textClassName="text-slate-800 dark:text-slate-100">{m.label}</Typography>
                          <Box layoutClassName="flex flex-wrap gap-1.5">
                            {PERM_ACTIONS.filter((a) => m.actions.includes(a.key)).map((a) => {
                              const on = isSuper || draft[m.key]?.[a.key] === true;
                              return (
                                <Button
                                  key={a.key}
                                  type="button"
                                  onClick={() => toggle(m.key, a.key)}
                                  disabled={isSuper}
                                  variant={on ? 'primary' : 'secondary'}
                                  sizeClassName="px-2.5 py-1 text-xs"
                                  roundedClassName="rounded-md"
                                  borderClassName={on ? 'border border-primary-600' : 'border border-slate-200 dark:border-slate-600'}
                                  backgroundClassName={on ? 'bg-primary-600' : 'bg-white dark:bg-slate-800'}
                                  textClassName={on ? 'font-medium text-white' : 'text-slate-500 dark:text-slate-400'}
                                  disableVariantHover
                                  disableVariantTextColor
                                >
                                  {a.label}
                                </Button>
                              );
                            })}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box layoutClassName="flex flex-1 items-center justify-center p-6">
                <Typography size="sm" variant="muted">Chọn một vai trò ở cột trái để cấu hình tính năng.</Typography>
              </Box>
            )}
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default RolesPage;
