import React, { useState, useEffect } from 'react';

interface AsyncJobPanelProps {
  startJob: () => Promise<{ jobId: string }>; // Function to start the job and return jobId
  getStatus: (jobId: string) => Promise<{ status: string; result?: any }>; // Function to poll job status
}

const POLL_INTERVAL = 2000; // ms

const AsyncJobPanel: React.FC<AsyncJobPanelProps> = ({ startJob, getStatus }) => {
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let poller: number | null = null;
    if (jobId && loading) {
      poller = setInterval(async () => {
        try {
          const statusResp = await getStatus(jobId);
          if (statusResp.status === 'completed') {
            setResult(statusResp.result);
            setLoading(false);
            if (poller) clearInterval(poller);
          } else if (statusResp.status === 'failed') {
            setError('Job failed');
            setLoading(false);
            if (poller) clearInterval(poller);
          }
        } catch (err) {
          setError('Error polling job status');
          setLoading(false);
          if (poller) clearInterval(poller);
        }
      }, POLL_INTERVAL);
    }
    return () => {
      if (poller) clearInterval(poller);
    };
  }, [jobId, loading, getStatus]);

  const handleStart = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const resp = await startJob();
      setJobId(resp.jobId);
    } catch (err) {
      setError('Error starting job');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow">
      <button onClick={handleStart} disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded">
        Start Job
      </button>
      {loading && <div className="mt-2">Processing... <span className="animate-spin">🔄</span></div>}
      {error && <div className="mt-2 text-red-500">{error}</div>}
      {result && (
        <div className="mt-4">
          <h3 className="font-bold mb-2">Result:</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default AsyncJobPanel;
