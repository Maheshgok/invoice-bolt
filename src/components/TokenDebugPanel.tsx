import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, RefreshCw, Copy, Check } from 'lucide-react';
import { authService } from '../services/auth';
import { tokenStorage } from '../services/tokenStorage';

const TokenDebugPanel: React.FC = () => {
  const [showTokens, setShowTokens] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const refreshTokenInfo = () => {
    const info = authService.getTokenInfo();
    setTokenInfo(info);
  };

  useEffect(() => {
    refreshTokenInfo();
    // Refresh token info every 30 seconds
    const interval = setInterval(refreshTokenInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const truncateToken = (token: string, showFull: boolean = false) => {
    if (showFull) return token;
    return `${token.substring(0, 20)}...${token.substring(token.length - 10)}`;
  };

  if (!tokenInfo) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">No authentication tokens found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Authentication Tokens</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTokens(!showTokens)}
            className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors"
          >
            {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showTokens ? 'Hide' : 'Show'} Tokens
          </button>
          <button
            onClick={refreshTokenInfo}
            className="flex items-center gap-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-md transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Access Token</span>
            <span className={`px-2 py-1 text-xs rounded-full ${tokenInfo.hasAccessToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {tokenInfo.hasAccessToken ? 'Available' : 'Missing'}
            </span>
          </div>
          {tokenInfo.hasAccessToken && (
            <div className="text-xs text-gray-500">
              Length: {tokenInfo.accessTokenLength} characters
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">ID Token</span>
            <span className={`px-2 py-1 text-xs rounded-full ${tokenInfo.hasIdToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {tokenInfo.hasIdToken ? 'Available' : 'Missing'}
            </span>
          </div>
          {tokenInfo.hasIdToken && (
            <div className="text-xs text-gray-500">
              Length: {tokenInfo.idTokenLength} characters
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Refresh Token</span>
            <span className={`px-2 py-1 text-xs rounded-full ${tokenInfo.hasRefreshToken ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {tokenInfo.hasRefreshToken ? 'Available' : 'Not Available'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Token Type</span>
            <span className="text-sm text-gray-800">{tokenInfo.tokenType}</span>
          </div>
        </div>
      </div>

      {tokenInfo.expiration && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Token Expiration</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Expires at:</span>
              <div className="font-mono text-xs">{tokenInfo.expiration.expiresAt.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <div className={`font-medium ${tokenInfo.expiration.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                {tokenInfo.expiration.isExpired ? 'Expired' : 'Valid'}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Time remaining:</span>
              <div className="font-medium">{tokenInfo.expiration.expiresInMinutes} minutes</div>
            </div>
          </div>
        </div>
      )}

      {tokenInfo.scope && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Granted Scopes</h4>
          <div className="flex flex-wrap gap-1">
            {tokenInfo.scope.split(' ').map((scope: string, index: number) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {scope}
              </span>
            ))}
          </div>
        </div>
      )}

      {showTokens && (
        <div className="space-y-4 border-t pt-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm font-medium mb-1">⚠️ Security Warning</p>
            <p className="text-yellow-700 text-xs">
              These tokens provide access to your Google account. Never share them publicly or store them insecurely.
            </p>
          </div>

          {tokenInfo.hasAccessToken && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Access Token</label>
                <button
                  onClick={() => copyToClipboard(tokenStorage.getAccessToken() || '', 'access')}
                  className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                >
                  {copiedField === 'access' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedField === 'access' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-gray-100 rounded p-2 font-mono text-xs break-all">
                {truncateToken(tokenStorage.getAccessToken() || '', showTokens)}
              </div>
            </div>
          )}

          {tokenInfo.hasIdToken && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">ID Token</label>
                <button
                  onClick={() => copyToClipboard(tokenStorage.getIdToken() || '', 'id')}
                  className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                >
                  {copiedField === 'id' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedField === 'id' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-gray-100 rounded p-2 font-mono text-xs break-all">
                {truncateToken(tokenStorage.getIdToken() || '', showTokens)}
              </div>
            </div>
          )}

          {tokenInfo.hasRefreshToken && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Refresh Token</label>
                <button
                  onClick={() => copyToClipboard(tokenStorage.getRefreshToken() || '', 'refresh')}
                  className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                >
                  {copiedField === 'refresh' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedField === 'refresh' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-gray-100 rounded p-2 font-mono text-xs break-all">
                {truncateToken(tokenStorage.getRefreshToken() || '', showTokens)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TokenDebugPanel;