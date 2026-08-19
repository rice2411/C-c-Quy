import React from 'react';
import { formatDateOnly } from '@/utils/format/dateUtil';
import { CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRoles } from '@/hooks/queries/useRolesQuery';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import IconButton from '@/components/ui/IconButton';
import Image from '@/components/ui/Image';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/Table';
import Typography from '@/components/ui/Typography';
import { UserData, UserStatus, UserRole } from '@/types/user';
import { StatusBadge, RoleBadge } from '@/pages/Users/components/UserBadges';

interface UserTableProps {
  users: UserData[];
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

const UserTable: React.FC<UserTableProps> = ({
  users,
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
  const { roles } = useRoles();
  // Danh sách role gán được: KHÔNG cho gán super_admin qua UI (giữ như cũ).
  const assignableRoles = roles.filter((r) => r.key !== 'super_admin');

  return (
    <Card
      padding="none"
      layoutClassName="hidden flex-1 overflow-hidden lg:block"
      backgroundClassName="bg-white dark:bg-slate-800"
      borderClassName="border-slate-100 dark:border-slate-700"
    >
      <Box layoutClassName="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t('users.table.user')}</TableHeaderCell>
              <TableHeaderCell>{t('users.table.customName')}</TableHeaderCell>
              <TableHeaderCell>{t('users.table.role')}</TableHeaderCell>
              <TableHeaderCell>{t('users.table.status')}</TableHeaderCell>
              <TableHeaderCell layoutClassName="hidden md:table-cell">{t('users.table.lastLogin')}</TableHeaderCell>
              <TableHeaderCell textClassName="text-right">{t('users.table.actions')}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.uid}
                stateClassName="group transition-colors"
                hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <TableCell>
                  <Box layoutClassName="flex items-center gap-3">
                    <Box layoutClassName="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-primary-100 dark:border-slate-500 dark:bg-slate-600">
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL} 
                          alt={user.displayName || 'User'} 
                          layoutClassName="h-full w-full object-cover"
                        />
                      ) : (
                        <Typography as="span" size="sm" layoutClassName="font-bold" textClassName="text-primary-600 dark:text-primary-400">
                          {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                        </Typography>
                      )}
                    </Box>
                    <Box layoutClassName="min-w-0">
                      <Typography layoutClassName="truncate font-medium" textClassName="text-slate-900 dark:text-white">
                        {user.displayName || t('users.table.user')}
                      </Typography>
                      <Typography size="xs" layoutClassName="truncate" textClassName="text-slate-500 dark:text-slate-400">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
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
                        sizeClassName="px-2 py-1 text-sm"
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
                        <CheckCircle className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        type="button"
                        label={t('common.cancel') || 'Cancel'}
                        onClick={onCancelEditCustomName}
                        variant="ghost"
                        textClassName="text-red-600"
                        hoverClassName="hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box layoutClassName="flex items-center gap-2">
                      <Typography as="span" textClassName="text-slate-600 dark:text-slate-300">
                        {user.customName || '-'}
                      </Typography>
                      <IconButton
                        type="button"
                        label={t('users.table.customName')}
                        onClick={() => onEditCustomName(user)}
                        variant="ghost"
                        stateClassName="opacity-0 transition-opacity group-hover:opacity-100"
                        textClassName="text-slate-400"
                        hoverClassName="hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        <Edit2 className="w-4 h-4" />
                      </IconButton>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  {editingRoleUser?.uid === user.uid ? (
                    <Box layoutClassName="flex items-center gap-2">
                      <Select
                        value={selectedRole}
                        onChange={(e) => onRoleChange(e.target.value as UserRole)}
                        sizeClassName="px-2 py-1 text-xs"
                        borderClassName="border-slate-200 dark:border-slate-600"
                        backgroundClassName="bg-white dark:bg-slate-700"
                        textClassName="text-slate-900 dark:text-white"
                        autoFocus
                      >
                        {assignableRoles.map((r) => (
                          <option key={r.key} value={r.key}>{r.name}</option>
                        ))}
                      </Select>
                      <IconButton
                        type="button"
                        label={t('common.save') || 'Save'}
                        onClick={onSaveRole}
                        variant="ghost"
                        textClassName="text-emerald-600"
                        hoverClassName="hover:text-emerald-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        type="button"
                        label={t('common.cancel') || 'Cancel'}
                        onClick={onCancelEditRole}
                        variant="ghost"
                        textClassName="text-red-600"
                        hoverClassName="hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box layoutClassName="flex items-center gap-2">
                      <RoleBadge role={user.role} />
                      {user.role !== UserRole.SUPER_ADMIN && (
                        <IconButton
                          type="button"
                          label={t('users.table.role')}
                          onClick={() => onEditRole(user)}
                          variant="ghost"
                          stateClassName="opacity-0 transition-opacity group-hover:opacity-100"
                          textClassName="text-slate-400"
                          hoverClassName="hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          <Edit2 className="w-4 h-4" />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={user.status} />
                </TableCell>
                <TableCell
                  layoutClassName="hidden md:table-cell"
                  textClassName="text-slate-500 dark:text-slate-400"
                >
                  {user.lastLoginAt ? formatDateOnly(user.lastLoginAt) : '-'}
                </TableCell>
                <TableCell textClassName="text-right">
                  <Box layoutClassName="flex items-center justify-end gap-2">
                    {user.status === 'pending' && (
                      <Button
                        type="button"
                        onClick={() => onStatusChange(user.uid, UserStatus.ACTIVE)}
                        variant="secondary"
                        sizeClassName="px-3 py-1.5 text-xs"
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
                        sizeClassName="px-3 py-1.5 text-xs"
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
                        sizeClassName="px-3 py-1.5 text-xs"
                        textClassName="font-medium text-emerald-700 dark:text-emerald-400"
                        backgroundClassName="bg-emerald-50 dark:bg-emerald-900/20"
                        hoverClassName="hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                      >
                        {t('users.actions.activate')}
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
};

export default UserTable;

