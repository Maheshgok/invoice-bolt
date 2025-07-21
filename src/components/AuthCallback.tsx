import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { Loader2, AlertCircle } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Exchange code for tokens
        const tokens = await authService.exchangeCodeForTokens(code);
        
        // Store tokens
        authService.storeTokens(tokens);

        // Get user profile
        const user = await authService.getUserProfile(tokens.access_token);
        
        // Store user info in localStorage for the app
        localStorage.setItem('user', JSON.stringify(user));

        setStatus('success');
        
        // Redirect to main app after successful authentication
        setTimeout(() => {
          navigate('/');
        }, 2000);

      } catch (err) {
        console.error('Authentication error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Authenticating...
            </h2>
            <p className="text-gray-600">
              Please wait while we complete your sign-in process.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Authentication Successful!
            </h2>
            <p className="text-gray-600">
              Redirecting you to the application...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;