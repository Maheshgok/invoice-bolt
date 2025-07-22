import React from 'react';
import { LogIn } from 'lucide-react';
import { authService } from '../services/auth';

interface LoginButtonProps {
  className?: string;
  disabled?: boolean;
}

const LoginButton: React.FC<LoginButtonProps> = ({ className = '', disabled = false }) => {
  const handleLogin = () => {
    if (disabled) return;
    
    try {
    const authUrl = authService.getAuthUrl();
      console.log('Redirecting to:', authUrl);
    window.location.href = authUrl;
    } catch (error) {
      console.error('Login error:', error);
      alert('Login configuration error. Please check the console.');
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={disabled}
      className={`flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <LogIn className="w-4 h-4" />
      Sign in with Google
    </button>
  );
};

export default LoginButton;