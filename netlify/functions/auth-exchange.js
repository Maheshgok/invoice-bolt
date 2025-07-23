const https = require('https');
const querystring = require('querystring');

exports.handler = async (event, context) => {
  console.log('=== TOKEN EXCHANGE FUNCTION CALLED ===');
  console.log('Method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));
  console.log('Body:', event.body);
  
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { code, redirect_uri } = JSON.parse(event.body);
    
    console.log('Exchange request:', { code: code?.substring(0, 10) + '...', redirect_uri });

    if (!code || !redirect_uri) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing code or redirect_uri' }),
      };
    }

    const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    console.log('Environment check:', {
      hasViteClientId: !!process.env.VITE_GOOGLE_CLIENT_ID,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      clientIdLength: clientId?.length,
      clientSecretLength: clientSecret?.length
    });
    if (!clientId || !clientSecret) {
      console.error('Missing environment variables:', { 
        hasClientId: !!clientId, 
        hasClientSecret: !!clientSecret 
      });
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' }),
      };
    }

    const tokenData = querystring.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirect_uri,
    });

    console.log('Making token request to Google...');
    const tokenResponse = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(tokenData),
        },
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            console.log('Google response status:', res.statusCode);
            console.log('Google response data:', data);
            const parsed = JSON.parse(data);
            if (res.statusCode === 200) {
              resolve(parsed);
            } else {
              console.error('Google token error:', parsed);
              reject(new Error(parsed.error_description || parsed.error || 'Token exchange failed'));
            }
          } catch (e) {
            console.error('Failed to parse Google response:', e);
            reject(new Error('Invalid response from Google'));
          }
        });
      });

      req.on('error', reject);
      req.write(tokenData);
      req.end();
    });

    console.log('Token exchange successful');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(tokenResponse),
    };

  } catch (error) {
    console.error('Token exchange error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Token exchange failed',
        details: error.message 
      }),
    };
  }
};