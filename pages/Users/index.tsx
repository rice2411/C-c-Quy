import React, { useState, useEffect, useMemo } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserData, UserStatus, UserRole } from '@/types/user';
import { getAllUsers, updateUserStatus, updateUserCustomName, updateUserRole } from '@/services/userService';
import toast from 'react-hot-toast';
import UserStats from './components/UserStats';
import UserFilters from './components/UserFilters';
import UserTable from './components/desktop/UserTable';
import UserCardList from './components/mobile/UserCardList';

const UsersPage: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editingRoleUser, setEditingRoleUser] = useState<UserData | null>(null);
  const [customName, setCustomName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.COLABORATOR);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(t('users.messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleStatusChange = async (uid: string, newStatus: UserStatus) => {
    try {
      await updateUserStatus(uid, newStatus);
      toast.success(t('users.messages.statusUpdated'));
      await loadUsers();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('users.messages.updateStatusError'));
    }
  };

  const handleEditCustomName = (user: UserData) => {
    setEditingUser(user);
    setCustomName(user.customName || '');
  };

  const handleSaveCustomName = async () => {
    if (!editingUser) return;
    
    try {
      await updateUserCustomName(editingUser.uid, customName);
      toast.success(t('users.messages.customNameUpdated'));
      setEditingUser(null);
      setCustomName('');
      await loadUsers();
    } catch (error) {
      console.error('Error updating custom name:', error);
      toast.error(t('users.messages.updateCustomNameError'));
    }
  };

  const handleCancelEditCustomName = () => {
    setEditingUser(null);
    setCustomName('');
  };

  const handleEditRole = (user: UserData) => {
    setEditingRoleUser(user);
    setSelectedRole(user.role);
  };

  const handleSaveRole = async () => {
    if (!editingRoleUser) return;
    
    try {
      await updateUserRole(editingRoleUser.uid, selectedRole);
      toast.success(t('users.messages.roleUpdated'));
      setEditingRoleUser(null);
      await loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(t('users.messages.updateRoleError'));
    }
  };

  const handleCancelEditRole = () => {
    setEditingRoleUser(null);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.customName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      pending: users.filter(u => u.status === 'pending').length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length
    };
  }, [users]);

  return (
    <div className="h-full relative flex flex-col space-y-6">
      <UserStats 
        total={stats.total}
        pending={stats.pending}
        active={stats.active}
        inactive={stats.inactive}
      />

      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-slate-400 dark:text-slate-500">
          <Users className="w-16 h-16 mb-4 opacity-20" />
          <p>{t('users.noUsers')}</p>
        </div>
      ) : (
        <>
          <UserTable
            users={filteredUsers}
            editingUser={editingUser}
            editingRoleUser={editingRoleUser}
            customName={customName}
            selectedRole={selectedRole}
            onEditCustomName={handleEditCustomName}
            onSaveCustomName={handleSaveCustomName}
            onCancelEditCustomName={handleCancelEditCustomName}
            onCustomNameChange={setCustomName}
            onEditRole={handleEditRole}
            onSaveRole={handleSaveRole}
            onCancelEditRole={handleCancelEditRole}
            onRoleChange={setSelectedRole}
            onStatusChange={handleStatusChange}
          />

          <UserCardList
            users={filteredUsers}
            editingUser={editingUser}
            editingRoleUser={editingRoleUser}
            customName={customName}
            selectedRole={selectedRole}
            onEditCustomName={handleEditCustomName}
            onSaveCustomName={handleSaveCustomName}
            onCancelEditCustomName={handleCancelEditCustomName}
            onCustomNameChange={setCustomName}
            onEditRole={handleEditRole}
            onSaveRole={handleSaveRole}
            onCancelEditRole={handleCancelEditRole}
            onRoleChange={setSelectedRole}
            onStatusChange={handleStatusChange}
          />
        </>
      )}
    </div>
  );
};

export default UsersPage;
