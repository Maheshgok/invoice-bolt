// API service for file upload and processing
import { authService } from './auth';

export interface ApiResponse {
  success: boolean;
  data?: Record<string, any>[];
  message?: string;
}

export const uploadFiles = async (files: File[]): Promise<ApiResponse> => {
  try {
    const accessToken = authService.getAccessToken();
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });

    // Replace with your actual API endpoint
    const response = await fetch('/api/upload-process', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Upload error:', error);
    
    // Mock response for demonstration - replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate different responses based on authentication
        const mockData = generateMockInvoiceData();
        resolve({
          success: true,
          data: mockData,
        });
      }, 2000);
    });
  }
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