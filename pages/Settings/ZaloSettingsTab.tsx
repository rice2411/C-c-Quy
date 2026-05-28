import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Hash,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  Send,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { fetchZaloGroupsConfiguration, saveZaloGroupsConfiguration } from '@/services/configurationService';
import { sendZaloTestMessage } from '@/services/zaloService';
import { getAllUsers, updateUserRole } from '@/services/userService';
import { useAuth } from '@/contexts/AuthContext';
import { UserData, UserRole } from '@/types/user';
import { ZALO_TRACKABLE_FIELDS, ZaloGroupConfig } from '@/types';
import toast from 'react-hot-toast';
import BaseModal from '@/components/BaseModal';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';

const userLabel = (u: UserData) =>
  u.customName || u.displayName || u.email || u.uid;

const initials = (u: UserData) => {
  const s = userLabel(u).trim();
  if (!s) return '?';
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
};

const maskZaloGroupId = (id: string): string => {
  const t = id.trim();
  if (!t) return '';
  if (t.length <= 6) return '•'.repeat(Math.min(t.length, 8));
  return `${'•'.repeat(Math.max(4, t.length - 4))}${t.slice(-4)}`;
};

const uidInOtherGroup = (groups: ZaloGroupConfig[], uid: string, excludeGroupId: string) =>
  groups.some((g) => g.id !== excludeGroupId && g.memberUids.includes(uid));

type AvatarSize = 'sm' | 'md' | 'lg';

const avatarSizeClass: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
};

