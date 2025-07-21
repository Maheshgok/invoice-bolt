import React from 'react';
import { LogIn } from 'lucide-react';
import { authService } from '../services/auth';

interface LoginButtonProps {
  className?: string;
}

const LoginButton: React.FC<LoginButtonProps> = ({ className = '' }) => {
  const handleLogin = () => {
    const authUrl = authService.getAuthUrl();
    window.location.href = authUrl;
  };

  return (
    <button
      onClick={handleLogin}
      className={`flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors ${className}`}
    >
      <LogIn className="w-4 h-4" />
      Sign in with Google
    </button>
  );
};

export default LoginButton;