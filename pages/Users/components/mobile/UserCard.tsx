import React from 'react';
import { CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import IconButton from '@/components/ui/IconButton';
import Image from '@/components/ui/Image';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Typography from '@/components/ui/Typography';
import { UserData, UserStatus, UserRole } from '@/types/user';
import { StatusBadge, RoleBadge } from '@/pages/Users/components/UserBadges';

interface UserCardProps {
  user: UserData;
  editingUser: UserData | null;
  editingRoleUser: UserData | null;
  customName: string;
  selectedRole: UserRole;
  onEditCustomName: (user: UserData) => void;
  onSaveCustomName: () => void;
  onCancelEditCustomName: () => void;
  onCustomNameChange: (value: string) => void;
  onEditRole: (user: UserData) => void;
  onSaveRole: () => void;
  onCancelEditRole: () => void;
  onRoleChange: (role: UserRole) => void;
  onStatusChange: (uid: string, status: UserStatus) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  editingUser,
  editingRoleUser,
  customName,
  selectedRole,
  onEditCustomName,
  onSaveCustomName,
  onCancelEditCustomName,
  onCustomNameChange,
  onEditRole,
  onSaveRole,
  onCancelEditRole,
  onRoleChange,
  onStatusChange
}) => {
  const { t } = useLanguage();

  return (
    <Card
      layoutClassName="p-4"
      backgroundClassName="bg-white dark:bg-slate-800"
      borderClassName="border-slate-100 dark:border-slate-700"
    >
      <Box layoutClassName="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-700">
        <Box layoutClassName="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-orange-100 dark:border-slate-500 dark:bg-slate-600">
          {user.photoURL ? (
            <Image
              src={user.photoURL} 
              alt={user.displayName || 'User'} 
              layoutClassName="h-full w-full object-cover"
            />
          ) : (
            <Typography as="span" layoutClassName="text-base font-bold" textClassName="text-orange-600 dark:text-orange-400">
              {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
            </Typography>
          )}
        </Box>
        <Box layoutClassName="min-w-0 flex-1">
          <Typography layoutClassName="truncate font-semibold" textClassName="text-slate-900 dark:text-white">
            {user.displayName || t('users.table.user')}
          </Typography>
          <Typography size="xs" layoutClassName="truncate" textClassName="text-slate-500 dark:text-slate-400">
            {user.email}
          </Typography>
        </Box>
      </Box>

      <Box layoutClassName="mb-3">
        <Box layoutClassName="mb-1 flex items-center justify-between">
          <Typography as="span" size="xs" layoutClassName="font-medium uppercase" textClassName="text-slate-500 dark:text-slate-400">
            {t('users.table.customName')}
          </Typography>
        </Box>
        {editingUser?.uid === user.uid ? (
          <Box layoutClassName="flex items-center gap-2">
            <Input
              type="text"
              value={customName}
              onChange={(e) => onCustomNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveCustomName();
                if (e.key === 'Escape') onCancelEditCustomName();
              }}
              layoutClassName="flex-1"
              sizeClassName="px-3 py-2 text-sm"
              borderClassName="border-slate-200 dark:border-slate-600"
              backgroundClassName="bg-white dark:bg-slate-700"
              textClassName="text-slate-900 dark:text-white"
              autoFocus
            />
            <IconButton
              type="button"
              label={t('common.save') || 'Save'}
              onClick={onSaveCustomName}
              variant="ghost"
              textClassName="text-emerald-600"
              hoverClassName="hover:text-emerald-700"
            >
              <CheckCircle className="w-5 h-5" />
            </IconButton>
            <IconButton
              type="button"
              label={t('common.cancel') || 'Cancel'}
              onClick={onCancelEditCustomName}
              variant="ghost"
              textClassName="text-red-600"
              hoverClassName="hover:text-red-700"
            >
              <XCircle className="w-5 h-5" />
            </IconButton>
          </Box>
        ) : (
          <Box layoutClassName="flex items-center justify-between">
            <Typography as="span" size="sm" textClassName="text-slate-600 dark:text-slate-300">
              {user.customName || '-'}
            </Typography>
            <IconButton
              type="button"
              label={t('users.table.customName')}
              onClick={() => onEditCustomName(user)}
              variant="ghost"
              textClassName="text-slate-400"
              hoverClassName="hover:text-orange-600 dark:hover:text-orange-400"
            >
              <Edit2 className="w-4 h-4" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Role */}
      <Box layoutClassName="mb-3">
        <Box layoutClassName="mb-1 flex items-center justify-between">
          <Typography as="span" size="xs" layoutClassName="font-medium uppercase" textClassName="text-slate-500 dark:text-slate-400">
            {t('users.table.role')}
          </Typography>
        </Box>
        {editingRoleUser?.uid === user.uid ? (
          <Box layoutClassName="flex items-center gap-2">
            <Select
              value={selectedRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              layoutClassName="flex-1"
              sizeClassName="px-3 py-2 text-sm"
              borderClassName="border-slate-200 dark:border-slate-600"
              backgroundClassName="bg-white dark:bg-slate-700"
              textClassName="text-slate-900 dark:text-white"
              autoFocus
            >
              <option value={UserRole.ADMIN}>{t('users.role.admin')}</option>
              <option value={UserRole.COLABORATOR}>{t('users.role.colaborator')}</option>
            </Select>
            <IconButton
              type="button"
              label={t('common.save') || 'Save'}
              onClick={onSaveRole}
              variant="ghost"
              textClassName="text-emerald-600"
              hoverClassName="hover:text-emerald-700"
            >
              <CheckCircle className="w-5 h-5" />
            </IconButton>
            <IconButton
              type="button"
              label={t('common.cancel') || 'Cancel'}
              onClick={onCancelEditRole}
              variant="ghost"
              textClassName="text-red-600"
              hoverClassName="hover:text-red-700"
            >
              <XCircle className="w-5 h-5" />
            </IconButton>
          </Box>
        ) : (
          <Box layoutClassName="flex items-center justify-between">
            <RoleBadge role={user.role} />
            {user.role !== UserRole.SUPER_ADMIN && (
              <IconButton
                type="button"
                label={t('users.table.role')}
                onClick={() => onEditRole(user)}
                variant="ghost"
                textClassName="text-slate-400"
                hoverClassName="hover:text-orange-600 dark:hover:text-orange-400"
              >
                <Edit2 className="w-4 h-4" />
              </IconButton>
            )}
          </Box>
        )}
      </Box>

      {/* Status */}
      <Box layoutClassName="mb-3">
        <Box layoutClassName="mb-1 flex items-center justify-between">
          <Typography as="span" size="xs" layoutClassName="font-medium uppercase" textClassName="text-slate-500 dark:text-slate-400">
            {t('users.table.status')}
          </Typography>
        </Box>
        <StatusBadge status={user.status} />
      </Box>

      {/* Last Login */}
      <Box layoutClassName="mb-4">
        <Box layoutClassName="mb-1 flex items-center justify-between">
          <Typography as="span" size="xs" layoutClassName="font-medium uppercase" textClassName="text-slate-500 dark:text-slate-400">
            {t('users.table.lastLogin')}
          </Typography>
        </Box>
        <Typography as="span" size="sm" textClassName="text-slate-600 dark:text-slate-300">
          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('vi-VN') : '-'}
        </Typography>
      </Box>

      <Box layoutClassName="flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
        {user.status === 'pending' && (
          <Button
            type="button"
            onClick={() => onStatusChange(user.uid, UserStatus.ACTIVE)}
            variant="secondary"
            layoutClassName="flex-1"
            sizeClassName="px-3 py-2 text-xs"
            textClassName="font-medium text-emerald-700 dark:text-emerald-400"
            backgroundClassName="bg-emerald-50 dark:bg-emerald-900/20"
            hoverClassName="hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
          >
            {t('users.actions.approve')}
          </Button>
        )}
        {user.status === 'active' && (
          <Button
            type="button"
            onClick={() => onStatusChange(user.uid, UserStatus.INACTIVE)}
            variant="secondary"
            layoutClassName="flex-1"
            sizeClassName="px-3 py-2 text-xs"
            textClassName="font-medium text-red-700 dark:text-red-400"
            backgroundClassName="bg-red-50 dark:bg-red-900/20"
            hoverClassName="hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            {t('users.actions.deactivate')}
          </Button>
        )}
        {user.status === 'inactive' && (
          <Button
            type="button"
            onClick={() => onStatusChange(user.uid, UserStatus.ACTIVE)}
            variant="secondary"
            layoutClassName="flex-1"
            sizeClassName="px-3 py-2 text-xs"
            textClassName="font-medium text-emerald-700 dark:text-emerald-400"
            backgroundClassName="bg-emerald-50 dark:bg-emerald-900/20"
            hoverClassName="hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
          >
            {t('users.actions.activate')}
          </Button>
        )}
      </Box>
    </Card>
  );
};

export default UserCard;

