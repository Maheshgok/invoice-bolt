import React from 'react';
import { LogIn } from 'lucide-react';
import { authService } from '../services/auth';

interface LoginButtonProps {
  className?: string;
  disabled?: boolean;
}

const LoginButton: React.FC<LoginButtonProps> = ({ className = '', disabled = false }) => {
  // Debug environment variables
  React.useEffect(() => {
    console.log('=== DETAILED ENVIRONMENT DEBUG ===');
    console.log('Current working directory:', window.location.origin);
    console.log('Vite mode:', import.meta.env.MODE);
    console.log('Vite dev:', import.meta.env.DEV);
    console.log('Raw VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
    console.log('CLIENT_ID type:', typeof import.meta.env.VITE_GOOGLE_CLIENT_ID);
    console.log('CLIENT_ID is undefined:', import.meta.env.VITE_GOOGLE_CLIENT_ID === undefined);
    console.log('CLIENT_ID is empty string:', import.meta.env.VITE_GOOGLE_CLIENT_ID === '');
    console.log('CLIENT_ID length:', import.meta.env.VITE_GOOGLE_CLIENT_ID?.length);
    console.log('All available env vars:', Object.keys(import.meta.env));
    console.log('Full env object:', import.meta.env);
    console.log('==================================');
  }, []);

  const handleLogin = () => {
    if (disabled) return;
    
    try {
      console.log('Attempting to get auth URL...');
      const authUrl = authService.getAuthUrl();
      console.log('Redirecting to:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login error:', error);
      alert(`Login configuration error: ${error.message}`);
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