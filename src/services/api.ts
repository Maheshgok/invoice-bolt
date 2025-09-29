// API service for file upload and processing
import { authService } from './auth';

// Cloud Run service URL
const CLOUD_RUN_URL = 'https://initial-api-545188726513.asia-south1.run.app';

export interface ApiResponse {
  success: boolean;
  data?: Record<string, any>[];
  message?: string;
}

// Get authenticated headers with Cloud Run token
async function getAuthenticatedHeaders(additionalHeaders: Record<string, string> = {}): Promise<Headers> {
  console.log('=== Getting Authenticated Headers ===');
  const headers = new Headers(additionalHeaders);
  
  // Check authentication
  const isAuthenticated = authService.isAuthenticated();
  console.log('Is authenticated:', isAuthenticated);
  if (!isAuthenticated) {
    console.error('Authentication required but user is not authenticated');
    throw new Error('Authentication required');
  }

  // Get ID token
  console.log('Getting ID token...');
  const idToken = await authService.getIdToken();
  console.log('ID token available:', !!idToken, idToken ? `(length: ${idToken.length})` : '');
  if (!idToken) {
    console.error('No ID token available');
    throw new Error('No ID token available');
  }

  try {
    // Get Cloud Run token using the ID token
    console.log('Fetching Cloud Run token...');
    const tokenResponse = await fetch('/.netlify/functions/get-cloud-run-token', {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    console.log('Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to get Cloud Run token. Status:', tokenResponse.status, 'Response:', errorText);
      throw new Error(`Failed to get Cloud Run authentication token: ${tokenResponse.status} ${errorText}`);
    }
    
    const responseData = await tokenResponse.json();
    console.log('Token response data available:', !!responseData);
    
    if (!responseData.token) {
      console.error('Invalid Cloud Run token response:', responseData);
      throw new Error('Invalid Cloud Run authentication token');
    }
    
    console.log('Cloud Run token obtained successfully (length:', responseData.token.length, ')');
    headers.set('Authorization', `Bearer ${responseData.token}`);
    console.log('=== Authenticated Headers Ready ===');
    return headers;
  } catch (error) {
    console.error('Error getting authenticated headers:', error);
    throw error;
  }
}

// Function to upload an invoice file directly to Cloud Run
export const uploadInvoice = async (file: File): Promise<{ backend_request_id: string }> => {
  console.log('=== UPLOADING INVOICE DIRECTLY TO CLOUD RUN ===');
  console.log('File name:', file.name);
  console.log('File size:', file.size);
  console.log('File type:', file.type);
  
  try {
    // Get authenticated headers
    const headers = await getAuthenticatedHeaders();
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload directly to Cloud Run
    const response = await fetch(`${CLOUD_RUN_URL}/upload`, {
      method: 'POST',
      headers: headers,
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed - Status:', response.status, 'Response:', errorText);
      throw new Error(`Upload failed! status: ${response.status}, body: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Upload response:', result);
    
    if (!result.backend_request_id) {
      throw new Error('Invalid response - missing backend_request_id');
    }
    
    return { backend_request_id: result.backend_request_id };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Poll backend for job status/result
export const getJobStatus = async (jobId: string): Promise<{ status: string; result?: any }> => {
  // Get authenticated headers
  const headers = await getAuthenticatedHeaders();
  
  const response = await fetch(`${CLOUD_RUN_URL}/status/${jobId}`, {
    headers: headers
  });
  if (!response.ok) {
    throw new Error('Failed to get job status');
  }
  
  return response.json();
};

// Mock invoice data generator for demonstration
const generateMockInvoiceData = (): Record<string, any>[] => {
  const mockData = [];
  const vendors = ['Acme Corp', 'Tech Solutions Inc', 'Office Supplies Ltd', 'Cloud Services Co', 'Marketing Agency'];
  const categories = ['Office Supplies', 'Software', 'Consulting', 'Hardware', 'Marketing'];
  
  for (let i = 1; i <= 25; i++) {
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const amount = (Math.random() * 5000 + 100).toFixed(2);
    const date = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString();
    
    mockData.push({
      'Invoice ID': `INV-${String(i).padStart(4, '0')}`,
      'Vendor': vendor,
      'Amount': `$${amount}`,
      'Date': date,
      'Category': category,
      'Status': ['Processed', 'Pending', 'Approved'][Math.floor(Math.random() * 3)],
      'Tax': `$${(parseFloat(amount) * 0.08).toFixed(2)}`,
      'Total': `$${(parseFloat(amount) * 1.08).toFixed(2)}`,
      'Confidence': `${(Math.random() * 20 + 80).toFixed(1)}%`,
    });
  }
  
  return mockData;
};