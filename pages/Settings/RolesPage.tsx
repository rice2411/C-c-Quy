import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldCheck, Plus, Trash2, Check, Save, Sparkles, Pencil, X, ChevronsUpDown,
} from 'lucide-react';
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

const TOTAL_ACTIONS = PERMISSION_MODULES.reduce((s, m) => s + m.actions.length, 0);
const grantedCount = (perms: RolePermissions): number =>
  PERMISSION_MODULES.reduce((s, m) => s + m.actions.filter((a) => perms?.[m.key]?.[a]).length, 0);

// ── Màu riêng cho mỗi vai trò (avatar + accent) ──
type RoleColor = { solid: string; soft: string; text: string; bar: string };
const PALETTE: RoleColor[] = [
  { solid: 'bg-blue-600',    soft: 'bg-blue-50 dark:bg-blue-900/20',       text: 'text-blue-700 dark:text-blue-300',       bar: 'bg-blue-500' },
  { solid: 'bg-teal-600',    soft: 'bg-teal-50 dark:bg-teal-900/20',       text: 'text-teal-700 dark:text-teal-300',       bar: 'bg-teal-500' },
  { solid: 'bg-amber-500',   soft: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-700 dark:text-amber-300',     bar: 'bg-amber-500' },
  { solid: 'bg-rose-600',    soft: 'bg-rose-50 dark:bg-rose-900/20',       text: 'text-rose-700 dark:text-rose-300',       bar: 'bg-rose-500' },
  { solid: 'bg-indigo-600',  soft: 'bg-indigo-50 dark:bg-indigo-900/20',   text: 'text-indigo-700 dark:text-indigo-300',   bar: 'bg-indigo-500' },
  { solid: 'bg-emerald-600', soft: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-500' },
  { solid: 'bg-cyan-600',    soft: 'bg-cyan-50 dark:bg-cyan-900/20',       text: 'text-cyan-700 dark:text-cyan-300',       bar: 'bg-cyan-500' },
  { solid: 'bg-orange-600',  soft: 'bg-orange-50 dark:bg-orange-900/20',   text: 'text-orange-700 dark:text-orange-300',   bar: 'bg-orange-500' },
  { solid: 'bg-pink-600',    soft: 'bg-pink-50 dark:bg-pink-900/20',       text: 'text-pink-700 dark:text-pink-300',       bar: 'bg-pink-500' },
  { solid: 'bg-violet-600',  soft: 'bg-violet-50 dark:bg-violet-900/20',   text: 'text-violet-700 dark:text-violet-300',   bar: 'bg-violet-500' },
];
const PURPLE: RoleColor = { solid: 'bg-purple-600', soft: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', bar: 'bg-purple-500' };
const FIXED_COLORS: Record<string, RoleColor> = {
  super_admin: PURPLE,
  admin: PALETTE[0],       // xanh dương
  staff: PALETTE[1],       // teal
  colaborator: PALETTE[2], // hổ phách
};
const hashKey = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};
const roleColor = (key: string): RoleColor => FIXED_COLORS[key] ?? PALETTE[hashKey(key) % PALETTE.length];

/** Cài đặt → Quyền và Tính năng: chọn 1 quyền → bật/tắt từng hành động (Xem/Tạo/Sửa/Xóa) theo module. */
const RolesPage: React.FC = () => {
  const { roles, loading } = useRoles();
  const { save, remove, setPermissions, saving } = useRoleMutations();

  const [selectedKey, setSelectedKey] = useState<string>('');
  const [draft, setDraft] = useState<RolePermissions>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!selectedKey && roles.length) setSelectedKey(roles[0].key);
  }, [roles, selectedKey]);

  const selected = useMemo(() => roles.find((r) => r.key === selectedKey), [roles, selectedKey]);
  const savedPerms = selected?.permissions ?? {};

  useEffect(() => {
    setDraft(JSON.parse(JSON.stringify(selected?.permissions ?? {})));
  }, [selectedKey, selected?.permissions]);

  const isSuper = selectedKey === 'super_admin';
  const dirty = !eq(draft, savedPerms);
  const granted = isSuper ? TOTAL_ACTIONS : grantedCount(draft);
  const isFullAccess = isSuper || granted === TOTAL_ACTIONS;

  // ── permission helpers ──
  const toggle = (moduleKey: string, action: PermAction) => {
    if (isSuper) return;
    setDraft((prev) => {
      const mod = { ...(prev[moduleKey] ?? {}) };
      mod[action] = !mod[action];
      return { ...prev, [moduleKey]: mod };
    });
  };
  const moduleAllOn = (mKey: string, actions: PermAction[]) => actions.every((a) => draft[mKey]?.[a] === true);
  const setModuleAll = (mKey: string, actions: PermAction[], on: boolean) => {
    if (isSuper) return;
    setDraft((prev) => ({ ...prev, [mKey]: Object.fromEntries(actions.map((a) => [a, on])) }));
  };
  const setAll = (on: boolean) => {
    if (isSuper) return;
    setDraft(Object.fromEntries(PERMISSION_MODULES.map((m) => [m.key, Object.fromEntries(m.actions.map((a) => [a, on]))])));
  };

  // ── role CRUD ──
  const savePerms = async () => {
    try { await setPermissions(selectedKey, draft); toast.success('Đã lưu phân quyền'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Lưu thất bại'); }
  };
  const beginEdit = (key: string, name: string) => { setEditingKey(key); setEditName(name); };
  const commitEdit = async () => {
    const name = editName.trim();
    if (!name || !editingKey) { setEditingKey(null); return; }
    try { await save({ key: editingKey, name }); setEditingKey(null); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Lưu thất bại'); }
  };
  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    try { await save({ name }); setNewName(''); toast.success('Đã thêm vai trò'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Thêm thất bại'); }
  };
  const handleDelete = async (key: string) => {
    try { await remove(key); if (selectedKey === key) setSelectedKey(''); toast.success('Đã xoá vai trò'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Xoá thất bại'); }
  };

  return (
    <Box layoutClassName="flex h-full flex-col gap-4">
      <Box layoutClassName="flex items-center gap-2.5">
        <Box layoutClassName="flex h-9 w-9 items-center justify-center rounded-xl" backgroundClassName="bg-primary-100 dark:bg-primary-900/30">
          <ShieldCheck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </Box>
        <Box>
          <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">Quyền và Tính năng</Heading>
          <Typography as="p" size="xs" variant="muted">Chọn một vai trò rồi cấp quyền theo từng tính năng.</Typography>
        </Box>
      </Box>

      {loading ? (
        <Box layoutClassName="flex items-center gap-2 py-10">
          <Spinner /> <Typography size="sm" variant="muted">Đang tải…</Typography>
        </Box>
      ) : (
        <Box layoutClassName="grid flex-1 gap-4 md:grid-cols-[280px_1fr]">
          {/* ── Cột trái: danh sách quyền ── */}
          <Card padding="none" borderClassName="border border-slate-200 dark:border-slate-700" roundedClassName="rounded-xl" shadowClassName="shadow-sm" layoutClassName="flex flex-col overflow-hidden">
            <Box layoutClassName="border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-700/70">
              <Typography size="xs" layoutClassName="font-semibold uppercase tracking-wide" variant="muted">Vai trò</Typography>
            </Box>
            <Box layoutClassName="flex-1 space-y-1 overflow-y-auto p-2">
              {roles.map((r) => {
                const active = r.key === selectedKey;
                const cnt = r.key === 'super_admin' ? TOTAL_ACTIONS : grantedCount(r.permissions ?? {});
                const full = r.key === 'super_admin' || cnt === TOTAL_ACTIONS;
                const editing = editingKey === r.key;
                const c = roleColor(r.key);
                return (
                  <Box
                    key={r.key}
                    role="button"
                    onClick={() => !editing && setSelectedKey(r.key)}
                    layoutClassName="group relative flex items-center gap-2.5 rounded-lg py-2 pl-3 pr-2"
                    backgroundClassName={active ? c.soft : 'bg-transparent'}
                    hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    stateClassName="transition-colors"
                  >
                    {active && <Box layoutClassName="absolute inset-y-1.5 left-0 w-1 rounded-full" backgroundClassName={c.bar} />}
                    <Box
                      layoutClassName="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      backgroundClassName={c.solid}
                      textClassName="text-white"
                    >
                      {(r.name || r.key).charAt(0).toUpperCase()}
                    </Box>
                    <Box layoutClassName="min-w-0 flex-1">
                      {editing ? (
                        <Input
                          value={editName}
                          autoFocus
                          onChange={(e) => setEditName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => { if (e.key === 'Enter') void commitEdit(); if (e.key === 'Escape') setEditingKey(null); }}
                          sizeClassName="w-full px-1.5 py-0.5 text-sm"
                          borderClassName="border border-primary-300 dark:border-primary-600"
                          roundedClassName="rounded"
                        />
                      ) : (
                        <>
                          <Typography as="p" size="sm" layoutClassName="truncate font-semibold" textClassName={active ? c.text : 'text-slate-800 dark:text-slate-100'}>
                            {r.name}
                          </Typography>
                          <Typography as="span" size="xs" textClassName={full ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'}>
                            {full ? 'Toàn quyền' : cnt === 0 ? 'Chưa cấp quyền' : `${cnt}/${TOTAL_ACTIONS} quyền`}
                          </Typography>
                        </>
                      )}
                    </Box>
                    {editing ? (
                      <Box layoutClassName="flex items-center">
                        <IconButton type="button" label="Lưu" onClick={(e) => { e.stopPropagation(); void commitEdit(); }} disabled={saving} variant="ghost" textClassName="text-emerald-600" hoverClassName="hover:text-emerald-700"><Check className="h-4 w-4" /></IconButton>
                        <IconButton type="button" label="Huỷ" onClick={(e) => { e.stopPropagation(); setEditingKey(null); }} variant="ghost" textClassName="text-slate-400" hoverClassName="hover:text-slate-600"><X className="h-4 w-4" /></IconButton>
                      </Box>
                    ) : (
                      <Box layoutClassName="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <IconButton type="button" label="Đổi tên" onClick={(e) => { e.stopPropagation(); beginEdit(r.key, r.name); }} variant="ghost" textClassName="text-slate-400" hoverClassName="hover:text-primary-600"><Pencil className="h-3.5 w-3.5" /></IconButton>
                        {r.builtIn ? (
                          <Badge size="sm" layoutClassName="px-1.5 py-0 text-[9px]" borderClassName="border-transparent" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-slate-400 dark:text-slate-400">gốc</Badge>
                        ) : (
                          <IconButton type="button" label="Xoá" onClick={(e) => { e.stopPropagation(); void handleDelete(r.key); }} disabled={saving} variant="ghost" textClassName="text-rose-400" hoverClassName="hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></IconButton>
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
            <Box layoutClassName="flex items-center gap-1.5 border-t border-slate-100 p-2 dark:border-slate-700/70">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Thêm vai trò mới…"
                sizeClassName="min-w-0 flex-1 px-2.5 py-1.5 text-sm"
                borderClassName="border border-slate-200 dark:border-slate-600"
                roundedClassName="rounded-lg"
                onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd(); }}
              />
              <IconButton type="button" label="Thêm" onClick={() => void handleAdd()} disabled={saving || !newName.trim()} variant="ghost" textClassName="text-primary-600" hoverClassName="hover:text-primary-700"><Plus className="h-5 w-5" /></IconButton>
            </Box>
          </Card>

          {/* ── Cột phải: ma trận tính năng ── */}
          <Card padding="none" borderClassName="border border-slate-200 dark:border-slate-700" roundedClassName="rounded-xl" shadowClassName="shadow-sm" layoutClassName="flex flex-col overflow-hidden">
            {selected ? (
              <>
                <Box layoutClassName="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-700/70">
                  <Box layoutClassName="flex items-center gap-3">
                    <Box layoutClassName="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold" backgroundClassName={roleColor(selected.key).solid} textClassName="text-white">
                      {(selected.name || selected.key).charAt(0).toUpperCase()}
                    </Box>
                    <Box>
                      <Box layoutClassName="flex items-center gap-2">
                        <Typography size="sm" layoutClassName="font-bold" textClassName="text-slate-900 dark:text-white">{selected.name}</Typography>
                        {isFullAccess && (
                          <Badge size="sm" layoutClassName="inline-flex items-center gap-1 px-2 py-0.5 text-[10px]" borderClassName="border-transparent" backgroundClassName="bg-purple-100 dark:bg-purple-900/30" textClassName="text-purple-700 dark:text-purple-300">
                            <Sparkles className="h-3 w-3" /> Toàn Quyền Truy Cập
                          </Badge>
                        )}
                      </Box>
                      <Typography as="span" size="xs" variant="muted">{isSuper ? 'Vai trò gốc — luôn đầy đủ quyền' : `Đã cấp ${granted}/${TOTAL_ACTIONS} quyền`}</Typography>
                    </Box>
                  </Box>
                  <Box layoutClassName="flex items-center gap-2">
                    {!isSuper && (
                      <Button type="button" onClick={() => setAll(!isFullAccess)} variant="secondary" leftIcon={<ChevronsUpDown />} iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5" sizeClassName="px-2.5 py-1.5 text-xs" roundedClassName="rounded-lg" borderClassName="border border-slate-200 dark:border-slate-600" backgroundClassName="bg-white dark:bg-slate-800" textClassName="text-slate-600 dark:text-slate-300" layoutClassName="inline-flex items-center gap-1">
                        {isFullAccess ? 'Bỏ tất cả' : 'Chọn tất cả'}
                      </Button>
                    )}
                    <Button type="button" onClick={() => void savePerms()} disabled={saving || !dirty || isSuper} variant="primary" leftIcon={<Save />} iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4" sizeClassName="px-3.5 py-1.5 text-sm" roundedClassName="rounded-lg" backgroundClassName="bg-primary-600" hoverClassName="hover:bg-primary-700" textClassName="font-medium text-white" layoutClassName="inline-flex items-center gap-1.5" stateClassName="disabled:cursor-not-allowed disabled:opacity-50" disableVariantHover>
                      Lưu
                    </Button>
                  </Box>
                </Box>

                <Box layoutClassName="flex-1 space-y-5 overflow-y-auto p-4">
                  {PERM_GROUPS.map((group) => {
                    const mods = PERMISSION_MODULES.filter((m) => m.group === group);
                    if (!mods.length) return null;
                    return (
                      <Box key={group} layoutClassName="space-y-2">
                        <Box layoutClassName="flex items-center gap-2">
                          <Typography size="xs" layoutClassName="font-bold uppercase tracking-wider" textClassName="text-slate-400 dark:text-slate-500">{group}</Typography>
                          <Box layoutClassName="h-px flex-1" backgroundClassName="bg-slate-100 dark:bg-slate-700/60" />
                        </Box>
                        <Box layoutClassName="space-y-1.5">
                          {mods.map((m) => {
                            const allOn = isSuper || moduleAllOn(m.key, m.actions);
                            return (
                              <Box
                                key={m.key}
                                layoutClassName="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5"
                                borderClassName="border border-slate-100 dark:border-slate-700/70"
                                backgroundClassName="bg-slate-50/50 dark:bg-slate-800/40"
                              >
                                <Box
                                  role="button"
                                  onClick={() => setModuleAll(m.key, m.actions, !allOn)}
                                  layoutClassName="flex min-w-0 items-center gap-2.5"
                                >
                                  <Box
                                    layoutClassName="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border"
                                    borderClassName={allOn ? 'border-primary-600' : 'border-slate-300 dark:border-slate-600'}
                                    backgroundClassName={allOn ? 'bg-primary-600' : 'bg-white dark:bg-slate-800'}
                                  >
                                    {allOn && <Check className="h-3.5 w-3.5 text-white" />}
                                  </Box>
                                  <Typography size="sm" layoutClassName="truncate font-medium" textClassName="text-slate-800 dark:text-slate-100">{m.label}</Typography>
                                </Box>
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
                                        leftIcon={on ? <Check /> : undefined}
                                        iconClassName="inline-flex shrink-0 [&_svg]:h-3 [&_svg]:w-3"
                                        sizeClassName="px-2.5 py-1 text-xs"
                                        roundedClassName="rounded-full"
                                        borderClassName={on ? 'border border-primary-600' : 'border border-slate-200 dark:border-slate-600'}
                                        backgroundClassName={on ? 'bg-primary-600' : 'bg-white dark:bg-slate-800'}
                                        textClassName={on ? 'font-semibold text-white' : 'text-slate-500 dark:text-slate-400'}
                                        hoverClassName={on ? '' : 'hover:border-primary-300 hover:text-primary-600'}
                                        layoutClassName="inline-flex items-center gap-1"
                                        disableVariantHover
                                        disableVariantTextColor
                                      >
                                        {a.label}
                                      </Button>
                                    );
                                  })}
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </>
            ) : (
              <Box layoutClassName="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
                <ShieldCheck className="h-10 w-10 text-slate-300 dark:text-slate-600" />
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
