import Cookies from 'js-cookie';
import { User, GoogleAuthResponse } from '../types/auth';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'openid email profile';
const PRODUCTION_DOMAIN = 'https://invoiceparse.netlify.app';

// Get the redirect URI - use production domain in production, current domain in development
const getRedirectUri = (): string => {
  // Use production domain if we're not in development
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const baseUrl = isDevelopment ? window.location.origin : PRODUCTION_DOMAIN;
  return `${baseUrl}/oauth2/callback`;
};

export class AuthService {
  private static instance: AuthService;
  
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Generate OAuth2 authorization URL
  getAuthUrl(): string {
    console.log('=== AUTH URL GENERATION DEBUG ===');
    console.log('Raw CLIENT_ID from env:', CLIENT_ID);
    console.log('CLIENT_ID type:', typeof CLIENT_ID);
    console.log('CLIENT_ID length:', CLIENT_ID?.length);
    console.log('CLIENT_ID is defined:', !!CLIENT_ID);
    console.log('CLIENT_ID is not placeholder:', CLIENT_ID !== 'your_google_client_id_here');
    
    if (!CLIENT_ID || 
        CLIENT_ID === 'your_google_client_id_here' || 
        CLIENT_ID === 'your_actual_google_client_id_here' ||
        CLIENT_ID === 'undefined' ||
        CLIENT_ID === 'null') {
      console.error('CLIENT_ID validation failed:', CLIENT_ID);
      console.error('Google Client ID not configured properly');
      throw new Error('Google Client ID not configured. Please check your environment variables.');
    }
    
    const redirectUri = getRedirectUri();
    console.log('OAuth URL generation:', { 
      CLIENT_ID: CLIENT_ID.substring(0, 20) + '...', 
      redirectUri,
      fullClientId: CLIENT_ID
    });
    console.log('================================');
    
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('Generated auth URL:', authUrl);
    return authUrl;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string): Promise<GoogleAuthResponse> {
    const redirectUri = getRedirectUri();
    
    console.log('Exchanging code for tokens...', { 
      code: code.substring(0, 10) + '...', 
      redirectUri 
    });
    
    const response = await fetch('/api/auth/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: redirectUri,
      }),
    });

    console.log('Exchange response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Exchange error response:', errorText);
      throw new Error('Failed to exchange code for tokens');
    }

    return response.json();
  }

  // Get user profile from Google
  async getUserProfile(accessToken: string): Promise<User> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = await response.json();
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    };
  }

  // Store tokens securely
  storeTokens(tokens: GoogleAuthResponse): void {
    Cookies.set('access_token', tokens.access_token, { 
      expires: tokens.expires_in / (24 * 60 * 60),
      secure: true,
      sameSite: 'strict'
    });
    
    if (tokens.refresh_token) {
      Cookies.set('refresh_token', tokens.refresh_token, { 
        expires: 30,
        secure: true,
        sameSite: 'strict'
      });
    }
  }

  // Get stored access token
  getAccessToken(): string | null {
    return Cookies.get('access_token') || null;
  }

  // Clear stored tokens
  clearTokens(): void {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // Refresh access token
  async refreshToken(): Promise<GoogleAuthResponse> {
    const refreshToken = Cookies.get('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const tokens = await response.json();
    this.storeTokens(tokens);
    return tokens;
  }
}

export const authService = AuthService.getInstance();