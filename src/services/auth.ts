import Cookies from 'js-cookie';
import { User, GoogleAuthResponse } from '../types/auth';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = 'https://invoiceparse.netlify.app/oauth2/callback';
const SCOPES = 'openid email profile';

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
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string): Promise<GoogleAuthResponse> {
    const response = await fetch('/api/auth/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!response.ok) {
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