const { GoogleAuth } = require('google-auth-library');
const { OAuth2Client } = require('google-auth-library');

// Google OAuth client ID from environment variable
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Cloud Run service URL - keep in sync with src/services/api.ts
const CLOUD_RUN_URL = 'https://initial-api-545188726513.asia-south1.run.app';

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Check for Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Missing or invalid authorization token' }),
      };
    }

    // Extract the ID token from the Authorization header
    const idToken = authHeader.split(' ')[1];
    
    // Verify the ID token
    const client = new OAuth2Client(CLIENT_ID);
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: CLIENT_ID,
      });
      const payload = ticket.getPayload();
      
      // You can add additional validation here if needed
      // For example, check if the user's email is in an allowed list
      console.log(`Authenticated user: ${payload.email}`);
      
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid authentication token' }),
      };
    }

    // Since we already have a verified ID token from Google, we can use it directly
    // instead of trying to generate a new one with GoogleAuth
    console.log('Using the verified ID token directly for Cloud Run authentication');
    
    // Return the verified ID token to be used for Cloud Run authentication
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ token: idToken }),
    };

    // This return statement is now handled in the code above
  } catch (error) {
    console.error('Error generating Cloud Run token:', error);
    console.error('Error stack:', error.stack);
    
    // Log more details about the error
    const errorDetails = {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n') || 'No stack trace',
      code: error.code,
      cause: error.cause ? JSON.stringify(error.cause) : undefined
    };
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate token for Cloud Run',
        details: error.message,
        errorInfo: errorDetails
      }),
    };
  }
};