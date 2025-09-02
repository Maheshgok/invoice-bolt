import React from 'react';

const EnvTest: React.FC = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isDev = import.meta.env.DEV;
  const mode = import.meta.env.MODE;
  const isNetlify = window.location.hostname.includes('netlify.app');
  
  // Debug all environment variables
  const allEnvVars = import.meta.env;
  console.log('=== ALL ENVIRONMENT VARIABLES ===');
  console.log('Full env object:', allEnvVars);
  console.log('Keys:', Object.keys(allEnvVars));
  console.log('VITE_GOOGLE_CLIENT_ID specifically:', allEnvVars.VITE_GOOGLE_CLIENT_ID);
  console.log('==================================');
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-blue-800 mb-2">Environment Configuration</h3>
      <div className="text-sm space-y-1">
        <p><strong>Environment:</strong> {mode} {isDev ? '(Development)' : '(Production)'}</p>
        <p><strong>Domain:</strong> {window.location.origin}</p>
        <p><strong>Platform:</strong> {isNetlify ? 'Netlify' : 'Local'}</p>
        <p><strong>Client ID exists:</strong> {clientId ? 'Yes' : 'No'}</p>
        <p><strong>Client ID length:</strong> {clientId?.length || 0}</p>
        <p><strong>Client ID preview:</strong> {clientId ? `${clientId.substring(0, 20)}...` : 'Not found'}</p>
        <details className="mt-2">
          <summary className="cursor-pointer text-blue-700 font-medium">Debug Info (Click to expand)</summary>
          <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
            <p><strong>All env keys:</strong> {Object.keys(allEnvVars).join(', ')}</p>
            <p><strong>VITE_ prefixed keys:</strong> {Object.keys(allEnvVars).filter(key => key.startsWith('VITE_')).join(', ')}</p>
          </div>
        </details>
        {!clientId && isDev && (
          <p className="text-red-600 font-medium">
            ⚠️ Create .env file locally with VITE_GOOGLE_CLIENT_ID
          </p>
        )}
        {!clientId && !isDev && (
          <p className="text-red-600 font-medium">
            ⚠️ VITE_GOOGLE_CLIENT_ID not found in Netlify environment variables
          </p>
        )}
      </div>
    </div>
  );
};

export default EnvTest;