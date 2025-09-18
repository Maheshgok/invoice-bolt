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
    
    // Try multiple possible field names the backend might expect
    const possibleFieldNames = [
      'file',           // Most common
      'upload',         // Common alternative
      'document',       // Document-specific
      'invoice_file',   // Our current attempt
      'image',          // Image-specific
      'attachment'      // Generic attachment
    ];
    
    console.log('=== TESTING MULTIPLE FIELD NAMES ===');
    
    // Initialize formData variable
    let formData = new FormData();
    let workingFieldName: string | null = null;
    
    // Test each field name to find what works
    for (const fieldName of possibleFieldNames) {
      console.log(`\n--- TESTING FIELD NAME: "${fieldName}" ---`);
      
      const testFormData = new FormData();
      testFormData.append(fieldName, file);
      
      // Verify FormData was created correctly
      console.log('FormData entries for', fieldName);
      for (let [key, value] of testFormData.entries()) {
        if (value instanceof File) {
          console.log(`  "${key}": File(name="${value.name}", size=${value.size}, type="${value.type}")`);
        } else {
          console.log(`  "${key}": ${value}`);
        }
      }
      
      // Test this field name
      try {
        const testResponse = await fetch(`${CLOUD_RUN_URL}/upload_invoice`, {
          method: 'POST',
          body: testFormData,
        });
        
        console.log(`Response for "${fieldName}": ${testResponse.status}`);
        
        if (testResponse.ok) {
          console.log(`✅ SUCCESS! Field name "${fieldName}" works!`);
          // Use this working FormData for the actual request
          formData = testFormData;
          workingFieldName = fieldName;
          break;
        } else {
          const errorText = await testResponse.text();
          console.log(`❌ Failed with "${fieldName}":`, errorText);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`❌ Error testing "${fieldName}":`, errorMessage);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // If none worked, create FormData with the most common field name as fallback
    if (!workingFieldName) {
      formData = new FormData();
      formData.append('file', file);
      console.log('No field name worked, using "file" as fallback');
    } else {
      console.log(`Using working field name: "${workingFieldName}"`);
    }
    
    // If we found a working field name above, we don't need to make another request
    // The successful test request above already worked, so let's use those results
    if (workingFieldName) {
      console.log(`✅ Field name "${workingFieldName}" already succeeded in testing!`);
      console.log('Skipping additional request since we found the working field name.');
      
      // Since the test request already succeeded, we would get the same response
      // Let's make one final authenticated request with the working field name
      const finalFormData = new FormData();
      finalFormData.append(workingFieldName, file);
      
      console.log('=== MAKING FINAL AUTHENTICATED REQUEST ===');
      response = await fetch(`${CLOUD_RUN_URL}/upload_invoice`, {
        method: 'POST',
        headers: headers,
        body: finalFormData,
      });
    } else {
      console.log('=== NO WORKING FIELD NAME FOUND, TRYING FINAL ATTEMPT ===');
      response = await fetch(`${CLOUD_RUN_URL}/upload_invoice`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });
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