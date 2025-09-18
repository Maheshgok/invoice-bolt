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

// Upload invoice and get backend_request_id from backend
export const uploadInvoice = async (file: File): Promise<{ backend_request_id: string }> => {
  console.log('=== UPLOAD INVOICE DEBUG ===');
  console.log('File name:', file.name);
  console.log('File size:', file.size);
  console.log('File type:', file.type);
  
  let response;
  try {
    // Get authenticated headers but don't include Content-Type
    const headers = await getAuthenticatedHeaders();
    
    // Remove Content-Type header if present (let browser set it with boundary)
    headers.delete('Content-Type');
    console.log('Headers after Content-Type removal:', Array.from(headers.entries()));
    
    // Prepare form data
    const formData = new FormData();
    formData.append('invoice_file', file);
    console.log('FormData created with invoice_file field');
    
    // Debug FormData contents in detail
    console.log('=== DETAILED FormData DEBUG ===');
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  Key: "${key}" -> File:`, {
          name: value.name,
          size: value.size,
          type: value.type,
          lastModified: value.lastModified
        });
      } else {
        console.log(`  Key: "${key}" -> Value:`, value);
      }
    }
    
    // Also try logging FormData object itself
    console.log('FormData object:', formData);
    console.log('FormData constructor:', formData.constructor.name);
    
    // Debug headers being sent
    console.log('=== HEADERS BEFORE SENDING ===');
    for (let [key, value] of headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    // Check if Content-Type is being set (it should be auto-set by browser for FormData)
    if (headers.has('Content-Type')) {
      console.log('WARNING: Content-Type header is set, this might interfere with FormData boundary');
      console.log('Removing Content-Type to let browser handle it...');
      headers.delete('Content-Type');
    }
    
    // Send to backend
    console.log('Calling endpoint:', `${CLOUD_RUN_URL}/upload_invoice`);
    console.log('Request details:', {
      method: 'POST',
      hasHeaders: headers instanceof Headers,
      headerCount: Array.from(headers.entries()).length,
      bodyType: formData.constructor.name
    });
    
    // First try with our headers
    console.log('=== ATTEMPTING REQUEST WITH AUTH HEADERS ===');
    response = await fetch(`${CLOUD_RUN_URL}/upload_invoice`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });
    
    // If it fails with 400, try without custom headers as a test
    if (response.status === 400) {
      console.log('=== REQUEST FAILED, TRYING WITHOUT CUSTOM HEADERS FOR DEBUG ===');
      const testFormData = new FormData();
      testFormData.append('invoice_file', file);
      
      const testResponse = await fetch(`${CLOUD_RUN_URL}/upload_invoice`, {
        method: 'POST',
        body: testFormData, // No custom headers
      });
      
      console.log('Test response status (no headers):', testResponse.status);
      if (testResponse.status !== 400) {
        console.log('SUCCESS WITHOUT HEADERS! The issue is likely with our headers.');
        const testText = await testResponse.text();
        console.log('Test response body:', testText);
      } else {
        console.log('Still failed without headers - issue is likely with FormData construction');
        const testError = await testResponse.text();
        console.log('Test error without headers:', testError);
      }
    }
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed - Status:', response.status, 'Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Response data:', result);
    
    // Backend returns 'job_id' not 'backend_request_id'
    if (!result.job_id) {
      console.error('No job_id in response:', result);
      throw new Error('No job_id returned from backend');
    }
    
    console.log('Upload successful with job_id:', result.job_id);
    return { backend_request_id: result.job_id }; // Map job_id to backend_request_id for consistency
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