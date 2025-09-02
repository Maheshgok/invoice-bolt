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
  const headers = new Headers(additionalHeaders);
  
  if (!authService.isAuthenticated()) {
    throw new Error('Authentication required');
  }

  const idToken = await authService.getIdToken();
  if (!idToken) {
    throw new Error('No ID token available');
  }

  // Get Cloud Run token using the ID token
  const tokenResponse = await fetch('/.netlify/functions/get-cloud-run-token', {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });
  
  if (!tokenResponse.ok) {
    throw new Error('Failed to get Cloud Run authentication token');
  }
  
  const { token } = await tokenResponse.json();
  if (!token) {
    throw new Error('Invalid Cloud Run authentication token');
  }
  
  headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

// Upload images and get jobId from backend
export const uploadImages = async (files: File[]): Promise<{ jobId: string }> => {
  // Get authenticated headers
  const headers = await getAuthenticatedHeaders();
  
  // Prepare form data (multiple images)
  const formData = new FormData();
  files.forEach((file, idx) => {
    formData.append('file', file);
  });
  
  // Send to backend
  const response = await fetch(`${CLOUD_RUN_URL}/upload_invoice`, {
    method: 'POST',
    headers: headers,
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const result = await response.json();
  if (!result.jobId) {
    throw new Error('No jobId returned from backend');
  }
  
  return { jobId: result.jobId };
};

// Poll backend for job status/result
export const getJobStatus = async (jobId: string): Promise<{ status: string; result?: any }> => {
  // Get authenticated headers
  const headers = await getAuthenticatedHeaders();
  
  const response = await fetch(`/.netlify/functions/api-status?jobId=${encodeURIComponent(jobId)}`, {
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