import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../types/auth';
import { authService } from '../services/auth';

interface UserProfileProps {
  user: User;
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  const handleLogout = () => {
    authService.clearTokens();
    localStorage.removeItem('user');
    onLogout();
  };

  return (
    <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm border px-4 py-2">
      {user.picture ? (
        <img
          src={user.picture}
          alt={user.name}
          className="w-8 h-8 rounded-full"
        />
      ) : (
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          <UserIcon className="w-4 h-4 text-gray-600" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {user.name}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {user.email}
        </p>
      </div>
      
      <button
        onClick={handleLogout}
        className="text-gray-400 hover:text-red-600 transition-colors"
        title="Sign out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
};

export default UserProfile;