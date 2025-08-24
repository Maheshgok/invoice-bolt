import React, { useEffect, useState } from 'react';

interface Service {
  name: string;
  status: string;
  uptime: string;
}

interface Metrics {
  [key: string]: string | number;
}

interface ApiStatusResponse {
  status: string;
  version: string;
  lastUpdated: string;
  services: Service[];
  metrics: Metrics;
}

const ResponseDisplay: React.FC = () => {
  const [data, setData] = useState<ApiStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/.netlify/functions/api-status')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">API Status</h3>
          {data?.status && (
            <span className={`px-2 py-1 text-xs rounded-full ${data.status === 'operational' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {data.status}
            </span>
          )}
        </div>
        {data?.lastUpdated && (
          <p className="text-sm text-gray-500">Last updated: {new Date(data.lastUpdated).toLocaleString()}</p>
        )}
      </div>
      
      {data?.services && (
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-700 mb-2">Services</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.services.map((service: Service, index: number) => (
              <div key={index} className="border rounded p-2 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{service.name}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${service.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {service.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Uptime: {service.uptime}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {data?.metrics && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-2">Metrics</h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            {Object.entries(data.metrics).map(([key, value]: [string, string | number], index: number) => (
              <div key={index} className="border rounded p-2 bg-gray-50">
                <p className="text-xs text-gray-500">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</p>
                <p className="font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <details className="mt-4">
        <summary className="text-sm text-blue-600 cursor-pointer">View Raw JSON</summary>
        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-60">{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  );
};

export default ResponseDisplay;
