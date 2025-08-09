import React, { useEffect, useState } from 'react';

type User = { id: number; name: string };
type Equipment = { id: number; name: string };

const CreateTicketDialog: React.FC<{ open: boolean; onClose: () => void; onCreated?: () => void }> = ({
  open,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [description, setDescription] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [location, setLocation] = useState('');
  const [engineerId, setEngineerId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [progress, setProgress] = useState('');
  const [customers, setCustomers] = useState<User[]>([]);
  const [engineers, setEngineers] = useState<User[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Get user role and id from localStorage (or context if you use it)
  const userRole = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');
  console.log('User Role:', userRole, 'User ID:', userId);

  useEffect(() => {
    if (!open) return;
    setFetchError(null);
    const token = localStorage.getItem('token');
    if (userRole !== 'customer') {
      fetch('/api/users?role=customer', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch customers'))
        .then(setCustomers)
        .catch(() => {
          setCustomers([]);
          setFetchError('Could not load customers');
        });
      fetch('/api/users?role=engineer', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch engineers'))
        .then(setEngineers)
        .catch(() => {
          setEngineers([]);
          setFetchError('Could not load engineers');
        });
    }
    fetch('/api/equipment', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch equipment'))
      .then(data => Array.isArray(data) ? setEquipments(data) : setEquipments([]))
      .catch(() => {
        setEquipments([]);
        setFetchError('Could not load equipment');
      });
    // Set customerId for customer role
    if (userRole === 'customer' && userId) {
      setCustomerId(userId);
    }
  }, [open, userRole, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');
    await fetch('/api/tickets/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        title,
        description,
        customer_id: userRole === 'customer' ? userId : customerId,
        engineer_id: userRole === 'customer' ? undefined : engineerId,
        equipment_id: equipmentId,
        location,
        deadline,
        progress,
      }),
    });
    setLoading(false);
    if (onCreated) onCreated();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        <header className="bg-[#7B8794] py-3 px-8 rounded-t-lg flex justify-between items-center">
          <h1 className="text-center text-white text-2xl font-semibold font-[Quicksand] flex-1">Ticket Creation</h1>
          <button onClick={onClose} className="text-white text-3xl font-bold">&times;</button>
        </header>
        <form className="px-8 py-8 rounded-b-lg" onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              className="w-full bg-gray-300 rounded px-4 py-2 mb-2"
              placeholder="Ticket Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
            {/* Hide customer dropdown for customer role */}
            {userRole !== 'customer' && (
              <select
                className="w-full bg-gray-300 rounded px-4 py-2 mb-2"
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                required
              >
                <option value="">Customer Name</option>
                {(customers || []).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <textarea
              className="w-full bg-gray-300 rounded px-4 py-2 mb-2"
              placeholder="Details"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
            <select
              className="w-full bg-gray-300 rounded px-4 py-2 mb-2"
              value={equipmentId}
              onChange={e => setEquipmentId(e.target.value)}
            >
              <option value="">Equipments</option>
              {(equipments || []).map(eq => (
                <option key={eq.id} value={eq.id}>{eq.name}</option>
              ))}
            </select>
            <input
              className="w-full bg-gray-300 rounded px-4 py-2 mb-2"
              placeholder="Location/Address"
              value={location}
              onChange={e => setLocation(e.target.value)}
              required
            />
            {/* Hide engineer dropdown for customer role */}
            {userRole !== 'customer' && (
              <select
                className="w-full bg-gray-300 rounded px-4 py-2 mb-2"
                value={engineerId}
                onChange={e => setEngineerId(e.target.value)}
              >
                <option value="">Engineer</option>
                {(engineers || []).map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            )}
          {userRole !== 'customer' && (
  <input
    className="w-full bg-gray-300 rounded px-4 py-2 mb-2"
    placeholder="Deadline"
    type="date"
    value={deadline}
    onChange={e => setDeadline(e.target.value)}
  />
)}

            {/* <input
              className="w-full bg-gray-300 rounded px-4 py-2 mb-2"
              placeholder="Progress"
              value={progress}
              onChange={e => setProgress(e.target.value)}
            /> */}
          </div>
          {fetchError && <div className="text-red-500 text-sm mb-4">{fetchError}</div>}
          <button
            type="submit"
            className="w-full bg-[#7B8794] text-white text-xl font-semibold py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketDialog;