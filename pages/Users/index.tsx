import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, CheckCircle, XCircle, Clock, Edit2, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { UserData, UserStatus } from '../../types/user';
import { getAllUsers, updateUserStatus, updateUserCustomName } from '../../services/userService';
import toast from 'react-hot-toast';

const UsersPage: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [customName, setCustomName] = useState('');

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

  const getStatusBadge = (status: UserStatus) => {
    const badges = {
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', label: t('users.status.pending') },
      active: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400', label: t('users.status.active') },
      inactive: { icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', label: t('users.status.inactive') }
    };
    const badge = badges[status];
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('users.stats.total')}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('users.stats.pending')}</p>
          <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.pending}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('users.stats.active')}</p>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.active}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('users.stats.inactive')}</p>
          <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.inactive}</h3>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder={t('users.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
          className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">{t('users.filter.all')}</option>
          <option value="pending">{t('users.status.pending')}</option>
          <option value="active">{t('users.status.active')}</option>
          <option value="inactive">{t('users.status.inactive')}</option>
        </select>
      </div>

      {/* Users Table */}
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
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 font-medium">{t('users.table.user')}</th>
                  <th className="px-6 py-3 font-medium">{t('users.table.customName')}</th>
                  <th className="px-6 py-3 font-medium">{t('users.table.status')}</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">{t('users.table.lastLogin')}</th>
                  <th className="px-6 py-3 font-medium text-right">{t('users.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-slate-600 overflow-hidden border border-slate-200 dark:border-slate-500 flex items-center justify-center flex-shrink-0">
                          {user.photoURL ? (
                            <img 
                              src={user.photoURL} 
                              alt={user.displayName || 'User'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                              {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {user.displayName || t('users.table.user')}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingUser?.uid === user.uid ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveCustomName();
                              if (e.key === 'Escape') {
                                setEditingUser(null);
                                setCustomName('');
                              }
                            }}
                            className="px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveCustomName}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(null);
                              setCustomName('');
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span className="text-slate-600 dark:text-slate-300">
                            {user.customName || '-'}
                          </span>
                          <button
                            onClick={() => handleEditCustomName(user)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-opacity"
                            title={t('users.table.customName')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden md:table-cell">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(user.uid, UserStatus.ACTIVE)}
                            className="px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                          >
                            {t('users.actions.approve')}
                          </button>
                        )}
                        {user.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange(user.uid, UserStatus.INACTIVE)}
                            className="px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            {t('users.actions.deactivate')}
                          </button>
                        )}
                        {user.status === 'inactive' && (
                          <button
                            onClick={() => handleStatusChange(user.uid, UserStatus.ACTIVE)}
                            className="px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                          >
                            {t('users.actions.activate')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
