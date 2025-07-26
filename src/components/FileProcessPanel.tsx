import React, { useState } from 'react';

interface FileProcessPanelProps {
  file: File;
  initialData: Array<Record<string, any>>;
  onProceed: (data: Array<Record<string, any>>) => void;
  isLast: boolean;
}

const getDefaultData = () => [
  { Field: 'Invoice Number', Value: 'INV-001' },
  { Field: 'Date', Value: '2025-07-26' },
  { Field: 'Amount', Value: '$100.00' },
];


const FileProcessPanel: React.FC<FileProcessPanelProps> = ({ file, initialData, onProceed, isLast }: FileProcessPanelProps) => {
  const [data, setData] = useState<Array<Record<string, any>>>(initialData.length ? initialData : getDefaultData());
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleFieldChange = (rowIdx: number, key: string, value: string): void => {
    setData((prev: Array<Record<string, any>>) => prev.map((row: Record<string, any>, idx: number) => idx === rowIdx ? { ...row, [key]: value } : row));
  };

  const handleAddRow = (): void => {
    setData((prev: Array<Record<string, any>>) => [...prev, { Field: '', Value: '' }]);
  };

  const handleAddColumn = (): void => {
    setData((prev: Array<Record<string, any>>) => prev.map((row: Record<string, any>) => ({ ...row, [`Extra${Object.keys(row).length}`]: '' })));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex gap-8">
      <div className="w-1/3">
        <h3 className="font-semibold mb-2">File</h3>
        <div className="p-2 border rounded text-sm text-gray-700 bg-gray-50">{file.name}</div>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold mb-2">Extracted Data</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr>
                {Object.keys(data[0] || { Field: '', Value: '' }).map((col, i) => (
                  <th key={i} className="border px-2 py-1 bg-gray-100">{col}</th>
                ))}
                {isEditing && <th className="border px-2 py-1 bg-gray-100">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {Object.entries(row).map(([col, val], colIdx) => (
                    <td key={colIdx} className="border px-2 py-1">
                      {isEditing ? (
                        <input
                          className="border rounded px-1 py-0.5 w-full"
                          value={val}
                          onChange={e => handleFieldChange(rowIdx, col, e.target.value)}
                        />
                      ) : (
                        val
                      )}
                    </td>
                  ))}
                  {isEditing && (
                    <td className="border px-2 py-1 text-center">
                      <button
                        className="text-xs text-red-500 hover:underline"
                        onClick={() => setData((prev: Array<Record<string, any>>) => prev.filter((_, idx: number) => idx !== rowIdx))}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isEditing && (
          <div className="flex gap-2 mt-2">
            <button className="px-2 py-1 bg-blue-100 rounded text-xs" onClick={handleAddRow}>Add Row</button>
            <button className="px-2 py-1 bg-blue-100 rounded text-xs" onClick={handleAddColumn}>Add Column</button>
          </div>
        )}
        <div className="flex gap-3 mt-4">
          <button
            className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => setIsEditing(e => !e)}
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
          <button
            className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => onProceed(data)}
            disabled={isEditing}
          >
            {isLast ? 'Finish' : 'Proceed'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileProcessPanel;
