// Token storage service for managing Google authentication tokens
export interface StoredTokens {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_at: number;
  token_type: string;
  scope: string;
}

export class TokenStorageService {
  private static instance: TokenStorageService;
  private readonly STORAGE_KEY = 'google_auth_tokens';
  
  public static getInstance(): TokenStorageService {
    if (!TokenStorageService.instance) {
      TokenStorageService.instance = new TokenStorageService();
    }
    return TokenStorageService.instance;
  }

  // Store tokens with expiration calculation
  storeTokens(tokens: any): void {
    const expiresAt = Date.now() + (tokens.expires_in * 1000);
    
    const storedTokens: StoredTokens = {
      access_token: tokens.access_token,
      id_token: tokens.id_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      token_type: tokens.token_type || 'Bearer',
      scope: tokens.scope || '',
    };

    // Store in localStorage for persistence
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedTokens));
    
    // Also log token details for debugging (without exposing full tokens)
    console.log('=== TOKEN STORAGE ===');
    console.log('Access token length:', tokens.access_token?.length);
    console.log('ID token length:', tokens.id_token?.length);
    console.log('Refresh token available:', !!tokens.refresh_token);
    console.log('Expires in:', tokens.expires_in, 'seconds');
    console.log('Expires at:', new Date(expiresAt).toISOString());
    console.log('Token type:', tokens.token_type);
    console.log('Scope:', tokens.scope);
    console.log('====================');
  }

  // Get stored tokens
  getStoredTokens(): StoredTokens | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const tokens = JSON.parse(stored) as StoredTokens;
      
      // Check if tokens are expired
      if (Date.now() >= tokens.expires_at) {
        console.log('Stored tokens have expired');
        this.clearStoredTokens();
        return null;
      }
      
      return tokens;
    } catch (error) {
      console.error('Error retrieving stored tokens:', error);
      return null;
    }
  }

  // Get access token
  getAccessToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.access_token || null;
  }

  // Get ID token
  getIdToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.id_token || null;
  }

  // Get refresh token
  getRefreshToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.refresh_token || null;
  }

  // Check if tokens are valid and not expired
  isTokenValid(): boolean {
    const tokens = this.getStoredTokens();
    return tokens !== null;
  }

  // Clear stored tokens
  clearStoredTokens(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('Stored tokens cleared');
  }

  // Get token expiration info
  getTokenExpiration(): { expiresAt: Date; isExpired: boolean; expiresInMinutes: number } | null {
    const tokens = this.getStoredTokens();
    if (!tokens) return null;

    const expiresAt = new Date(tokens.expires_at);
    const isExpired = Date.now() >= tokens.expires_at;
    const expiresInMinutes = Math.max(0, Math.floor((tokens.expires_at - Date.now()) / (1000 * 60)));

    return {
      expiresAt,
      isExpired,
      expiresInMinutes,
    };
  }

  // Get all token information for debugging
  getTokenInfo(): any {
    const tokens = this.getStoredTokens();
    if (!tokens) return null;

    const expiration = this.getTokenExpiration();
    
    return {
      hasAccessToken: !!tokens.access_token,
      hasIdToken: !!tokens.id_token,
      hasRefreshToken: !!tokens.refresh_token,
      tokenType: tokens.token_type,
      scope: tokens.scope,
      accessTokenLength: tokens.access_token?.length,
      idTokenLength: tokens.id_token?.length,
      expiration,
    };
  }
}

export const tokenStorage = TokenStorageService.getInstance();