# Invoice Bolt

A secure invoice processing application with Google OAuth authentication and file upload capabilities.

## Setup Instructions

### 1. Google OAuth Configuration

To enable authentication, you need to configure Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Add your domain to authorized origins:
   - For local development: `http://localhost:5173`
   - For production: `https://your-domain.netlify.app`
6. Add redirect URIs:
   - For local development: `http://localhost:5173/oauth2/callback`
   - For production: `https://your-domain.netlify.app/oauth2/callback`

### 2. Environment Variables

#### Local Development
Create a `.env` file in the project root:
```
VITE_GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
```

#### Production (Netlify)
Set environment variables in Netlify:
- `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret (for server-side functions)

### 3. Security Notes

- Never commit your `.env` file to version control
- The Client ID is safe to expose in frontend code (it's designed to be public)
- The Client Secret should only be used in server-side functions
- Tokens are stored securely in localStorage with expiration tracking

## Development

```bash
npm install
npm run dev
```

## Features

- 🔐 Secure Google OAuth authentication
- 📁 File upload with drag-and-drop support
- 📊 Data processing and visualization
- 💾 Persistent token storage
- 🔍 Token debugging panel
- 📱 Responsive design

## Token Management

The application includes a comprehensive token management system:
- Automatic token expiration detection
- Secure storage in localStorage
- Token refresh capabilities
- Debug panel for troubleshooting authentication issues
