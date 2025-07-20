// API service for file upload and processing
export interface ApiResponse {
  success: boolean;
  data?: Record<string, any>[];
  message?: string;
}

export const uploadFiles = async (files: File[]): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });

    // Replace with your actual API endpoint
    const response = await fetch('/api/upload-process', {
      method: 'POST',
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
        resolve({
          success: true,
          data: generateMockData(),
        });
      }, 2000);
    });
  }
};

// Mock data generator for demonstration
const generateMockData = (): Record<string, any>[] => {
  const mockData = [];
  const columns = ['ID', 'Name', 'Type', 'Size', 'Status', 'Date', 'Category', 'Score'];
  
  for (let i = 1; i <= 50; i++) {
    mockData.push({
      'ID': `${String(i).padStart(3, '0')}`,
      'Name': `Item ${i}`,
      'Type': ['PDF', 'Image', 'Document'][Math.floor(Math.random() * 3)],
      'Size': `${(Math.random() * 1000).toFixed(2)} KB`,
      'Status': ['Processed', 'Pending', 'Error'][Math.floor(Math.random() * 3)],
      'Date': new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString(),
      'Category': ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
      'Score': (Math.random() * 100).toFixed(2),
    });
  }
  
  return mockData;
};