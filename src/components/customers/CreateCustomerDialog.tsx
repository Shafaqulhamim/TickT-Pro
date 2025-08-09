import React, { useState } from 'react';

type CreateCustomerDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

const CreateCustomerDialog: React.FC<CreateCustomerDialogProps> = ({ open, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          address,
          password,   // Pass the password
          role: 'customer',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || 'Failed to create customer');
      }
      setLoading(false);
      if (onCreated) onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center bg-[#7B8794] rounded-t-lg px-8 py-4">
          <span className="text-white text-3xl mr-6">&#9776;</span>
          <h2 className="flex-1 text-center text-white text-2xl font-semibold font-[Quicksand]">Customer Creation</h2>
          <button onClick={onClose} className="text-white text-3xl font-bold ml-6">&times;</button>
        </div>
        {/* Form */}
        <form className="px-8 py-8" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <input
              className="bg-gray-300 rounded px-4 py-2"
              placeholder="Customer Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <input
              className="bg-gray-300 rounded px-4 py-2"
              placeholder="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              className="bg-gray-300 rounded px-4 py-2"
              placeholder="Phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <input
              className="bg-gray-300 rounded px-4 py-2"
              placeholder="Address"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
            <input
              className="bg-gray-300 rounded px-4 py-2"
              placeholder="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-red-500 text-center mt-4">{error}</div>}
          <div className="flex justify-center mt-8">
            <button
              type="submit"
              className="bg-[#7B8794] text-white text-xl font-semibold px-12 py-2 rounded"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCustomerDialog;
