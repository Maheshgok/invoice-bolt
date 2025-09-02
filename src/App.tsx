import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import AuthCallback from './components/AuthCallback';
import LoginButton from './components/LoginButton';
import UserProfile from './components/UserProfile';
import EnvTest from './components/EnvTest';
import JobStatusPanel from './components/JobStatusPanel';
import AuthGuard from './components/AuthGuard';
import TokenDebugPanel from './components/TokenDebugPanel';
import { uploadImages, getJobStatus } from './services/api';
import { FileText, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';


const MainApp: React.FC = (): React.ReactNode => {
  const [files, setFiles] = useState<File[]>([]);
  const [jobStatus, setJobStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  const [result, setResult] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user, loading, logout } = useAuth();



  const handleFilesChange = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setError(null);
  }, []);


  // Start processing: upload files to Cloud Run and queue for review
  // Upload images and start job
  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setError(null);
    setJobStatus('idle');
    setResult(null);
    try {
      const { jobId } = await uploadImages(files);
      if (!jobId) throw new Error('No jobId received');
      setJobStatus('pending');
      // Start polling for job status
      pollJobStatus(jobId);
      setFiles([]);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setJobStatus('failed');
    } finally {
      setIsUploading(false);
    }
  }, [files]);

  // Poll job status
  const pollJobStatus = useCallback((jobId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // ~60 seconds if interval is 2s
    const interval = 2000;
    const poll = async () => {
      try {
        const resp = await getJobStatus(jobId);
        if (resp.status === 'completed') {
          setJobStatus('completed');
          setResult(resp.result);
        } else if (resp.status === 'failed') {
          setJobStatus('failed');
          setError('Job failed');
        } else {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, interval);
          } else {
            setJobStatus('failed');
            setError('Job polling timed out');
          }
        }
      } catch (err) {
        setJobStatus('failed');
        setError('Error polling job status');
      }
    };
    poll();
  }, []);

  const handleDownload = useCallback(() => {
    if (result) {
      console.log('Download initiated');
    }
  }, [result]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <FileText className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invoice Parser</h1>
          <p className="text-gray-600 mb-6">
            Sign in with your Google account to start processing invoices and documents.
          </p>
          <EnvTest />
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <LoginButton className="w-full justify-center" disabled={loading} />
          <div className="mt-4 text-xs text-gray-500">
            <p>Environment: {import.meta.env.MODE}</p>
            <p>Client ID configured: {import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Invoice Parser</h1>
            </div>
            <p className="text-gray-600">
              Upload invoices, receipts, or documents to extract and analyze data
            </p>
          </div>
          {user && <UserProfile user={user} onLogout={logout} />}
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

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Images</h2>
          <FileUpload
            files={files}
            onFilesChange={handleFilesChange}
            onUpload={handleUpload}
            isUploading={isUploading}
          />
        </div>

        {/* Job Status Panel */}
        {jobStatus !== 'idle' && (
          <JobStatusPanel status={jobStatus} error={error} />
        )}

        {/* Result Table */}
        {jobStatus === 'completed' && result && Array.isArray(result) && result.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Processed Data Table</h2>
            <DataTable
              data={result}
              isLoading={false}
              onDownloadCSV={handleDownload}
            />
          </div>
        )}

        {/* Token Debug Panel - only show when authenticated */}
        {user && (
          <div className="mt-8">
            <TokenDebugPanel />
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Supported formats: JPG, PNG, GIF, PDF • Secure processing with Google authentication</p>
        </div>
      </div>
    </div>
  );
};

// Login page component
const LoginPage: React.FC = () => {
  const { error, loading } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <FileText className="w-16 h-16 text-blue-600 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Invoice Parser</h1>
        <p className="text-gray-600 mb-6">
          Sign in with your Google account to start processing invoices and documents.
        </p>
        <EnvTest />
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        <LoginButton className="w-full justify-center" disabled={loading} />
        <div className="mt-4 text-xs text-gray-500">
          <p>Environment: {import.meta.env.MODE}</p>
          <p>Client ID configured: {import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  const { isAuthenticated, loading } = useAuth();
  
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/oauth2/callback" element={<AuthCallback />} />
        
        {/* Conditionally render main app or login page */}
        <Route
          path="/"
          element={
            loading ? (
              <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
            ) : isAuthenticated ? (
              <MainApp />
            ) : (
              <LoginPage />
            )
          }
        />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <AuthGuard>
            <MainApp />
          </AuthGuard>
        } />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;