const UserAvatar: React.FC<{
  user: UserData | null | undefined;
  size?: AvatarSize;
}> = ({ user, size = 'sm' }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const url = user?.photoURL?.trim();

  useEffect(() => {
    setImgFailed(false);
  }, [url, user?.uid]);

  const dim = avatarSizeClass[size];
  const ring = 'ring-2 ring-white dark:ring-slate-900';

  if (url && !imgFailed) {
    return (
      <span
        className={`relative inline-flex shrink-0 overflow-hidden rounded-full shadow-sm ${dim} ${ring}`}
      >
        <img
          src={url}
          alt={user ? userLabel(user) : ''}
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm ${dim} bg-gradient-to-br from-orange-500 to-amber-600 ${ring}`}
    >
      {user ? initials(user) : '?'}
    </span>
  );
};

const ZaloSettingsTab: React.FC = () => {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState<ZaloGroupConfig[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mainGroupId, setMainGroupId] = useState('');
  const [mainNotifyOnCreate, setMainNotifyOnCreate] = useState(true);
  const [mainNotifyOnUpdate, setMainNotifyOnUpdate] = useState(true);
  const [mainNotifyOnDelete, setMainNotifyOnDelete] = useState(true);
  const [mainUpdateFieldWhitelist, setMainUpdateFieldWhitelist] = useState<string[]>([]);
  const [testingGroupId, setTestingGroupId] = useState<string | null>(null);
  const [groupModalId, setGroupModalId] = useState<string | null>(null);
  const [pickUidsModal, setPickUidsModal] = useState<string[]>([]);
  const [editingZaloId, setEditingZaloId] = useState(false);
  const [peekZaloId, setPeekZaloId] = useState(false);
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [pickerDropdownRect, setPickerDropdownRect] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const userPickerRef = useRef<HTMLDivElement>(null);
  const userPickerAnchorRef = useRef<HTMLButtonElement>(null);
  const userPickerDropdownRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, list] = await Promise.all([fetchZaloGroupsConfiguration(), getAllUsers()]);
      setGroups(cfg.groups);
      setMainGroupId(cfg.mainGroupId ?? '');
      setMainNotifyOnCreate(cfg.mainNotifyOnCreate !== false);
      setMainNotifyOnUpdate(cfg.mainNotifyOnUpdate !== false);
      setMainNotifyOnDelete(cfg.mainNotifyOnDelete !== false);
      setMainUpdateFieldWhitelist(cfg.mainUpdateFieldWhitelist ?? []);
      setUsers(list);
    } catch (e) {
      console.error(e);
      toast.error('Không tải được cấu hình Zalo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const userByUid = useMemo(() => {
    const m = new Map<string, UserData>();
    users.forEach((u) => m.set(u.uid, u));
    return m;
  }, [users]);

  const previewPickUsers = useMemo(
    () => pickUidsModal.map((uid) => userByUid.get(uid)).filter(Boolean) as UserData[],
    [pickUidsModal, userByUid]
  );

  const activeGroup = useMemo(
    () => (groupModalId ? groups.find((g) => g.id === groupModalId) ?? null : null),
    [groupModalId, groups]
  );

  useEffect(() => {
    if (groupModalId && !groups.some((g) => g.id === groupModalId)) {
      setGroupModalId(null);
    }
  }, [groupModalId, groups]);

  useLayoutEffect(() => {
    if (!userPickerOpen) {
      setPickerDropdownRect(null);
      return;
    }
    const updateRect = () => {
      const el = userPickerAnchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPickerDropdownRect({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 220) });
    };
    updateRect();
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [userPickerOpen]);

  useEffect(() => {
    if (!userPickerOpen) return;
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (userPickerRef.current?.contains(t)) return;
      if (userPickerDropdownRef.current?.contains(t)) return;
      setUserPickerOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [userPickerOpen]);

  const openGroupModal = (id: string) => {
    const g = groups.find((x) => x.id === id);
    setGroupModalId(id);
    setPickUidsModal([]);
    setEditingZaloId(!g?.zaloGroupId?.trim());
    setPeekZaloId(false);
    setUserPickerOpen(false);
  };

  const closeGroupModal = () => {
    setGroupModalId(null);
    setPickUidsModal([]);
    setEditingZaloId(false);
    setPeekZaloId(false);
    setUserPickerOpen(false);
  };

  const persistGroups = async (next: ZaloGroupConfig[]) => {
    await saveZaloGroupsConfiguration(next, currentUser?.uid ?? null, {
      mainGroupId,
      mainNotifyOnCreate,
      mainNotifyOnUpdate,
      mainNotifyOnDelete,
      mainUpdateFieldWhitelist,
    });
    setGroups(next);
  };

  const handleTestGroup = async (groupId: string, groupName: string) => {
    const id = groupId.trim();
    if (!id) {
      toast.error('Group ID trống');
      return;
    }
    setTestingGroupId(id);
    try {
      const result = await sendZaloTestMessage(id);
      if (result.ok) {
        toast.success(`Đã gửi test tới "${groupName || id}"`);
      } else {
        toast.error(`Gửi test thất bại: ${result.error}`);
      }
    } finally {
      setTestingGroupId(null);
    }
  };

  const handleSaveAll = async () => {
    if (groups.length > 0) {
      const missingId = groups.some((g) => !g.zaloGroupId.trim());
      if (missingId) {
        toast.error('Mỗi nhóm phải có ID nhóm Zalo (nhập thủ công)');
        return;
      }
    }
    setSaving(true);
    try {
      await persistGroups(groups);
      toast.success('Đã lưu cấu hình Zalo');
      setEditingZaloId(false);
      setPeekZaloId(false);
    } catch (e) {
      console.error(e);
      toast.error('Không lưu được cấu hình Zalo');
    } finally {
      setSaving(false);
    }
  };

  const addGroup = () => {
    const newId = crypto.randomUUID();
    setGroups((prev) => [...prev, { id: newId, name: '', zaloGroupId: '', memberUids: [] }]);
    setGroupModalId(newId);
    setPickUidsModal([]);
    setEditingZaloId(true);
    setPeekZaloId(false);
  };

  const removeGroup = async (groupId: string) => {
    const next = groups.filter((g) => g.id !== groupId);
    setSaving(true);
    try {
      await persistGroups(next);
      toast.success('Đã xóa nhóm');
      if (groupModalId === groupId) closeGroupModal();
    } catch (e) {
      console.error(e);
      toast.error('Không xóa được nhóm');
    } finally {
      setSaving(false);
    }
  };

  const updateGroup = (groupId: string, patch: Partial<ZaloGroupConfig>) => {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, ...patch } : g)));
  };

  const addMembersBatch = async (groupId: string, uids: string[]) => {
    const unique = [...new Set(uids.map((x) => x.trim()).filter(Boolean))];
    if (unique.length === 0) return;
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const userMap = new Map<string, UserData>(userByUid);
    const toAdd: string[] = [];
    let blockedOther = false;
    let blockedSuper = false;

    for (const uid of unique) {
      if (group.memberUids.includes(uid)) continue;
      const target = userMap.get(uid);
      if (!target) continue;
      if (target.role === UserRole.SUPER_ADMIN) {
        blockedSuper = true;
        continue;
      }
      if (uidInOtherGroup(groups, uid, groupId)) {
        blockedOther = true;
        continue;
      }
      toAdd.push(uid);
    }

    if (toAdd.length === 0) {
      if (blockedSuper) toast.error('Không thể gán Super Admin vào nhóm CTV Zalo');
      else if (blockedOther) toast.error('Mỗi CTV chỉ thuộc tối đa một nhóm Zalo');
      else toast.error('Không có user hợp lệ để thêm');
      return;
    }

    setSaving(true);
    try {
      for (const uid of toAdd) {
        const target = userMap.get(uid);
        if (!target) continue;
        if (target.role !== UserRole.COLABORATOR) {
          await updateUserRole(uid, UserRole.COLABORATOR);
          const updated = { ...target, role: UserRole.COLABORATOR as const };
          userMap.set(uid, updated);
          setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role: UserRole.COLABORATOR } : u)));
        }
      }

      const toAddSet = new Set(toAdd);
      const stripped = groups.map((g) => ({
        ...g,
        memberUids: g.memberUids.filter((x) => !toAddSet.has(x)),
      }));
      const next = stripped.map((g) =>
        g.id === groupId ? { ...g, memberUids: [...g.memberUids, ...toAdd] } : g
      );
      await persistGroups(next);
      setPickUidsModal([]);
      setUserPickerOpen(false);
      toast.success(toAdd.length === 1 ? 'Đã thêm CTV vào nhóm' : `Đã thêm ${toAdd.length} CTV vào nhóm`);
      if (unique.length > toAdd.length) {
        toast('Một số user không được thêm (Super Admin, nhóm khác, hoặc không tồn tại).', { icon: '⚠️' });
      }
    } catch (e) {
      console.error(e);
      toast.error('Không thêm được thành viên');
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (groupId: string, uid: string) => {
    setSaving(true);
    try {
      const next = groups.map((g) =>
        g.id === groupId ? { ...g, memberUids: g.memberUids.filter((x) => x !== uid) } : g
      );
      await persistGroups(next);
      toast.success('Đã gỡ thành viên khỏi nhóm');
    } catch (e) {
      console.error(e);
      toast.error('Không cập nhật được nhóm');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        layoutClassName="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 py-20 dark:border-slate-600"
        backgroundClassName="bg-slate-50/50 dark:bg-slate-900/30"
      >
        <Box
          layoutClassName="flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner"
          backgroundClassName="bg-orange-100 dark:bg-orange-900/40"
        >
          <MessageCircle className="h-7 w-7 text-orange-600 dark:text-orange-400" />
        </Box>
        <Spinner size="md" />
        <Typography size="sm" variant="muted">
          Đang tải cấu hình Zalo…
        </Typography>
      </Box>
    );
  }

  const modalCandidates = activeGroup
    ? users.filter(
        (u) =>
          u.role !== UserRole.SUPER_ADMIN &&
          !activeGroup.memberUids.includes(u.uid) &&
          !uidInOtherGroup(groups, u.uid, activeGroup.id)
      )
    : [];

  const modalFooter = activeGroup ? (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => removeGroup(activeGroup.id)}
        disabled={saving}
        leftIcon={<Trash2 className="h-4 w-4" />}
        textClassName="mr-auto text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
        sizeClassName="rounded-xl px-3 py-2"
        layoutClassName="inline-flex items-center gap-2"
      >
        Xóa nhóm
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={closeGroupModal}
        borderClassName="border border-slate-200 dark:border-slate-600"
        backgroundClassName="bg-white dark:bg-slate-800"
        textClassName="text-sm text-slate-700 dark:text-slate-200"
        roundedClassName="rounded-xl"
        sizeClassName="px-4 py-2"
      >
        Đóng
      </Button>
    </>
  ) : undefined;

  return (
    <Box layoutClassName="space-y-6">
      {/* ╭─────── SECTION: GROUP ───────╮ */}
      <Box layoutClassName="flex items-center gap-2">
        <Users className="h-5 w-5 text-orange-600" />
        <Heading level={2} textClassName="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Nhóm CTV
        </Heading>
      </Box>
      <Box
        layoutClassName="relative overflow-hidden rounded-2xl border border-slate-200/90 p-6 dark:border-slate-600/80"
        backgroundClassName="bg-gradient-to-br from-orange-50 via-white to-sky-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
      >
        <Box
          layoutClassName="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-40 blur-2xl"
          backgroundClassName="bg-orange-400"
        />
        <Box layoutClassName="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Box layoutClassName="flex min-w-0 items-start gap-4">
            <Box
              layoutClassName="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-md ring-1 ring-orange-200/80 dark:ring-orange-800/60"
              backgroundClassName="bg-white dark:bg-slate-800"
            >
              <MessageCircle className="h-7 w-7 text-[#0068FF]" strokeWidth={2} />
            </Box>
            <Box layoutClassName="min-w-0">
              <Heading level={2} textClassName="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Nhóm Zalo & CTV
              </Heading>
              <Typography size="sm" variant="muted" layoutClassName="mt-1 max-w-xl leading-relaxed">
                Nhấn một nhóm để mở popup chỉnh sửa. Thêm CTV lưu ngay; đổi tên / ID nhớ bấm &quot;Lưu cấu hình Zalo&quot;.
              </Typography>
              <Box layoutClassName="mt-3 flex flex-wrap gap-2">
                <Badge
                  size="sm"
                  borderClassName="border-emerald-200 dark:border-emerald-800"
                  backgroundClassName="bg-emerald-50 dark:bg-emerald-950/50"
                  textClassName="text-emerald-700 dark:text-emerald-300"
                  layoutClassName="gap-1"
                >
                  <Shield className="h-3 w-3" />
                  1 CTV / 1 nhóm
                </Badge>
                <Badge
                  size="sm"
                  borderClassName="border-slate-200 dark:border-slate-600"
                  backgroundClassName="bg-white/80 dark:bg-slate-800/80"
                  textClassName="text-slate-600 dark:text-slate-300"
                  layoutClassName="gap-1"
                >
                  <Hash className="h-3 w-3" />
                  {groups.length} nhóm
                </Badge>
              </Box>
            </Box>
          </Box>
          <Box layoutClassName="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
            <Button
              type="button"
              onClick={addGroup}
              disabled={saving}
              leftIcon={<Plus className="h-4 w-4" />}
              sizeClassName="px-4 py-2.5"
              borderClassName="border border-slate-200 dark:border-slate-600"
              backgroundClassName="bg-white dark:bg-slate-800"
              hoverClassName="hover:border-orange-300 hover:bg-orange-50/80 dark:hover:border-orange-700 dark:hover:bg-slate-700"
              textClassName="text-sm font-semibold text-slate-800 dark:text-slate-100"
              roundedClassName="rounded-xl"
              layoutClassName="inline-flex w-full items-center justify-center gap-2 shadow-sm"
            >
              Thêm nhóm
            </Button>
            <Button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              leftIcon={saving ? <Spinner size="sm" textClassName="text-white" borderClassName="border-white" /> : undefined}
              sizeClassName="px-4 py-2.5"
              backgroundClassName="bg-gradient-to-r from-orange-600 to-amber-600"
              hoverClassName="hover:from-orange-700 hover:to-amber-700"
              textClassName="text-sm font-semibold text-white"
              roundedClassName="rounded-xl"
              layoutClassName="inline-flex w-full items-center justify-center gap-2 shadow-md"
              stateClassName="transition-all disabled:cursor-not-allowed disabled:opacity-50"
              disableVariantHover
              disableVariantTextColor
            >
              {saving ? 'Đang lưu…' : 'Lưu cấu hình Zalo'}
            </Button>
          </Box>
        </Box>
      </Box>

      {groups.length === 0 ? (
        <Box
          layoutClassName="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-16 text-center dark:border-slate-600"
          backgroundClassName="bg-slate-50/60 dark:bg-slate-900/40"
        >
          <Users className="h-10 w-10 text-slate-400" />
          <Typography size="sm" layoutClassName="font-semibold text-slate-800 dark:text-slate-100">
            Chưa có nhóm Zalo
          </Typography>
          <Typography size="xs" variant="muted" layoutClassName="max-w-sm">
            Bấm &quot;Thêm nhóm&quot; để tạo nhóm và mở popup cấu hình.
          </Typography>
        </Box>
      ) : (
        <Box layoutClassName="space-y-2">
          {groups.map((g, idx) => {
            const hasId = Boolean(g.zaloGroupId.trim());
            return (
              <Button
                key={g.id}
                type="button"
                onClick={() => openGroupModal(g.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-orange-300 hover:shadow-md dark:border-slate-600 dark:bg-slate-900 dark:hover:border-orange-700"
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                <Box
                  layoutClassName="w-1 shrink-0 self-stretch rounded-full"
                  backgroundClassName={
                    idx % 3 === 0 ? 'bg-orange-500' : idx % 3 === 1 ? 'bg-sky-500' : 'bg-rose-400'
                  }
                />
                <Box
                  layoutClassName="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  backgroundClassName="bg-orange-100 dark:bg-orange-950/60"
                >
                  <Users className="h-5 w-5 text-orange-700 dark:text-orange-300" />
                </Box>
                <Box layoutClassName="min-w-0 flex-1">
                  <Typography size="sm" layoutClassName="truncate font-bold text-slate-900 dark:text-white">
                    {g.name.trim() || 'Nhóm chưa đặt tên'}
                  </Typography>
                  <Box layoutClassName="mt-1 flex flex-wrap items-center gap-2">
                    <Badge
                      size="sm"
                      borderClassName="border-slate-200 dark:border-slate-600"
                      backgroundClassName="bg-slate-100 dark:bg-slate-800"
                      textClassName="text-slate-600 dark:text-slate-300"
                    >
                      {g.memberUids.length} CTV
                    </Badge>
                    {hasId ? (
                      <Badge
                        size="sm"
                        borderClassName="border-emerald-200 dark:border-emerald-800"
                        backgroundClassName="bg-emerald-50 dark:bg-emerald-950/40"
                        textClassName="text-emerald-700 dark:text-emerald-300"
                      >
                        Đã có ID
                      </Badge>
                    ) : (
                      <Badge
                        size="sm"
                        borderClassName="border-amber-200 dark:border-amber-800"
                        backgroundClassName="bg-amber-50 dark:bg-amber-950/40"
                        textClassName="text-amber-800 dark:text-amber-200"
                      >
                        Thiếu ID
                      </Badge>
                    )}
                  </Box>
                  {g.memberUids.length > 0 ? (
                    <Box layoutClassName="mt-2 flex items-center pl-0.5">
                      <Box layoutClassName="flex items-center">
                        {g.memberUids.slice(0, 5).map((uid, i) => (
                          <Box
                            key={uid}
                            layoutClassName={`relative shrink-0 ${i > 0 ? '-ml-2' : ''}`}
                            style={{ zIndex: 10 - i }}
                          >
                            <UserAvatar user={userByUid.get(uid)} size="sm" />
                          </Box>
                        ))}
                        {g.memberUids.length > 5 ? (
                          <Box
                            layoutClassName="-ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-300 text-[10px] font-bold text-slate-800 dark:border-slate-900 dark:bg-slate-600 dark:text-slate-100"
                          >
                            +{g.memberUids.length - 5}
                          </Box>
                        ) : null}
                      </Box>
                    </Box>
                  ) : null}
                </Box>
                <Pencil className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              </Button>
            );
          })}
        </Box>
      )}


      {/* ╭─────── SECTION: THÔNG BÁO ───────╮ */}
      <Box layoutClassName="flex items-center gap-2 pt-2">
        <Bell className="h-5 w-5 text-orange-600" />
        <Heading level={2} textClassName="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Thông báo
        </Heading>
      </Box>
      <Box
        layoutClassName="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"
        backgroundClassName="bg-white dark:bg-slate-900"
      >
        <Box layoutClassName="mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-orange-600" />
          <Typography size="sm" layoutClassName="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Cài đặt chung — Group chính
          </Typography>
        </Box>

        <Box layoutClassName="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Box>
            <Typography size="xs" layoutClassName="mb-1.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              ID group chính
            </Typography>
            <Input
              value={mainGroupId}
              onChange={(e) => setMainGroupId(e.target.value)}
              placeholder="VD: 4912345678901234567"
              containerClassName="w-full"
            />
            <Typography size="xs" variant="muted" layoutClassName="mt-1">
              Nhập ID group nhận thông báo chính (admin). Trống = dùng giá trị từ env.
            </Typography>
            <Box layoutClassName="mt-2 flex gap-2">
              <Button
                type="button"
                onClick={() => handleTestGroup(mainGroupId, 'Group chính')}
                disabled={!mainGroupId.trim() || testingGroupId === mainGroupId.trim()}
                leftIcon={<Send className="h-3.5 w-3.5" />}
                sizeClassName="px-3 py-1.5"
                backgroundClassName="bg-slate-800 dark:bg-slate-700"
                textClassName="text-xs font-semibold text-white"
                roundedClassName="rounded-lg"
                disableVariantHover
                disableVariantTextColor
              >
                {testingGroupId === mainGroupId.trim() ? 'Đang gửi…' : 'Test gửi'}
              </Button>
            </Box>
          </Box>

          <Box>
            <Typography size="xs" layoutClassName="mb-2 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bắn thông báo khi
            </Typography>
            <Box layoutClassName="flex flex-wrap gap-2">
              {([
                ['Tạo đơn', mainNotifyOnCreate, setMainNotifyOnCreate],
                ['Sửa đơn', mainNotifyOnUpdate, setMainNotifyOnUpdate],
                ['Xoá đơn', mainNotifyOnDelete, setMainNotifyOnDelete],
              ] as Array<[string, boolean, (v: boolean) => void]>).map(([label, val, setter]) => (
                <Button
                  key={label}
                  type="button"
                  onClick={() => setter(!val)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    val
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                 variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                  {val ? <Check className="h-3 w-3" /> : null}
                  {label}
                </Button>
              ))}
            </Box>

            {mainNotifyOnUpdate && (
              <Box layoutClassName="mt-3">
                <Typography size="xs" layoutClassName="mb-1.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Chỉ bắn khi field đổi (rỗng = tất cả)
                </Typography>
                <Box layoutClassName="flex flex-wrap gap-1.5">
                  {ZALO_TRACKABLE_FIELDS.map((f) => {
                    const active = mainUpdateFieldWhitelist.includes(f.key);
                    return (
                      <Button
                        key={f.key}
                        type="button"
                        onClick={() =>
                          setMainUpdateFieldWhitelist(
                            active
                              ? mainUpdateFieldWhitelist.filter((x) => x !== f.key)
                              : [...mainUpdateFieldWhitelist, f.key]
                          )
                        }
                        className={`rounded-md border px-2 py-1 text-[11px] transition ${
                          active
                            ? 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                       variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                        {f.label}
                      </Button>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>


      <BaseModal
        isOpen={Boolean(activeGroup)}
        onClose={closeGroupModal}
        title={
          <span className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#0068FF]" />
            {activeGroup?.name.trim() || 'Nhóm Zalo'}
          </span>
        }
        size="xl"
        footer={modalFooter}
      >
        {activeGroup ? (
          <div className="max-h-[min(80vh,720px)] overflow-y-auto pr-1">
            <Typography size="xs" variant="muted" layoutClassName="mb-4">
              Đổi tên hoặc ID nhóm cần bấm &quot;Lưu cấu hình Zalo&quot; ở trang. Thêm / gỡ CTV lưu ngay lên server.
            </Typography>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
              {/* Column: group info */}
              <div className="space-y-4">
                <Typography size="xs" layoutClassName="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Thông tin nhóm
                </Typography>

                <Box
                  layoutClassName="rounded-xl border border-slate-100 p-4 dark:border-slate-700/80"
                  backgroundClassName="bg-slate-50/70 dark:bg-slate-800/40"
                >
                  <Typography
                    size="xs"
                    layoutClassName="mb-2 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    Tên nhóm
                  </Typography>
                  <Input
                    value={activeGroup.name}
                    onChange={(e) => updateGroup(activeGroup.id, { name: e.target.value })}
                    placeholder="VD: Nhóm khu vực A"
                    containerClassName="w-full"
                  />
                </Box>

                <Box
                  layoutClassName="rounded-xl border border-slate-200 p-4 dark:border-slate-600"
                  backgroundClassName="bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900"
                >
                  <Box layoutClassName="mb-2 flex items-center justify-between gap-2">
                    <Typography
                      size="xs"
                      layoutClassName="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    >
                      ID nhóm Zalo <span className="text-red-500">*</span>
                    </Typography>
                    <Hash className="h-3.5 w-3.5 text-slate-400" />
                  </Box>
                  {editingZaloId || !activeGroup.zaloGroupId.trim() ? (
                    <Box layoutClassName="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                      <Input
                        value={activeGroup.zaloGroupId}
                        onChange={(e) => updateGroup(activeGroup.id, { zaloGroupId: e.target.value })}
                        placeholder="Dán hoặc nhập ID nhóm từ Zalo"
                        containerClassName="min-w-0 flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (!activeGroup.zaloGroupId.trim()) {
                            toast.error('Nhập ID nhóm trước khi ẩn');
                            return;
                          }
                          setEditingZaloId(false);
                          setPeekZaloId(false);
                        }}
                        sizeClassName="px-4 py-2 sm:shrink-0"
                        backgroundClassName="bg-slate-800 dark:bg-slate-600"
                        textClassName="text-sm font-semibold text-white"
                        roundedClassName="rounded-lg"
                        disableVariantHover
                        disableVariantTextColor
                      >
                        Xong — ẩn ID
                      </Button>
                    </Box>
                  ) : (
                    <Box layoutClassName="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm dark:border-slate-600 dark:bg-slate-900/80">
                      <Typography
                        size="sm"
                        layoutClassName="min-w-0 flex-1 break-all font-mono tracking-tight"
                        textClassName="text-slate-800 dark:text-slate-100"
                      >
                        {peekZaloId ? activeGroup.zaloGroupId.trim() : maskZaloGroupId(activeGroup.zaloGroupId)}
                      </Typography>
                      <Box layoutClassName="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          sizeClassName="rounded-lg p-2"
                          onClick={() => setPeekZaloId((v) => !v)}
                          aria-label={peekZaloId ? 'Hide id' : 'Peek id'}
                          textClassName="text-slate-500 hover:text-orange-600 dark:hover:text-orange-400"
                        >
                          {peekZaloId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          sizeClassName="rounded-lg px-3 py-1.5 text-xs font-semibold"
                          onClick={() => {
                            setEditingZaloId(true);
                            setPeekZaloId(false);
                          }}
                          textClassName="text-orange-600 dark:text-orange-400"
                        >
                          Sửa ID
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>

                <Box
                  layoutClassName="rounded-xl border border-slate-100 p-4 dark:border-slate-700/80"
                  backgroundClassName="bg-slate-50/70 dark:bg-slate-800/40"
                >
                  <Box layoutClassName="mb-3 flex items-center justify-between gap-2">
                    <Box layoutClassName="flex items-center gap-2">
                      <Bell className="h-3.5 w-3.5 text-orange-600" />
                      <Typography
                        size="xs"
                        layoutClassName="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        Thông báo cho nhóm này
                      </Typography>
                    </Box>
                    <Button
                      type="button"
                      onClick={() => handleTestGroup(activeGroup.zaloGroupId, activeGroup.name)}
                      disabled={!activeGroup.zaloGroupId.trim() || testingGroupId === activeGroup.zaloGroupId.trim()}
                      leftIcon={<Send className="h-3 w-3" />}
                      sizeClassName="px-2.5 py-1"
                      backgroundClassName="bg-slate-800 dark:bg-slate-700"
                      textClassName="text-[11px] font-semibold text-white"
                      roundedClassName="rounded-md"
                      disableVariantHover
                      disableVariantTextColor
                    >
                      {testingGroupId === activeGroup.zaloGroupId.trim() ? 'Đang gửi…' : 'Test'}
                    </Button>
                  </Box>

                  <Box layoutClassName="flex flex-wrap gap-1.5">
                    {([
                      ['Tạo đơn', activeGroup.notifyOnCreate !== false, 'notifyOnCreate'],
                      ['Sửa đơn', activeGroup.notifyOnUpdate !== false, 'notifyOnUpdate'],
                      ['Xoá đơn', activeGroup.notifyOnDelete !== false, 'notifyOnDelete'],
                    ] as Array<[string, boolean, 'notifyOnCreate' | 'notifyOnUpdate' | 'notifyOnDelete']>).map(
                      ([label, val, key]) => (
                        <Button
                          key={key}
                          type="button"
                          onClick={() =>
                            updateGroup(activeGroup.id, { [key]: !val } as Partial<ZaloGroupConfig>)
                          }
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                            val
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                         variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                          {val ? <Check className="h-3 w-3" /> : null}
                          {label}
                        </Button>
                      ),
                    )}
                  </Box>

                  {activeGroup.notifyOnUpdate !== false && (
                    <Box layoutClassName="mt-3">
                      <Typography
                        size="xs"
                        layoutClassName="mb-1.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        Chỉ bắn khi field đổi (rỗng = tất cả)
                      </Typography>
                      <Box layoutClassName="flex flex-wrap gap-1.5">
                        {ZALO_TRACKABLE_FIELDS.map((f) => {
                          const wl = activeGroup.updateFieldWhitelist ?? [];
                          const active = wl.includes(f.key);
                          return (
                            <Button
                              key={f.key}
                              type="button"
                              onClick={() =>
                                updateGroup(activeGroup.id, {
                                  updateFieldWhitelist: active
                                    ? wl.filter((x) => x !== f.key)
                                    : [...wl, f.key],
                                })
                              }
                              className={`rounded-md border px-2 py-1 text-[11px] transition ${
                                active
                                  ? 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300'
                                  : 'border-slate-200 bg-white text-slate-500 hover:border-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                             variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                              {f.label}
                            </Button>
                          );
                        })}
                      </Box>
                    </Box>
                  )}
                </Box>
              </div>

              {/* Column: members + add */}
              <div className="space-y-4">
                <Typography size="xs" layoutClassName="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  CTV &amp; thêm người
                </Typography>

                <Box
                  layoutClassName="rounded-xl border border-slate-100 p-4 dark:border-slate-700/80"
                  backgroundClassName="bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <Box layoutClassName="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <Box layoutClassName="min-w-0">
                      <Box layoutClassName="flex items-center gap-2">
                        <Box
                          layoutClassName="flex h-8 w-8 items-center justify-center rounded-lg"
                          backgroundClassName="bg-orange-100 dark:bg-orange-950/50"
                        >
                          <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </Box>
                        <Typography size="sm" layoutClassName="font-semibold text-slate-900 dark:text-white">
                          Trong nhóm
                        </Typography>
                      </Box>
                      <Typography size="xs" variant="muted" layoutClassName="mt-1 pl-10 leading-relaxed">
                        Mỗi người một nhóm. Gỡ khỏi nhóm không đổi vai trò tài khoản.
                      </Typography>
                    </Box>
                    <Badge
                      size="sm"
                      borderClassName="border-slate-200 dark:border-slate-600"
                      backgroundClassName="bg-white dark:bg-slate-800"
                      textClassName="text-slate-600 dark:text-slate-300"
                    >
                      {activeGroup.memberUids.length} người
                    </Badge>
                  </Box>

                  {activeGroup.memberUids.length === 0 ? (
                    <Box
                      layoutClassName="mb-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-8 dark:border-slate-600"
                      backgroundClassName="bg-white/60 dark:bg-slate-900/40"
                    >
                      <Users className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                      <Typography size="xs" variant="muted" layoutClassName="text-center">
                        Chưa có CTV.
                      </Typography>
                    </Box>
                  ) : (
                    <Box layoutClassName="mb-4 max-h-48 space-y-2 overflow-y-auto pr-0.5">
                      {activeGroup.memberUids.map((uid) => {
                        const u = userByUid.get(uid);
                        return (
                          <Box
                            key={uid}
                            layoutClassName="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-sm dark:border-slate-600 dark:bg-slate-900"
                          >
                            <UserAvatar user={u} size="sm" />
                            <Box layoutClassName="min-w-0 flex-1">
                              <Typography size="sm" layoutClassName="truncate font-medium text-slate-900 dark:text-slate-100">
                                {u ? userLabel(u) : uid}
                              </Typography>
                              {u?.email ? (
                                <Box layoutClassName="mt-0.5 flex items-center gap-1">
                                  <Mail className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
                                  <Typography size="xs" variant="muted" layoutClassName="truncate">
                                    {u.email}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography size="xs" variant="muted" layoutClassName="mt-0.5 truncate font-mono">
                                  {uid}
                                </Typography>
                              )}
                            </Box>
                            <Button
                              type="button"
                              variant="ghost"
                              sizeClassName="h-8 w-8 shrink-0 rounded-lg p-0"
                              onClick={() => removeMember(activeGroup.id, uid)}
                              disabled={saving}
                              borderClassName="border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
                              textClassName="text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                              aria-label="Remove member"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </Box>
                        );
                      })}
                    </Box>
                  )}

                  <Box
                    ref={userPickerRef}
                    layoutClassName="rounded-2xl border border-orange-200/70 p-4 dark:border-orange-900/40"
                    backgroundClassName="bg-gradient-to-br from-orange-50/90 via-white to-white dark:from-orange-950/25 dark:via-slate-900 dark:to-slate-900"
                  >
                    <Box layoutClassName="mb-3 flex items-start gap-2">
                      <Box
                        layoutClassName="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        backgroundClassName="bg-orange-500 shadow-sm"
                      >
                        <UserPlus className="h-4 w-4 text-white" />
                      </Box>
                      <Box layoutClassName="min-w-0 flex-1">
                        <Typography size="sm" layoutClassName="font-semibold text-slate-900 dark:text-white">
                          Thêm CTV
                        </Typography>
                        <Typography size="xs" variant="muted" layoutClassName="mt-0.5 leading-relaxed">
                          Chọn một hoặc nhiều user — bấm dòng để chọn/bỏ, rồi Thêm.
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      ref={userPickerAnchorRef}
                      type="button"
                      onClick={() => setUserPickerOpen((o) => !o)}
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-inner transition-colors hover:border-orange-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-orange-600"
                     variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                      {pickUidsModal.length === 0 ? (
                        <Typography size="sm" variant="muted" layoutClassName="flex-1">
                          Chọn user…
                        </Typography>
                      ) : pickUidsModal.length === 1 && previewPickUsers[0] ? (
                        <>
                          <UserAvatar user={previewPickUsers[0]} size="md" />
                          <Box layoutClassName="min-w-0 flex-1">
                            <Typography size="sm" layoutClassName="truncate font-semibold text-slate-900 dark:text-white">
                              {userLabel(previewPickUsers[0])}
                            </Typography>
                            {previewPickUsers[0].email ? (
                              <Typography size="xs" variant="muted" layoutClassName="truncate">
                                {previewPickUsers[0].email}
                              </Typography>
                            ) : null}
                          </Box>
                        </>
                      ) : (
                        <>
                          <Box
                            layoutClassName="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                            backgroundClassName="bg-orange-100 dark:bg-orange-900/40"
                          >
                            <Users className="h-5 w-5 text-orange-600 dark:text-orange-300" aria-hidden />
                          </Box>
                          <Box layoutClassName="min-w-0 flex-1">
                            <Typography size="sm" layoutClassName="font-semibold text-slate-900 dark:text-white">
                              Đã chọn {pickUidsModal.length} user
                            </Typography>
                            <Typography size="xs" variant="muted" layoutClassName="truncate">
                              {previewPickUsers.slice(0, 2).map((u) => userLabel(u)).join(', ')}
                              {pickUidsModal.length > 2 ? ` +${pickUidsModal.length - 2}` : ''}
                            </Typography>
                          </Box>
                        </>
                      )}
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${userPickerOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </Button>

                    {typeof document !== 'undefined' &&
                      userPickerOpen &&
                      pickerDropdownRect &&
                      createPortal(
                        <div
                          ref={userPickerDropdownRef}
                          className="fixed z-[200] max-h-56 space-y-0.5 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-600 dark:bg-slate-900"
                          style={{
                            top: pickerDropdownRect.top,
                            left: pickerDropdownRect.left,
                            width: pickerDropdownRect.width,
                          }}
                          role="listbox"
                          aria-multiselectable
                        >
                          {modalCandidates.length === 0 ? (
                            <p className="px-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                              Không có user trong danh sách.
                            </p>
                          ) : (
                            modalCandidates.map((u) => {
                              const selected = pickUidsModal.includes(u.uid);
                              return (
                                <Button
                                  key={u.uid}
                                  type="button"
                                  role="option"
                                  aria-selected={selected}
                                  onClick={() => {
                                    setPickUidsModal((prev) =>
                                      prev.includes(u.uid) ? prev.filter((x) => x !== u.uid) : [...prev, u.uid]
                                    );
                                  }}
                                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${
                                    selected
                                      ? 'bg-orange-50 dark:bg-orange-950/40'
                                      : 'hover:bg-orange-50/80 dark:hover:bg-orange-950/30'
                                  }`}
                                 variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                                  <UserAvatar user={u} size="sm" />
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">
                                      {userLabel(u)}
                                    </span>
                                    {u.email ? (
                                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                                        {u.email}
                                      </span>
                                    ) : (
                                      <span className="block truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                                        {u.uid}
                                      </span>
                                    )}
                                  </span>
                                  {selected ? (
                                    <Check className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden />
                                  ) : (
                                    <span className="h-4 w-4 shrink-0" aria-hidden />
                                  )}
                                </Button>
                              );
                            })
                          )}
                        </div>,
                        document.body
                      )}

                    {modalCandidates.length === 0 ? (
                      <Typography
                        size="xs"
                        layoutClassName="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                      >
                        Không còn user khả dụng (đã ở nhóm khác hoặc Super Admin).
                      </Typography>
                    ) : null}

                    <Button
                      type="button"
                      onClick={() => addMembersBatch(activeGroup.id, pickUidsModal)}
                      disabled={saving || pickUidsModal.length === 0}
                      leftIcon={<UserPlus className="h-4 w-4" />}
                      sizeClassName="mt-3 w-full justify-center py-2.5 sm:py-3"
                      backgroundClassName="bg-gradient-to-r from-orange-600 to-amber-600"
                      hoverClassName="hover:from-orange-700 hover:to-amber-700"
                      textClassName="text-sm font-semibold text-white"
                      roundedClassName="rounded-xl"
                      layoutClassName="inline-flex items-center gap-2 shadow-md"
                      stateClassName="transition-all disabled:cursor-not-allowed disabled:opacity-50"
                      disableVariantHover
                      disableVariantTextColor
                    >
                      {pickUidsModal.length <= 1
                        ? 'Thêm vào nhóm này'
                        : `Thêm ${pickUidsModal.length} CTV vào nhóm`}
                    </Button>
                  </Box>
                </Box>
              </div>
            </div>
          </div>
        ) : null}
      </BaseModal>
    </Box>
  );
};

export default ZaloSettingsTab;
