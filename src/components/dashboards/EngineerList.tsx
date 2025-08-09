import React, { useEffect, useState } from 'react';
import { FaTrash, FaUserCog } from 'react-icons/fa';

type Engineer = {
  id: number;
  name: string;
  specialization?: string;
};

type EngineerListProps = {
  onCreateEngineer: () => void;
};

const EngineerList: React.FC<EngineerListProps> = ({ onCreateEngineer }) => {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEngineers();
  }, []);

  const fetchEngineers = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch('/api/users?role=engineer', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch engineers'))
      .then(data => setEngineers(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to fetch engineers'))
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this engineer?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Delete failed');
      // Remove from UI
      setEngineers(engineers.filter(e => e.id !== id));
    } catch {
      alert('Failed to delete engineer');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex items-center justify-between bg-[#7B8794] px-8 py-4">
        <span className="text-white text-2xl font-[Quicksand] font-semibold flex-1 text-center">Engineers</span>
        <button className="text-white text-3xl font-bold" onClick={onCreateEngineer}>+</button>
      </header>
      <div className="p-8">
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}
        <div className="flex flex-col gap-6">
          {engineers.map(engineer => (
            <div key={engineer.id} className="flex items-center bg-gray-300 rounded-xl px-8 py-6 gap-6">
              <FaUserCog className="text-5xl" />
              <div className="flex-1">
                <div className="text-xl font-bold font-[Quicksand]">{engineer.name}</div>
                <div className="font-[Quicksand] text-gray-700">
                  {engineer.specialization ? engineer.specialization : <span className="text-gray-500 italic">N/A</span>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(engineer.id)}
                className="text-red-600 text-xl ml-4 hover:text-red-800"
                title="Delete"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EngineerList;
