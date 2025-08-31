const { GoogleAuth } = require('google-auth-library');
const { OAuth2Client } = require('google-auth-library');

// Google OAuth client ID from environment variable
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

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

    // Cloud Run service URL
    const cloudRunUrl = 'https://initial-api-545188726513.asia-south1.run.app';

    // Create a new GoogleAuth instance
    const auth = new GoogleAuth();

    // Get the ID token with the correct audience
    const cloudRunClient = await auth.getIdTokenClient(cloudRunUrl);
    const cloudRunToken = await cloudRunClient.idTokenProvider.getToken();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ token: cloudRunToken.token }),
    };
  } catch (error) {
    console.error('Error generating Cloud Run token:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate token for Cloud Run',
        details: error.message
      }),
    };
  }
};