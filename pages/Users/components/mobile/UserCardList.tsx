import React from 'react';
import Box from '@/components/ui/Box';
import { UserData, UserStatus, UserRole } from '@/types/user';
import UserCard from './UserCard';

interface UserCardListProps {
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

const UserCardList: React.FC<UserCardListProps> = ({
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
  return (
    <Box layoutClassName="space-y-4 lg:hidden">
      {users.map((user) => (
        <UserCard
          key={user.uid}
          user={user}
          editingUser={editingUser}
          editingRoleUser={editingRoleUser}
          customName={customName}
          selectedRole={selectedRole}
          onEditCustomName={onEditCustomName}
          onSaveCustomName={onSaveCustomName}
          onCancelEditCustomName={onCancelEditCustomName}
          onCustomNameChange={onCustomNameChange}
          onEditRole={onEditRole}
          onSaveRole={onSaveRole}
          onCancelEditRole={onCancelEditRole}
          onRoleChange={onRoleChange}
          onStatusChange={onStatusChange}
        />
      ))}
    </Box>
  );
};

export default UserCardList;

