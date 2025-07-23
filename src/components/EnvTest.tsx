import React from 'react';

const EnvTest: React.FC = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-yellow-800 mb-2">Environment Variable Test</h3>
      <div className="text-sm space-y-1">
        <p><strong>Mode:</strong> {import.meta.env.MODE}</p>
        <p><strong>Dev:</strong> {import.meta.env.DEV ? 'Yes' : 'No'}</p>
        <p><strong>Client ID exists:</strong> {clientId ? 'Yes' : 'No'}</p>
        <p><strong>Client ID length:</strong> {clientId?.length || 0}</p>
        <p><strong>Client ID preview:</strong> {clientId ? `${clientId.substring(0, 20)}...` : 'Not found'}</p>
        <p><strong>All VITE_ vars:</strong> {Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')).join(', ')}</p>
      </div>
    </div>
  );
};

export default EnvTest;