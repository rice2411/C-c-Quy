import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Check, ShieldCheck } from 'lucide-react';
import { useRoles, useRoleMutations } from '@/hooks/queries/useRolesQuery';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import IconButton from '@/components/ui/IconButton';
import Typography from '@/components/ui/Typography';

/** Card quản lý danh sách VAI TRÒ (thêm/sửa tên/xoá) — đầu trang Cài đặt → Màn hình. */
const RoleManagerCard: React.FC = () => {
  const { roles, loading } = useRoles();
  const { save, remove, saving } = useRoleMutations();
  const [names, setNames] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState('');

  useEffect(() => {
    setNames(Object.fromEntries(roles.map((r) => [r.key, r.name])));
  }, [roles]);

  const handleRename = async (key: string) => {
    const name = (names[key] ?? '').trim();
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
      toast.success('Đã xoá vai trò');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xoá thất bại');
    }
  };

  return (
    <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3 p-4">
      <Box layoutClassName="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary-500" />
        <Heading level={2} textClassName="text-base font-semibold">Vai trò</Heading>
        <Typography size="xs" variant="muted">— thêm/sửa/xoá; role gán ở đây dùng cho phân quyền màn & gán người dùng.</Typography>
      </Box>

      {loading ? (
        <Typography size="sm" variant="muted">Đang tải…</Typography>
      ) : (
        <Box layoutClassName="space-y-1.5">
          {roles.map((r) => {
            const changed = (names[r.key] ?? '') !== r.name;
            return (
              <Box
                key={r.key}
                layoutClassName="flex flex-wrap items-center gap-2 rounded-lg px-2.5 py-1.5"
                borderClassName="border border-slate-200 dark:border-slate-700"
                backgroundClassName="bg-white dark:bg-slate-800"
              >
                <Input
                  value={names[r.key] ?? ''}
                  onChange={(e) => setNames((p) => ({ ...p, [r.key]: e.target.value }))}
                  sizeClassName="w-44 px-2 py-1 text-sm"
                  borderClassName="border border-slate-200 dark:border-slate-600"
                  roundedClassName="rounded"
                />
                <Typography as="span" size="xs" variant="muted" layoutClassName="font-mono">{r.key}</Typography>
                {r.builtIn && (
                  <Badge
                    size="sm"
                    layoutClassName="px-1.5 py-0.5 text-[10px]"
                    borderClassName="border-transparent"
                    backgroundClassName="bg-slate-100 dark:bg-slate-700"
                    textClassName="text-slate-500 dark:text-slate-300"
                  >
                    gốc
                  </Badge>
                )}
                <Box layoutClassName="ml-auto flex items-center gap-1">
                  {changed && (
                    <IconButton
                      type="button"
                      label="Lưu tên"
                      onClick={() => void handleRename(r.key)}
                      disabled={saving}
                      variant="ghost"
                      textClassName="text-emerald-600"
                      hoverClassName="hover:text-emerald-700"
                    >
                      <Check className="h-4 w-4" />
                    </IconButton>
                  )}
                  {!r.builtIn && (
                    <IconButton
                      type="button"
                      label="Xoá vai trò"
                      onClick={() => void handleDelete(r.key)}
                      disabled={saving}
                      variant="ghost"
                      textClassName="text-rose-500"
                      hoverClassName="hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            );
          })}

          {/* Thêm vai trò mới */}
          <Box layoutClassName="flex items-center gap-2 pt-1">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Tên vai trò mới (vd Kế toán)"
              sizeClassName="w-56 px-2 py-1 text-sm"
              borderClassName="border border-slate-200 dark:border-slate-600"
              roundedClassName="rounded"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleAdd();
              }}
            />
            <Button
              type="button"
              onClick={() => void handleAdd()}
              disabled={saving || !newName.trim()}
              variant="primary"
              leftIcon={<Plus />}
              iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
              sizeClassName="px-3 py-1.5 text-sm"
              roundedClassName="rounded-lg"
              backgroundClassName="bg-primary-600"
              hoverClassName="hover:bg-primary-700"
              textClassName="font-medium text-white"
              layoutClassName="inline-flex items-center gap-1.5"
              disableVariantHover
            >
              Thêm vai trò
            </Button>
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default RoleManagerCard;
