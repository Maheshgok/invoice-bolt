import React, { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import { uploadFiles, ApiResponse } from './services/api';
import { FileText, AlertCircle } from 'lucide-react';

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChange = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setError(null);
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const response: ApiResponse = await uploadFiles(files);
      
      if (response.success && response.data) {
        setData(response.data);
        setFiles([]); // Clear files after successful upload
      } else {
        setError(response.message || 'Upload failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsUploading(false);
    }
  }, [files]);

  const handleDownloadCSV = useCallback(() => {
    // This function is called after CSV download is initiated
    console.log('CSV download initiated');
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">File Processor</h1>
          </div>
          <p className="text-gray-600">
            Upload images, PDFs, or folders to process and analyze your files
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Upload Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Files</h2>
            <FileUpload
              files={files}
              onFilesChange={handleFilesChange}
              onUpload={handleUpload}
              isUploading={isUploading}
            />
          </div>

          {/* Data Display Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Processing Results</h2>
            <DataTable
              data={data}
              isLoading={isUploading}
              onDownloadCSV={handleDownloadCSV}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Supported formats: JPG, PNG, GIF, PDF • Maximum file size: 10MB per file</p>
        </div>
      </div>
    </div>
  );
}

export default App;