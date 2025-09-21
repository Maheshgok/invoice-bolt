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

// Request a signed URL for direct upload to Google Cloud Storage
export const getSignedUrl = async (fileName: string, fileType: string): Promise<{
  signedUrl: string;
  requestId: string;
  fileName: string;
  bucketPath: string;
}> => {
  console.log('=== REQUESTING SIGNED URL ===');
  console.log('File name:', fileName);
  console.log('File type:', fileType);
  
  try {
    // Get authenticated headers
    const headers = await getAuthenticatedHeaders({
      'Content-Type': 'application/json'
    });
    
    const requestBody = {
      fileName: fileName,
      fileType: fileType
    };
    
    console.log('Requesting signed URL from:', `${CLOUD_RUN_URL}/get_signed_url`);
    console.log('Request body:', requestBody);
    
    const response = await fetch(`${CLOUD_RUN_URL}/get_signed_url`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    console.log('Signed URL response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get signed URL - Status:', response.status, 'Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Signed URL response:', result);
    
    if (!result.signedUrl || !result.requestId) {
      console.error('Invalid signed URL response:', result);
      throw new Error('Invalid signed URL response - missing signedUrl or requestId');
    }
    
    return {
      signedUrl: result.signedUrl,
      requestId: result.requestId,
      fileName: result.fileName || fileName,
      bucketPath: result.bucketPath || ''
    };
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
};

// Upload file directly to Google Cloud Storage using signed URL
export const uploadToGCS = async (file: File, signedUrl: string): Promise<void> => {
  console.log('=== UPLOADING TO GOOGLE CLOUD STORAGE ===');
  console.log('File name:', file.name);
  console.log('File size:', file.size);
  console.log('Signed URL:', signedUrl.substring(0, 100) + '...');
  
  try {
    const response = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file
    });
    
    console.log('GCS upload response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GCS upload failed - Status:', response.status, 'Response:', errorText);
      throw new Error(`GCS upload failed! status: ${response.status}, body: ${errorText}`);
    }
    
    console.log('✅ File uploaded successfully to GCS');
  } catch (error) {
    console.error('Error uploading to GCS:', error);
    throw error;
  }
};

// Modified upload invoice function using signed URL flow
export const uploadInvoice = async (file: File): Promise<{ backend_request_id: string }> => {
  console.log('=== UPLOAD INVOICE WITH SIGNED URL FLOW ===');
  console.log('File name:', file.name);
  console.log('File size:', file.size);
  console.log('File type:', file.type);
  
  try {
    // Step 1: Request signed URL from backend
    console.log('Step 1: Requesting signed URL...');
    const { signedUrl, requestId, fileName, bucketPath } = await getSignedUrl(file.name, file.type);
    
    console.log('✅ Received signed URL');
    console.log('Request ID:', requestId);
    console.log('File name:', fileName);
    console.log('Bucket path:', bucketPath);
    
    // Step 2: Upload file directly to Google Cloud Storage
    console.log('Step 2: Uploading to Google Cloud Storage...');
    await uploadToGCS(file, signedUrl);
    
    console.log('✅ Upload completed successfully');
    console.log('Request ID for Firestore queries:', requestId);
    
    // Return the request ID that can be used to query Firestore for results
    return { backend_request_id: requestId };
    
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