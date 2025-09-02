// Netlify function to handle /api/status endpoint
const fetch = require('node-fetch');

// Cloud Run service URL - keep in sync with src/services/api.ts
const CLOUD_RUN_URL = 'https://initial-api-545188726513.asia-south1.run.app';

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
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

    // Extract the token from the Authorization header
    const token = authHeader.split(' ')[1];
    
    // Get the jobId from query parameters if provided
    const params = event.queryStringParameters || {};
    const jobId = params.jobId;
    
    const endpoint = jobId
      ? `/api/status?jobId=${encodeURIComponent(jobId)}`
      : '/api/status';
    
    // Forward the request to Cloud Run with the token
    const response = await fetch(`${CLOUD_RUN_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Get the response data
    const responseData = await response.json();
    
    // Return the Cloud Run response
    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(responseData)
    };
  } catch (error) {
    console.error('Error forwarding request to Cloud Run:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal Server Error",
        details: error.message
      })
    };
  }
};