import React, { useState } from 'react';

type CreateEquipmentDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

const CreateEquipmentDialog: React.FC<CreateEquipmentDialogProps> = ({ open, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [status, setStatus] = useState('active');
  const [specifications, setSpecifications] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/equipment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          model,
          serial_number: serialNumber,
          installation_date: installationDate,
          warranty_expiry: warrantyExpiry,
          status,
          specifications,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || 'Failed to create equipment');
      }
      setLoading(false);
      if (onCreated) onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl">
        <header className="bg-[#7B8794] py-4 px-8 rounded-t-lg flex justify-center items-center">
          <h1 className="text-center text-white text-2xl font-semibold font-[Quicksand] flex-1">Add Equipment</h1>
          <button onClick={onClose} className="text-white text-3xl font-bold">&times;</button>
        </header>
        <form className="flex flex-col gap-4 px-8 py-8 rounded-b-lg" onSubmit={handleSubmit}>
          <input
            className="w-full bg-gray-300 rounded px-4 py-2"
            placeholder="Equipment Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            className="w-full bg-gray-300 rounded px-4 py-2"
            placeholder="Model"
            value={model}
            onChange={e => setModel(e.target.value)}
          />
          <input
            className="w-full bg-gray-300 rounded px-4 py-2"
            placeholder="Serial Number"
            value={serialNumber}
            onChange={e => setSerialNumber(e.target.value)}
          />
          {/* <input
            className="w-full bg-gray-300 rounded px-4 py-2"
            type="date"
            placeholder="Installation Date"
            value={installationDate}
            onChange={e => setInstallationDate(e.target.value)}
          />
          <input
            className="w-full bg-gray-300 rounded px-4 py-2"
            type="date"
            placeholder="Warranty Expiry"
            value={warrantyExpiry}
            onChange={e => setWarrantyExpiry(e.target.value)}
          /> */}
          <select
            className="w-full bg-gray-300 rounded px-4 py-2"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
          <textarea
            className="w-full bg-gray-300 rounded px-4 py-2"
            placeholder="Specifications"
            value={specifications}
            onChange={e => setSpecifications(e.target.value)}
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="mt-4 bg-[#7B8794] text-white font-[Quicksand] text-xl rounded px-8 py-2 mx-auto"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEquipmentDialog;