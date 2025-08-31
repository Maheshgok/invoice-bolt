import React from 'react';

interface JobStatusPanelProps {
  status: string;
  error?: string | null;
}

const JobStatusPanel: React.FC<JobStatusPanelProps> = ({ status, error }) => {
  return (
    <div className="mb-6 p-4 bg-gray-50 border rounded-lg flex items-center gap-3">
      {status === 'pending' && <span className="text-blue-600">Processing...</span>}
      {status === 'completed' && <span className="text-green-600">Job completed!</span>}
      {status === 'failed' && <span className="text-red-600">Job failed</span>}
      {error && <span className="text-red-600 ml-2">{error}</span>}
    </div>
  );
};

export default JobStatusPanel;
