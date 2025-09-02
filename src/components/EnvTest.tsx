import React from 'react';

const EnvTest: React.FC = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isDev = import.meta.env.DEV;
  const mode = import.meta.env.MODE;
  const isNetlify = window.location.hostname.includes('netlify.app');
  const isValidClientId = clientId && 
    clientId !== 'your_google_client_id_here' && 
    clientId !== 'your_actual_google_client_id_here' &&
    clientId !== 'undefined' &&
    clientId !== 'null' &&
    clientId.includes('.apps.googleusercontent.com');
  
  // Debug all environment variables
  const allEnvVars = import.meta.env;
  console.log('=== ALL ENVIRONMENT VARIABLES ===');
  console.log('Full env object:', allEnvVars);
  console.log('Keys:', Object.keys(allEnvVars));
  console.log('VITE_GOOGLE_CLIENT_ID specifically:', allEnvVars.VITE_GOOGLE_CLIENT_ID);
  console.log('==================================');
  
  return (
    <div className={`border rounded-lg p-4 mb-4 ${
      isValidClientId 
        ? 'bg-green-50 border-green-200' 
        : 'bg-red-50 border-red-200'
    }`}>
      <h3 className={`font-semibold mb-2 ${
        isValidClientId ? 'text-green-800' : 'text-red-800'
      }`}>
        Environment Configuration
      </h3>
      <div className="text-sm space-y-1">
        <p><strong>Environment:</strong> {mode} {isDev ? '(Development)' : '(Production)'}</p>
        <p><strong>Domain:</strong> {window.location.origin}</p>
        <p><strong>Platform:</strong> {isNetlify ? 'Netlify' : 'Local'}</p>
        <p><strong>Client ID configured:</strong> {isValidClientId ? 'Yes' : 'No'}</p>
        <p><strong>Client ID length:</strong> {clientId?.length || 0}</p>
        <p><strong>Client ID preview:</strong> {
          isValidClientId 
            ? `${clientId.substring(0, 20)}...` 
            : clientId || 'Not found'
        }</p>
        
        {!isValidClientId && (
          <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
            <p className="text-red-800 font-medium text-sm mb-2">⚠️ Configuration Required</p>
            <div className="text-red-700 text-xs space-y-1">
              {isDev ? (
                <>
                  <p>1. Create a <code className="bg-red-200 px-1 rounded">.env</code> file in your project root</p>
                  <p>2. Add: <code className="bg-red-200 px-1 rounded">VITE_GOOGLE_CLIENT_ID=your_client_id</code></p>
                  <p>3. Get your Client ID from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="underline">Google Cloud Console</a></p>
                </>
              ) : (
                <>
                  <p>1. Set VITE_GOOGLE_CLIENT_ID in Netlify environment variables</p>
                  <p>2. Get your Client ID from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="underline">Google Cloud Console</a></p>
                </>
              )}
            </div>
          </div>
        )}
        
        <details className="mt-2">
          <summary className="cursor-pointer text-gray-700 font-medium">Debug Info (Click to expand)</summary>
          <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
            <p><strong>All env keys:</strong> {Object.keys(allEnvVars).join(', ')}</p>
            <p><strong>VITE_ prefixed keys:</strong> {Object.keys(allEnvVars).filter(key => key.startsWith('VITE_')).join(', ')}</p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default EnvTest;