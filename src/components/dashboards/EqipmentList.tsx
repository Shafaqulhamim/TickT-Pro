import React, { useEffect, useState } from 'react';
import { FaPlus, FaTools, FaTrash } from 'react-icons/fa';
import CreateEquipmentDialog from './CreateEquipmentDialog';

type Equipment = {
  id: number;
  name: string;
  model?: string;
  serial_number?: string;
  specifications?: string;
};

const EqipmentList: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchEquipments = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch('/api/equipment', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch equipment'))
      .then(data => setEquipments(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to fetch equipment'))
      .finally(() => setLoading(false));
  };
const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/equipment/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      setEquipments(equipments => equipments.filter(eq => eq.id !== id));
    } else {
      alert('Failed to delete equipment');
    }
  };
  useEffect(() => {
    fetchEquipments();
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex items-center justify-between bg-[#7B8794] px-8 py-4">
        <span className="text-white text-2xl font-[Quicksand] font-semibold flex-1 text-center">Equipment</span>
        <button
          className="text-white text-3xl font-bold"
          title="Add Equipment"
          onClick={() => setDialogOpen(true)}
        >
          <FaPlus />
        </button>
      </header>
     <div className="p-8">
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}
        <div className="flex flex-col gap-6">
          {equipments.map(eq => (
            <div key={eq.id} className="flex items-center bg-gray-300 rounded-xl px-8 py-6 gap-6">
              <FaTools className="text-5xl" />
              <div className="flex-1">
                <div className="text-xl font-bold font-[Quicksand]">{eq.name}</div>
                <div className="font-[Quicksand]">
                  {eq.model ? `Model: ${eq.model}` : ''}
                  {eq.serial_number ? ` | SN: ${eq.serial_number}` : ''}
                  {/* {eq.status ? ` | Status: ${eq.status}` : ''} */}
                  {eq.specifications ? ` | ${eq.specifications}` : ''}
                </div>
              </div>
              <button
                className="ml-6 text-red-500 text-2xl hover:text-red-700"
                title="Delete equipment"
                onClick={() => handleDelete(eq.id)}
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      </div>
      <CreateEquipmentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={() => {
          setDialogOpen(false);
          fetchEquipments();
        }}
      />
    </div>
  );
};

export default EqipmentList;
