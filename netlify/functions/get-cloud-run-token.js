const { GoogleAuth } = require('google-auth-library');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    // Cloud Run service URL
    const cloudRunUrl = 'https://initial-api-545188726513.asia-south1.run.app';

    // Create a new GoogleAuth instance
    const auth = new GoogleAuth();

    // Get the ID token with the correct audience
    const client = await auth.getIdTokenClient(cloudRunUrl);
    const idToken = await client.idTokenProvider.getToken();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ token: idToken.token }),
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